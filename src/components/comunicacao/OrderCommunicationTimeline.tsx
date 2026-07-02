// Sprint 4.3 — Timeline de comunicação por pedido
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getOrderCommunicationTimeline } from "@/lib/communication/automation.functions";
import { MessageSquare, Bot, User, Inbox } from "lucide-react";

type Msg = {
  id: string; direction: string; source: string; body: string;
  media_type: string | null; media_url: string | null; caption: string | null;
  status: string; created_at: string; rule_code: string | null;
};

export function OrderCommunicationTimeline({ orderId }: { orderId: string }) {
  const fn = useServerFn(getOrderCommunicationTimeline);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fn({ data: { order_id: orderId } });
        if (alive) setMsgs(r as Msg[]);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [orderId, fn]);

  if (loading) return <p className="text-xs text-muted-foreground">Carregando comunicação…</p>;
  if (msgs.length === 0) return <p className="text-xs text-muted-foreground">Sem mensagens vinculadas.</p>;

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {msgs.map(m => {
        const isIn = m.direction === "inbound";
        const isAuto = m.source === "automated";
        const Icon = isIn ? Inbox : isAuto ? Bot : User;
        return (
          <div key={m.id} className="flex gap-2 text-xs">
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isIn ? "text-blue-600" : isAuto ? "text-brand-magenta" : "text-brand-orange"}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{isIn ? "Recebida" : isAuto ? `Automação${m.rule_code ? ` (${m.rule_code})` : ""}` : "Enviada"}</span>
                <span>{new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="whitespace-pre-wrap break-words">{m.body || (m.media_type ? `[${m.media_type}]` : "")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
