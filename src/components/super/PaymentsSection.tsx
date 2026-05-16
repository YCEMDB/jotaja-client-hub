import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Plan = "trial" | "essential" | "professional";
type Payment = {
  id: string;
  amount: number;
  plan: string;
  period_start: string;
  period_end: string;
  paid_at: string;
  method: string | null;
  notes: string | null;
};

function fmtMoney(v: number) { return `R$ ${Number(v).toFixed(2).replace(".", ",")}`; }

export function PaymentsSection({
  restaurantId, currentPlan, onRegistered,
}: {
  restaurantId: string;
  currentPlan: Plan;
  onRegistered: (newSubscriptionEnd: string) => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [form, setForm] = useState({ amount: "", method: "pix", months: 1, notes: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoadingP(true);
    const { data } = await supabase
      .from("restaurant_payments")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("paid_at", { ascending: false });
    setPayments((data ?? []) as Payment[]);
    setLoadingP(false);
  };

  useEffect(() => { load(); }, [restaurantId]);

  const register = async () => {
    const amount = Number(form.amount.replace(",", "."));
    if (!amount || amount <= 0) return toast.error("Informe um valor válido");
    if (!form.months || form.months < 1) return toast.error("Informe quantos meses");
    setBusy(true);

    const { data: rest } = await supabase
      .from("restaurants")
      .select("subscription_ends_at")
      .eq("id", restaurantId)
      .maybeSingle();

    const now = new Date();
    const startBase = rest?.subscription_ends_at && new Date(rest.subscription_ends_at) > now
      ? new Date(rest.subscription_ends_at)
      : now;
    const periodStart = new Date(startBase);
    const periodEnd = new Date(startBase);
    periodEnd.setMonth(periodEnd.getMonth() + form.months);

    const { error: insErr } = await supabase.from("restaurant_payments").insert({
      restaurant_id: restaurantId,
      amount,
      plan: currentPlan,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      method: form.method,
      notes: form.notes || null,
    });
    if (insErr) { setBusy(false); return toast.error(insErr.message); }

    const { error: updErr } = await supabase
      .from("restaurants")
      .update({ subscription_ends_at: periodEnd.toISOString(), is_active: true })
      .eq("id", restaurantId);
    setBusy(false);
    if (updErr) return toast.error(updErr.message);

    toast.success(`Pagamento registrado. Assinatura válida até ${periodEnd.toLocaleDateString("pt-BR")}.`);
    setForm({ amount: "", method: "pix", months: 1, notes: "" });
    onRegistered(periodEnd.toISOString());
    load();
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <p className="font-semibold text-sm">Pagamentos</p>

      <Card className="p-3 bg-muted/30 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">Registrar pagamento</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Valor (R$)</Label>
            <Input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="99,00" />
          </div>
          <div>
            <Label className="text-xs">Meses</Label>
            <Input type="number" min={1} max={36} value={form.months} onChange={(e) => setForm({ ...form, months: Number(e.target.value) || 1 })} />
          </div>
          <div>
            <Label className="text-xs">Método</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações (opcional)" />
        <Button size="sm" onClick={register} disabled={busy} className="w-full">
          {busy ? "Registrando..." : "Registrar e estender assinatura"}
        </Button>
      </Card>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Histórico</p>
        {loadingP ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : payments.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum pagamento registrado.</p>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-2">Data</th>
                  <th className="p-2">Plano</th>
                  <th className="p-2">Período</th>
                  <th className="p-2">Método</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{new Date(p.paid_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-2">{p.plan}</td>
                    <td className="p-2">{new Date(p.period_start).toLocaleDateString("pt-BR")} → {new Date(p.period_end).toLocaleDateString("pt-BR")}</td>
                    <td className="p-2">{p.method ?? "—"}</td>
                    <td className="p-2 text-right font-medium">{fmtMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
