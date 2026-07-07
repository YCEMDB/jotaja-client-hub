import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { closeTableSession, translateTableError, type CloseSplit, type TableMapRow } from "@/lib/tables";

const METHODS: { value: CloseSplit["method"]; label: string }[] = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "card_credit", label: "Crédito" },
  { value: "card_debit", label: "Débito" },
  { value: "other", label: "Outro" },
];

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CloseSessionDialog({
  table,
  open,
  onOpenChange,
  onClosed,
}: {
  table: TableMapRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onClosed: () => void;
}) {
  const [method, setMethod] = useState<CloseSplit["method"]>("cash");
  const [amount, setAmount] = useState<string>("");
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);

  const total = Number(table?.current_total ?? 0);
  const hasOpen = (table?.open_orders ?? 0) > 0;

  useEffect(() => {
    if (open) {
      setAmount(total > 0 ? total.toFixed(2) : "");
      setMethod("cash");
      setForce(false);
    }
  }, [open, total]);

  const submit = async () => {
    if (!table?.session_id) return;
    setBusy(true);
    try {
      const amt = Number(amount.replace(",", ".")) || 0;
      const splits: CloseSplit[] = amt > 0 ? [{ method, amount: amt }] : [];
      const res = await closeTableSession(table.session_id, splits, force);
      const bal = Number(res.balance ?? 0);
      if (bal > 0.005) {
        toast.warning(`Mesa fechada com saldo devedor de ${fmtBRL(bal)}.`);
      } else {
        toast.success(`Mesa ${table.number} fechada. Total ${fmtBRL(Number(res.total ?? 0))}.`);
      }
      onOpenChange(false);
      onClosed();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro ao fechar mesa"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar mesa {table?.number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-ink/10 bg-background p-4 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-ink/60">Total da sessão</span>
            <span className="font-display text-2xl text-ink">{fmtBRL(total)}</span>
          </div>

          {hasOpen && (
            <div className="rounded-lg border-2 border-brand-amber bg-brand-amber/15 p-3 text-sm">
              <strong>Atenção:</strong> há {table?.open_orders} pedido(s) em preparo. Para fechar mesmo assim, marque "forçar fechamento" (apenas dono).
            </div>
          )}

          <div className="grid grid-cols-[1fr,140px] gap-3">
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as CloseSplit["method"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amt">Valor pago</Label>
              <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <p className="text-xs text-ink/50">
            O valor pago vira uma entrada de <strong>venda</strong> no caixa aberto (se houver). Divisão por comanda estará disponível numa próxima sprint.
          </p>

          {hasOpen && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={force} onCheckedChange={(v) => setForce(v === true)} />
              Forçar fechamento com pedidos em preparo (apenas dono)
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Fechando..." : "Fechar mesa"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
