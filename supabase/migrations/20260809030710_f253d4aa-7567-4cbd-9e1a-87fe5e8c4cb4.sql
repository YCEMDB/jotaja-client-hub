-- FASE 18: BUSINESS CONTINUITY & BACKUP ASSURANCE

-- Enum for Backup Status
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_status') THEN
        CREATE TYPE public.backup_status AS ENUM (
            'EXPECTED',
            'CREATED',
            'AVAILABLE',
            'VERIFIED',
            'EXPIRED',
            'MISSING',
            'CORRUPTED',
            'FAILED'
        );
    END IF;
END $$;

-- Enum for Checksum Result
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checksum_result') THEN
        CREATE TYPE public.checksum_result AS ENUM (
            'VALID',
            'INVALID',
            'NOT_AVAILABLE',
            'NOT_VERIFIED'
        );
    END IF;
END $$;

-- Enum for Restore Drill Result
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'restore_drill_result') THEN
        CREATE TYPE public.restore_drill_result AS ENUM (
            'PLANNED',
            'RUNNING',
            'PASSED',
            'FAILED',
            'CANCELLED',
            'NOT_VERIFIED'
        );
    END IF;
END $$;

-- Enum for Recovery Readiness
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recovery_readiness_status') THEN
        CREATE TYPE public.recovery_readiness_status AS ENUM (
            'READY',
            'DEGRADED',
            'NOT_READY',
            'UNKNOWN'
        );
    END IF;
END $$;

-- 1. Backup Inventory
CREATE TABLE IF NOT EXISTS public.backup_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE, -- NULL for global/platform backups
    external_id TEXT, -- ID from provider (Supabase, AWS, etc)
    provider TEXT NOT NULL,
    source TEXT NOT NULL,
    scope TEXT NOT NULL,
    environment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    size_bytes BIGINT,
    checksum TEXT,
    status public.backup_status NOT NULL DEFAULT 'EXPECTED',
    retention_until TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    evidence JSONB DEFAULT '{}'::jsonb,
    
    -- Idempotency constraint
    CONSTRAINT backup_inventory_unique_provider_ext_id UNIQUE (provider, external_id)
);

GRANT SELECT, INSERT, UPDATE ON public.backup_inventory TO authenticated;
GRANT ALL ON public.backup_inventory TO service_role;
ALTER TABLE public.backup_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all backups"
    ON public.backup_inventory FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- 2. Backup Verification Logs
CREATE TABLE IF NOT EXISTS public.backup_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID NOT NULL REFERENCES public.backup_inventory(id) ON DELETE CASCADE,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status public.backup_status NOT NULL,
    checksum_status public.checksum_result NOT NULL DEFAULT 'NOT_VERIFIED',
    observed_checksum TEXT,
    duration_ms INTEGER,
    error_message TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    integrity_reference_id UUID -- Link to Phase 17 Proof of Integrity
);

GRANT SELECT, INSERT ON public.backup_verification_logs TO authenticated;
GRANT ALL ON public.backup_verification_logs TO service_role;
ALTER TABLE public.backup_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all verification logs"
    ON public.backup_verification_logs FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- 3. Restore Drills
CREATE TABLE IF NOT EXISTS public.restore_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID NOT NULL REFERENCES public.backup_inventory(id) ON DELETE CASCADE,
    environment TEXT NOT NULL,
    drill_type TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    operator_id UUID REFERENCES auth.users(id),
    result public.restore_drill_result NOT NULL DEFAULT 'PLANNED',
    observed_rpo_seconds INTEGER,
    observed_rto_seconds INTEGER,
    evidence JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    integrity_reference_id UUID
);

GRANT SELECT, INSERT, UPDATE ON public.restore_drills TO authenticated;
GRANT ALL ON public.restore_drills TO service_role;
ALTER TABLE public.restore_drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all drills"
    ON public.restore_drills FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- 4. Recovery Readiness Snapshots
CREATE TABLE IF NOT EXISTS public.recovery_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status public.recovery_readiness_status NOT NULL,
    readiness_score NUMERIC(5,2) NOT NULL, -- 0-100
    details JSONB NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE -- NULL for global
);

GRANT SELECT, INSERT ON public.recovery_readiness_snapshots TO authenticated;
GRANT ALL ON public.recovery_readiness_snapshots TO service_role;
ALTER TABLE public.recovery_readiness_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all readiness snapshots"
    ON public.recovery_readiness_snapshots FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. Recovery SLA/Metrics
CREATE TABLE IF NOT EXISTS public.recovery_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    target_value INTEGER, -- in seconds
    observed_value INTEGER, -- in seconds
    measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL, -- WITHIN_TARGET, BREACHED, etc
    metadata JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.recovery_metrics TO authenticated;
GRANT ALL ON public.recovery_metrics TO service_role;
ALTER TABLE public.recovery_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all recovery metrics"
    ON public.recovery_metrics FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));
