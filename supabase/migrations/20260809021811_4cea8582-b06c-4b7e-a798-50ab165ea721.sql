
-- Phase 15: Platform Observability, Incident Response & Disaster Recovery

-- 1. Enum for Incident Status
DO $$ BEGIN
    CREATE TYPE public.incident_status AS ENUM (
        'DETECTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'MITIGATING', 'RECOVERING', 'RESOLVED', 'CLOSED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Enum for Incident Severity
DO $$ BEGIN
    CREATE TYPE public.incident_severity AS ENUM (
        'SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Platform Incidents Table
CREATE TABLE IF NOT EXISTS public.platform_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_key TEXT UNIQUE NOT NULL, -- Correlation key
    severity public.incident_severity NOT NULL DEFAULT 'SEV-4',
    status public.incident_status NOT NULL DEFAULT 'DETECTED',
    title TEXT NOT NULL,
    description TEXT,
    root_cause TEXT,
    affected_scope TEXT NOT NULL CHECK (affected_scope IN ('GLOBAL', 'TENANT')),
    restaurant_id UUID REFERENCES auth.users(id), -- Scoped to restaurant owner if TENANT
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Grants for platform_incidents
ALTER TABLE public.platform_incidents ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.platform_incidents TO authenticated;
GRANT ALL ON public.platform_incidents TO service_role;

-- Policies (Using 'super_admin' as verified)
CREATE POLICY "SuperAdmins can see all incidents"
ON public.platform_incidents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants can see their own incidents"
ON public.platform_incidents
FOR SELECT
TO authenticated
USING (restaurant_id = auth.uid());

-- 4. Incident Timeline Table (Append-only)
CREATE TABLE IF NOT EXISTS public.platform_incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.platform_incidents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Grants for platform_incident_timeline
ALTER TABLE public.platform_incident_timeline ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.platform_incident_timeline TO authenticated;
GRANT ALL ON public.platform_incident_timeline TO service_role;

-- Policies
CREATE POLICY "SuperAdmins can see all timeline events"
ON public.platform_incident_timeline
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants can see their own incident timeline"
ON public.platform_incident_timeline
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.platform_incidents
        WHERE id = public.platform_incident_timeline.incident_id
        AND restaurant_id = auth.uid()
    )
);

-- 5. Recovery Execution Logs Table
CREATE TABLE IF NOT EXISTS public.recovery_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.platform_incidents(id),
    recovery_level TEXT NOT NULL,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED')),
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    actor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    executed_at TIMESTAMPTZ
);

-- RLS & Grants for recovery_execution_logs
ALTER TABLE public.recovery_execution_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.recovery_execution_logs TO authenticated;
GRANT ALL ON public.recovery_execution_logs TO service_role;

CREATE POLICY "SuperAdmins can manage recovery logs"
ON public.recovery_execution_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- 6. Backup Validation Logs
CREATE TABLE IF NOT EXISTS public.backup_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'BLOCKED')),
    duration_ms INTEGER,
    integrity_score INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_validation_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.backup_validation_logs TO authenticated;
GRANT ALL ON public.backup_validation_logs TO service_role;

CREATE POLICY "SuperAdmins can view backup logs"
ON public.backup_validation_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_restaurant ON public.platform_incidents(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.platform_incidents(status);
CREATE INDEX IF NOT EXISTS idx_timeline_incident ON public.platform_incident_timeline(incident_id);
CREATE INDEX IF NOT EXISTS idx_recovery_incident ON public.recovery_execution_logs(incident_id);
