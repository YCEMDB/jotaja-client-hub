-- FASE 10: FINANCIAL CONTROL CENTER & ADMIN GOVERNANCE

-- 0. Garantir a função has_role (Padrão Lovable para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 1. Tabela de Incidentes Financeiros
CREATE TABLE IF NOT EXISTS public.financial_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    severity text NOT NULL,
    restaurant_id uuid REFERENCES public.restaurants(id),
    event_id text,
    details jsonb DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'OPEN',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Auditoria Administrativa
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    action text NOT NULL,
    target_resource text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT ON public.financial_incidents TO authenticated;
GRANT ALL ON public.financial_incidents TO service_role;

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

-- RLS
ALTER TABLE public.financial_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can select financial incidents"
ON public.financial_incidents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Admins can select audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = admin_id);

-- 3. RPC para métricas globais
CREATE OR REPLACE FUNCTION public.get_platform_financial_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT json_build_object(
        'total_restaurants', (SELECT count(*) FROM restaurants),
        'total_transactions', (SELECT count(*) FROM financial_transactions),
        'total_volume', (SELECT coalesce(sum(amount), 0) FROM financial_transactions WHERE status = 'SETTLED'),
        'success_rate', (
            SELECT CASE 
                WHEN count(*) = 0 THEN 1 
                ELSE (SELECT count(*) FILTER (WHERE status = 'PROCESSED'))::float / count(*) 
            END 
            FROM payment_provider_webhook_logs
        ),
        'failure_rate', (
            SELECT CASE 
                WHEN count(*) = 0 THEN 0 
                ELSE (SELECT count(*) FILTER (WHERE status = 'FAILED'))::float / count(*) 
            END 
            FROM payment_provider_webhook_logs
        ),
        'pending_events', (SELECT count(*) FROM payment_provider_webhook_logs WHERE status = 'RECEIVED')
    ) INTO result;

    RETURN result;
END;
$$;

-- 4. RPC para saúde dos providers
CREATE OR REPLACE FUNCTION public.get_providers_health_status()
RETURNS TABLE (
    provider text,
    total_events bigint,
    failed_events bigint,
    failure_rate float,
    avg_duration_ms float
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p.provider,
        count(*) as total_events,
        count(*) FILTER (WHERE status = 'FAILED') as failed_events,
        (count(*) FILTER (WHERE status = 'FAILED')::float / nullif(count(*), 0)) as failure_rate,
        avg(EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000) as avg_duration_ms
    FROM payment_provider_webhook_logs p
    WHERE created_at > now() - interval '24 hours'
      AND public.has_role(auth.uid(), 'super_admin'::public.app_role)
    GROUP BY p.provider;
$$;
