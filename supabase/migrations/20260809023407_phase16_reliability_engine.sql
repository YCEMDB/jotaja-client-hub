-- FASE 16 - PLATFORM RELIABILITY, CAPACITY & PERFORMANCE ENGINEERING

-- 1. Performance Metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    service_name TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'GLOBAL',
    restaurant_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.performance_metrics TO authenticated;
GRANT ALL ON public.performance_metrics TO service_role;

-- 2. SLO Definitions
CREATE TABLE IF NOT EXISTS public.slo_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    service TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    target_value DOUBLE PRECISION NOT NULL,
    window_days INTEGER NOT NULL DEFAULT 30,
    severity TEXT NOT NULL DEFAULT 'WARNING',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.slo_definitions TO authenticated;
GRANT ALL ON public.slo_definitions TO service_role;

-- 3. Reliability Snapshots
CREATE TABLE IF NOT EXISTS public.reliability_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL,
    restaurant_id UUID REFERENCES auth.users(id),
    reliability_score TEXT NOT NULL,
    availability_percentage DOUBLE PRECISION,
    latency_p95_ms DOUBLE PRECISION,
    error_rate_percentage DOUBLE PRECISION,
    error_budget_remaining DOUBLE PRECISION,
    timestamp TIMESTAMPTZ DEFAULT now(),
    details JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.reliability_snapshots TO authenticated;
GRANT ALL ON public.reliability_snapshots TO service_role;

-- 4. Capacity Snapshots
CREATE TABLE IF NOT EXISTS public.capacity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL,
    current_load DOUBLE PRECISION NOT NULL,
    peak_load DOUBLE PRECISION,
    max_capacity DOUBLE PRECISION,
    headroom_percentage DOUBLE PRECISION,
    status TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    details JSONB DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.capacity_snapshots TO authenticated;
GRANT ALL ON public.capacity_snapshots TO service_role;

-- 5. Performance Recommendations
CREATE TABLE IF NOT EXISTS public.performance_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    evidence JSONB NOT NULL,
    impact_description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.performance_recommendations TO authenticated;
GRANT ALL ON public.performance_recommendations TO service_role;

-- RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slo_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reliability_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_recommendations ENABLE ROW LEVEL SECURITY;

-- Polices SuperAdmin
CREATE POLICY "SuperAdmins can manage performance metrics" 
ON public.performance_metrics FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SuperAdmins can manage slo definitions" 
ON public.slo_definitions FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SuperAdmins can manage reliability snapshots" 
ON public.reliability_snapshots FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SuperAdmins can manage capacity snapshots" 
ON public.capacity_snapshots FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SuperAdmins can manage performance recommendations" 
ON public.performance_recommendations FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Inserir SLOs
INSERT INTO public.slo_definitions (name, service, metric_name, target_value, window_days, severity)
VALUES 
('API Availability', 'API', 'AVAILABILITY', 99.9, 30, 'CRITICAL'),
('Webhook Latency', 'WEBHOOK', 'LATENCY_P95', 1000, 30, 'WARNING')
ON CONFLICT (name) DO NOTHING;
