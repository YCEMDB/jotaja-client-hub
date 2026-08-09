import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { IntegrityService } from "./integrity/integrity.service";
import { supabase } from "@/integrations/supabase/client";

export const getIntegrityStatus = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ restaurantId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: chains, error } = await supabase
      .from('integrity_chains')
      .select('*')
      .eq('restaurant_id', data.restaurantId);
    
    if (error) throw error;
    return chains;
  });

export const verifyChainIntegrity = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ chainId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return await IntegrityService.verifyChain(data.chainId);
  });
