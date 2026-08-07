-- Migration Phase 12: Automation Tables

-- 1. Create automation_jobs table
CREATE TABLE IF NOT EXISTS public.automation_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING',
    priority text NOT NULL DEFAULT 'MEDIUM',
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
    source_incident_id uuid REFERENCES public.financial_incidents(id) ON DELETE SET NULL,
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    result jsonb,
    error text,
    deduplication_key text UNIQUE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.automation_jobs TO authenticated;
GRANT ALL ON public.automation_jobs TO service_role;

-- 2. Create automation_execution_logs table
CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES public.automation_jobs(id) ON DELETE CASCADE,
    action text NOT NULL,
    result text NOT NULL,
    details jsonb,
    error text,
    created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.automation_execution_logs TO authenticated;
GRANT ALL ON public.automation_execution_logs TO service_role;

-- 3. RLS Policies
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can manage automation jobs"
    ON public.automation_jobs
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "SuperAdmins can view automation logs"
    ON public.automation_execution_logs
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "SuperAdmins can insert automation logs"
    ON public.automation_execution_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
