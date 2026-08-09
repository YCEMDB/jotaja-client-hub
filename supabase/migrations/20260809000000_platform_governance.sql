-- FASE 13: PLATFORM GOVERNANCE & COMPLIANCE

CREATE TABLE IF NOT EXISTS public.platform_governance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    actor_role TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    restaurant_id UUID REFERENCES public.restaurants(id),
    action TEXT NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Security
ALTER TABLE public.platform_governance_events ENABLE ROW LEVEL SECURITY;

-- Proteção Append-Only: Ninguém (nem admin) pode dar UPDATE ou DELETE via API
GRANT SELECT, INSERT ON public.platform_governance_events TO authenticated;
GRANT ALL ON public.platform_governance_events TO service_role;

-- Policies
CREATE POLICY "SuperAdmins can view all governance events"
ON public.platform_governance_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_gov_events_type ON public.platform_governance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_gov_events_actor ON public.platform_governance_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_gov_events_restaurant ON public.platform_governance_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gov_events_created ON public.platform_governance_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gov_events_target ON public.platform_governance_events(target_type, target_id);

