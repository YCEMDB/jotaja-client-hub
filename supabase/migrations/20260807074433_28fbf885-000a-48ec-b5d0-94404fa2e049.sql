
-- Create financial_alert_events 
CREATE TABLE public.financial_alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'SUPPRESSED')),
    restaurant_id UUID REFERENCES public.restaurants(id),
    provider TEXT,
    metric_value NUMERIC,
    threshold_value NUMERIC,
    details JSONB DEFAULT '{}'::jsonb,
    deduplication_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Separate index for unique active alerts
CREATE UNIQUE INDEX idx_financial_alerts_dedup_unique_open ON public.financial_alert_events(deduplication_key) WHERE (status = 'OPEN');

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.financial_alert_events TO authenticated;
GRANT ALL ON public.financial_alert_events TO service_role;

-- Enable RLS
ALTER TABLE public.financial_alert_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SuperAdmin only
CREATE POLICY "SuperAdmins can manage all alerts"
ON public.financial_alert_events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Additional Indexes
CREATE INDEX idx_financial_alerts_status ON public.financial_alert_events(status);
CREATE INDEX idx_financial_alerts_created ON public.financial_alert_events(created_at DESC);
