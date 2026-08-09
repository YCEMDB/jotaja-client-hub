-- Phase 17: Platform Data Integrity & Audit Traceability

-- 1. Integrity Chains
CREATE TABLE IF NOT EXISTS public.integrity_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    chain_type TEXT NOT NULL, 
    genesis_hash TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'sha256',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT, UPDATE ON public.integrity_chains TO authenticated;
GRANT ALL ON public.integrity_chains TO service_role;

ALTER TABLE public.integrity_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all integrity chains"
ON public.integrity_chains FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants can see their own integrity chains"
ON public.integrity_chains FOR SELECT TO authenticated
USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
));

-- 2. Integrity Records (Proof of Integrity)
CREATE TABLE IF NOT EXISTS public.integrity_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID REFERENCES public.integrity_chains(id) ON DELETE CASCADE NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    payload_hash TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    sequence_number BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (chain_id, sequence_number)
);

CREATE INDEX idx_integrity_records_chain_seq ON public.integrity_records(chain_id, sequence_number);
CREATE INDEX idx_integrity_records_entity ON public.integrity_records(entity_type, entity_id);

GRANT SELECT, INSERT ON public.integrity_records TO authenticated;
GRANT ALL ON public.integrity_records TO service_role;

ALTER TABLE public.integrity_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all integrity records"
ON public.integrity_records FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants can see their own integrity records"
ON public.integrity_records FOR SELECT TO authenticated
USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
));

-- 3. Reconciliation Findings
CREATE TABLE IF NOT EXISTS public.reconciliation_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    check_type TEXT NOT NULL, 
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium', 
    status TEXT NOT NULL DEFAULT 'open', 
    divergence_data JSONB NOT NULL,
    expected_data JSONB,
    actual_data JSONB,
    correlation_id UUID,
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reconciliation_findings_restaurant ON public.reconciliation_findings(restaurant_id);
CREATE INDEX idx_reconciliation_findings_status ON public.reconciliation_findings(status);
CREATE INDEX idx_reconciliation_findings_entity ON public.reconciliation_findings(entity_type, entity_id);

GRANT SELECT, INSERT, UPDATE ON public.reconciliation_findings TO authenticated;
GRANT ALL ON public.reconciliation_findings TO service_role;

ALTER TABLE public.reconciliation_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can manage all reconciliation findings"
ON public.reconciliation_findings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants can see their own reconciliation findings"
ON public.reconciliation_findings FOR SELECT TO authenticated
USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
));

-- 4. Integrity Verification Results (Audit Vault)
CREATE TABLE IF NOT EXISTS public.integrity_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID REFERENCES public.integrity_chains(id) ON DELETE CASCADE NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL, 
    error_details JSONB,
    last_verified_sequence BIGINT,
    verification_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    verified_by UUID REFERENCES auth.users(id)
);

GRANT SELECT, INSERT ON public.integrity_verification_logs TO authenticated;
GRANT ALL ON public.integrity_verification_logs TO service_role;

ALTER TABLE public.integrity_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can see all verification logs"
ON public.integrity_verification_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenants can see their own verification logs"
ON public.integrity_verification_logs FOR SELECT TO authenticated
USING (restaurant_id IN (
    SELECT restaurant_id FROM public.profiles WHERE id = auth.uid()
));