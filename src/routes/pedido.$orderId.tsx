import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createPixPayment } from "@/lib/payments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pedido/$orderId")({
  component: OrderTrackPage,
  head: () => ({
    meta: [
      { title: "Acompanhar pedido — ComandaHub" },
      { name: "description", content: "Acompanhe o status do seu pedido em tempo real pela ComandaHub." },
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

  const load = async () => {
    const { data } = await supabase.rpc("get_public_order", { p_id: orderId });
    const payload = data as any;
    setOrder((payload?.order ?? null) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orderId]);

  // Auto-generate PIX once
  useEffect(() => {
    if (!order || order.payment !== "pix") return;
    if (order.pix_qr_code || order.payment_status === "paid" || generating) return;
    setGenerating(true);
    createPix({ data: { orderId } })
      .then((r) => { if (!r.ok) toast.error(r.error ?? "Erro PIX"); })
      .finally(() => { setGenerating(false); load(); });
  }, [order?.id]);

  // Poll every 4s for payment + status
  useEffect(() => {
    if (!order || order.payment_status === "paid") return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [order?.payment_status]);

  if (loading) return <div className="p-8 text-center">Carregando…</div>;
  if (!order) return <div className="p-8 text-center">Pedido não encontrado.</div>;

  const paid = order.payment_status === "paid";
  const showPix = order.payment === "pix" && !paid;

  return (
    <div className="min-h-dvh bg-muted/30 py-10 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Pedido #{order.order_number}</p>
          <h1 className="text-2xl font-bold">Olá, {order.customer_name.split(" ")[0]}!</h1>
        </div>

        {paid && (
          <Card className="p-5 text-center bg-green-50 border-green-200">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-900">Pagamento confirmado!</p>
            <p className="text-sm text-green-700">Já pode acompanhar o preparo abaixo.</p>
          </Card>
        )}

        {showPix && (
          <Card className="p-5 space-y-4">
            <div>
              <p className="font-semibold">Pague R$ {Number(order.total).toFixed(2)} via PIX</p>
              <p className="text-xs text-muted-foreground">A confirmação é automática.</p>
            </div>
            {generating && <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            {order.pix_qr_code_base64 && (
              <img
                src={`data:image/png;base64,${order.pix_qr_code_base64}`}
                alt="QR Code PIX"
                className="w-56 h-56 mx-auto border rounded-lg"
              />
            )}
            {order.pix_qr_code && (
              <div>
                <p className="text-xs font-semibold mb-1">PIX copia e cola</p>
                <div className="flex gap-2">
                  <input readOnly value={order.pix_qr_code} className="flex-1 text-xs border rounded px-2 py-1.5 bg-muted/50 font-mono" />
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(order.pix_qr_code!);
                    toast.success("Código copiado");
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {order.pix_expires_at && (
              <p className="text-xs text-muted-foreground text-center">
                Expira em {new Date(order.pix_expires_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </Card>
        )}

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Status do pedido</p>
            <Badge variant="secondary">{STATUS_LABELS[order.status] ?? order.status}</Badge>
          </div>
          {order.estimated_minutes && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Tempo estimado: {order.estimated_minutes} min
            </p>
          )}
          <p className="text-xs text-muted-foreground">A página atualiza sozinha.</p>
        </Card>
      </div>
    </div>
  );
}
