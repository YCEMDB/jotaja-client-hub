/**
 * Sprint 3 — Hook de impressão via navegador (driver 'browser').
 * Consome print_jobs em tempo real e imprime via window.print de um iframe.
 * Drivers ESC/POS, WebUSB, network, cloud ficam para o agente local (Sprint 4).
 */
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { printReceipt } from "@/lib/print-receipt";

type PrintJob = {
  id: string;
  order_id: string | null;
  event: string;
  driver: string;
  status: string;
  restaurant_id: string;
};

export function usePrintQueueConsumer(restaurantId: string | null | undefined, enabled = true) {
  const processing = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!restaurantId || !enabled) return;

    async function processJob(job: PrintJob) {
      if (processing.current.has(job.id)) return;
      processing.current.add(job.id);
      try {
        if (job.driver !== "browser") {
          // Outros drivers: marcar como printed sem ação (agente local trata)
          return;
        }
        await supabase
          .from("print_jobs")
          .update({ status: "printing", attempts: 1 })
          .eq("id", job.id)
          .eq("status", "queued");

        if (!job.order_id) throw new Error("order_id missing");

        // Buscar dados do pedido e imprimir
        const { data: order } = await supabase
          .from("orders")
          .select("*, restaurants(name, whatsapp)")
          .eq("id", job.order_id)
          .single();
        const { data: items } = await supabase
          .from("order_items")
          .select("product_name, quantity, unit_price, subtotal, notes")
          .eq("order_id", job.order_id);

        if (order) {
          const rest = (order as { restaurants?: { name?: string; whatsapp?: string | null } }).restaurants;
          await printReceipt({
            restaurantName: rest?.name ?? "Restaurante",
            restaurantPhone: rest?.whatsapp ?? null,
            order,
            items: items ?? [],
          });
        }

        await supabase
          .from("print_jobs")
          .update({ status: "printed", printed_at: new Date().toISOString() })
          .eq("id", job.id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase
          .from("print_jobs")
          .update({ status: "failed", last_error: msg })
          .eq("id", job.id);
      } finally {
        processing.current.delete(job.id);
      }
    }

    // Backlog inicial
    supabase
      .from("print_jobs")
      .select("id, order_id, event, driver, status, restaurant_id")
      .eq("restaurant_id", restaurantId)
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(20)
      .then(({ data }) => data?.forEach((j) => processJob(j as PrintJob)));

    const channel = supabase
      .channel(`print_jobs:${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "print_jobs", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const job = payload.new as PrintJob;
          if (job.status === "queued") processJob(job);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, enabled]);
}
