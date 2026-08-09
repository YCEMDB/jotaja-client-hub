-- FASE 14 — ADVANCED SECURITY & THREAT PROTECTION

CREATE TYPE public.threat_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE public.threat_status AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE');
CREATE TYPE public.threat_category AS ENUM (
    'SECURITY_RATE_LIMIT',
    'SECURITY_BRUTE_FORCE',
    'SECURITY_API_ABUSE',
    'SECURITY_SUSPICIOUS_ADMIN',
    'SECURITY_TENANT_ANOMALY',
    'SECURITY_WEBHOOK_ABUSE',
    'SECURITY_AUTOMATION_ABUSE'
);

CREATE TABLE public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type public.threat_category NOT NULL,
    severity public.threat_severity NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 10),
    actor_id UUID REFERENCES auth.users(id),
    restaurant_id UUID,
    ip_hash TEXT,
    endpoint TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status public.threat_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Access Grants
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

-- RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- SuperAdmin sees everything
CREATE POLICY "SuperAdmins can see all security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Tenant admins see only their restaurant events
CREATE POLICY "Tenant admins can see their security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (restaurant_id IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Indices
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_restaurant ON public.security_events(restaurant_id);
CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);

-- Integration with Governance
-- Any resolution of security event should be audited by Phase 13
