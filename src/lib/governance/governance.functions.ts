import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GovernanceAuditService } from "./governance-audit.service";

export const getGovernanceEvents = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({
    event_type: z.string().optional(),
    restaurant_id: z.string().optional(),
    limit: z.number().optional().default(50),
    offset: z.number().optional().default(0)
  }).parse(data))
  .handler(async ({ data, context }) => {
    // A segurança (SuperAdmin) deve ser validada aqui ou no middleware
    // Assumindo que o middleware de auth do supabase já injetou o user
    
    return await GovernanceAuditService.getEvents({
      event_type: data.event_type as any,
      restaurant_id: data.restaurant_id,
      limit: data.limit,
      offset: data.offset
    });
  });
