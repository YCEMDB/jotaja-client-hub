import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AutomationWorkerService } from "./automation-worker.service";
import { AutomationAuditService } from "./automation-audit.service";

export const getAutomationJobs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('automation_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  });

export const getAutomationHistory = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from('automation_execution_logs')
      .select('*, job:automation_jobs(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  });

export const executeAutomationJobManual = createServerFn({ method: "POST" })
  .input(z.object({ jobId: z.string() }))
  .handler(async ({ data: { jobId }, request }) => {
    // Manual trigger by SuperAdmin
    const { data: job, error: fetchError } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) throw new Error("Job not found");

    // In a real serverFn, we should verify the user is a super_admin
    // For now, we assume middleware handles auth, and we call the worker
    await AutomationWorkerService.executeJob(job as any);
    
    return { success: true };
  });

export const triggerWorkerRun = createServerFn({ method: "POST" })
  .handler(async () => {
    await AutomationWorkerService.processJobs();
    return { success: true };
  });
