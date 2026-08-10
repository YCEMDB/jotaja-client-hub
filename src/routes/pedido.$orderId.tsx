import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createPixPayment, syncPixPayment } from "@/lib/payments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pedido/$orderId")({
  component: OrderTrackPage,
  head: () => ({
    meta: [
      { title: "Acompanhar pedido — Mesivo" },
      { name: "description", content: "Acompanhe o status do seu pedido em tempo real pela Mesivo." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Order = {
  id: string;
  order_number: number;
  status: string;
  payment: string;
  payment_status: string;
  total: number;
  customer_name: string;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  pix_expires_at: string | null;
  estimated_minutes: number | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function OrderTrackPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const createPix = useServerFn(createPixPayment);
  const syncPix = useServerFn(syncPixPayment);

  const load = async () => {
    const { data, error } = await supabase.rpc("get_public_order", { p_id: orderId });
    if (error) {
      console.error("[LOAD ORDER ERROR]", error);
      setLoading(false);
      return;
    }
    const payload = data as any;
    setOrder(payload?.order ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orderId]);

  // Auto-generate PIX once
  useEffect(() => {
    if (!order || order.payment !== "pix") return;
    if (order.pix_qr_code || order.payment_status === "paid" || generating) return;
    setGenerating(true);
    createPix({ data: { orderId } })
      .then((r) => { 
        if (!r.ok) {
          console.error("[PIX ERROR]", r);
          toast.error(r.error ?? "Erro PIX"); 
        }
      })
      .finally(() => { setGenerating(false); load(); });
  }, [order?.id]);

  // Poll every 4s: refresh order AND sync MP status (fallback if webhook não chegou)
  useEffect(() => {
    if (!order || order.payment_status === "paid") return;
    const tick = async () => {
      if (order.payment === "pix") {
        try { await syncPix({ data: { orderId } }); } catch {}
      }
      await load();
    };
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [order?.payment_status, order?.payment]);

  if (loading) return <div className="min-h-dvh grid place-items-center text-muted-foreground">Carregando pedido…</div>;
  if (!order) return (
    <div className="min-h-dvh grid place-items-center p-6 text-center bg-muted/30">
      <div className="max-w-sm">
        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
        <p className="text-muted-foreground mb-6">
          Não localizamos este pedido. Verifique se o link está completo ou peça um novo comprovante ao restaurante.
        </p>
        <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
          Ir para o início
        </a>
      </div>
    </div>
  );


  const paid = order.payment_status === "paid";
  const showPix = order.payment === "pix" && !paid;

  return (
    <div className="min-h-dvh bg-muted/30 py-6 sm:py-10 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Pedido #{order.order_number}</p>
          <h1 className="font-display text-3xl sm:text-4xl italic uppercase tracking-tight text-ink">Olá, {order.customer_name.split(" ")[0]}!</h1>
        </div>

        {paid && (
          <Card className="p-5 text-center bg-green-50 border-green-200 shadow-brutal border-2 border-ink">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
            <p className="font-display text-lg italic uppercase text-green-900">Pagamento confirmado!</p>
            <p className="text-sm text-green-700 font-medium">Já pode acompanhar o preparo abaixo.</p>
          </Card>
        )}

        {showPix && (
          <Card className="p-5 space-y-4 shadow-brutal border-2 border-ink">
            <div>
              <p className="font-display text-lg uppercase italic text-ink">Pague R$ {Number(order.total).toFixed(2)} via PIX</p>
              <p className="text-xs text-ink/60 font-bold uppercase tracking-wider">A confirmação é automática.</p>
            </div>
            {generating && <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-orange" /></div>}
            {order.pix_qr_code_base64 && (
              <div className="relative group">
                <div className="absolute inset-0 bg-brand-orange/5 blur-xl group-hover:bg-brand-orange/10 transition-all" />
                <img
                  src={`data:image/png;base64,${order.pix_qr_code_base64}`}
                  alt="QR Code PIX"
                  className="relative w-full max-w-[240px] aspect-square mx-auto border-4 border-ink rounded-2xl shadow-sm bg-white"
                />
              </div>
            )}
            {order.pix_qr_code && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">PIX copia e cola</p>
                <div className="flex gap-2">
                  <input readOnly value={order.pix_qr_code} className="flex-1 text-[10px] border-2 border-ink/20 rounded-lg px-3 py-2 bg-ink/5 font-mono truncate" />
                  <Button
                    size="sm"
                    className="h-9 px-3 bg-brand-orange text-ink border-2 border-ink shadow-[2px_2px_0_0_oklch(0.12_0.025_25)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    onClick={() => {
                      navigator.clipboard.writeText(order.pix_qr_code!);
                      toast.success("Código copiado");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {order.pix_expires_at && (
              <p className="text-[10px] text-ink/40 font-bold uppercase text-center tracking-widest">
                Expira às {new Date(order.pix_expires_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </Card>
        )}

        <Card className="p-5 space-y-4 shadow-brutal border-2 border-ink">
          <div className="flex items-center justify-between border-b-2 border-ink/5 pb-3">
            <p className="font-display text-sm uppercase italic text-ink/70">Status</p>
            <Badge className="bg-brand-orange text-ink border-2 border-ink shadow-[2px_2px_0_0_oklch(0.12_0.025_25)] text-[10px] uppercase font-bold px-2 py-1 tracking-wider">
              {STATUS_LABELS[order.status] ?? order.status}
            </Badge>
          </div>
          {order.estimated_minutes && (
            <div className="flex items-center gap-3 p-3 bg-brand-amber/10 border-2 border-brand-amber/30 rounded-xl">
              <Clock className="h-5 w-5 text-brand-amber shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase text-brand-amber/70 leading-none">Previsão</p>
                <p className="text-sm font-display italic text-ink">{order.estimated_minutes} minutos</p>
              </div>
            </div>
          )}
          <div className="pt-2">
            <div className="w-full bg-ink/5 h-2 rounded-full overflow-hidden">
               <div
                 className="h-full bg-gradient-sunset animate-shimmer bg-[length:200%_100%]"
                 style={{
                   width: order.status === 'pending' ? '15%' :
                          order.status === 'confirmed' ? '30%' :
                          order.status === 'preparing' ? '50%' :
                          order.status === 'ready' ? '80%' :
                          order.status === 'delivered' ? '100%' : '5%'
                 }}
               />
            </div>
          </div>
          <p className="text-[9px] text-ink/30 font-bold uppercase text-center tracking-[0.2em]">O status é atualizado em tempo real</p>
        </Card>
      </div>
    </div>
  );
}
