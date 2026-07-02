// Sprint 4.3 — Dialog com timeline do cliente
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getCustomerConversationTimeline } from "@/lib/communication/automation.functions";
import { orderStatusLabel } from "@/lib/labels";
import { Bot, Inbox, User, ShoppingBag } from "lucide-react";

export function CustomerTimelineDialog({
  customerId, open, onOpenChange,
}: { customerId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const fn = useServerFn(getCustomerConversationTimeline);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customerId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fn({ data: { customer_id: customerId } });
        if (alive) setData(r);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [open, customerId, fn]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.customer?.name ?? "Cliente"}</DialogTitle>
          <p className="text-xs text-muted-foreground">{data?.customer?.phone}</p>
        </DialogHeader>
        {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : data && (
          <Tabs defaultValue="mensagens">
            <TabsList>
              <TabsTrigger value="mensagens">Mensagens ({data.messages?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="pedidos">Pedidos ({data.orders?.length ?? 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="mensagens" className="space-y-2 mt-4">
              {(data.messages ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem mensagens.</p>}
              {(data.messages ?? []).map((m: any) => {
                const isIn = m.direction === "inbound";
                const isAuto = m.source === "automated";
                const Icon = isIn ? Inbox : isAuto ? Bot : User;
                return (
                  <div key={m.id} className="flex gap-2 text-sm border-b pb-2">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isIn ? "text-blue-600" : isAuto ? "text-brand-magenta" : "text-brand-orange"}`} />
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{isIn ? "Recebida" : isAuto ? `Automação${m.rule_code ? ` (${m.rule_code})` : ""}` : "Enviada"}</span>
                        <span>{new Date(m.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{m.body || (m.media_type ? `[${m.media_type}]` : "")}</p>
                    </div>
                  </div>
                );
              })}
            </TabsContent>
            <TabsContent value="pedidos" className="space-y-2 mt-4">
              {(data.orders ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem pedidos.</p>}
              {(data.orders ?? []).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-brand-orange" />
                    <span className="font-bold">#{o.order_number}</span>
                    <Badge variant="outline">{orderStatusLabel(o.status)}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">R$ {Number(o.total ?? 0).toFixed(2)}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
