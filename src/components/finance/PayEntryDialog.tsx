import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { useSupportContext } from "@/hooks/useSupportContext";
import { METHOD_LABEL, formatBRL, getOpenCashSession, payEntry, type FinanceEntry, type FinancePayMethod } from "@/lib/finance";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: FinanceEntry | null;
  restaurantId: string;
  onPaid?: () => void;
}

const METHODS: FinancePayMethod[] = ["cash", "pix", "credit", "debit", "transfer", "boleto", "other"];

export function PayEntryDialog({ open, onOpenChange, entry, restaurantId, onPaid }: Props) {
  const support = useSupportContext();
  const supportBlocked = support.active; // Financeiro ainda não tem RPC de suporte auditada.
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<FinancePayMethod>("cash");
  const [linkCash, setLinkCash] = useState(true);
  const [cashSessionId, setCashSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !entry) return;
    const remaining = Number(entry.amount) - Number(entry.amount_paid);
    setAmount(remaining > 0 ? remaining.toFixed(2) : "0");
    setMethod((entry.payment_method as FinancePayMethod) ?? "cash");
    setNotes("");
    (async () => {
      const s = await getOpenCashSession(restaurantId);
      setCashSessionId(s?.id ?? null);
      setLinkCash(!!s?.id);
    })();
  }, [open, entry, restaurantId]);

  if (!entry) return null;
  const remaining = Number(entry.amount) - Number(entry.amount_paid);

  const save = async () => {
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) { toast.error("Valor inválido"); return; }
    if (amt > remaining + 0.01) { toast.error(`Valor máximo: ${formatBRL(remaining)}`); return; }
    setSaving(true);
    try {
      await payEntry({
        entry_id: entry.id,
        amount: amt,
        payment_method: method,
        cash_session_id: linkCash && method === "cash" ? cashSessionId : null,
        notes: notes || null,
      });
      toast.success(entry.direction === "payable" ? "Pagamento registrado" : "Recebimento registrado");
      onOpenChange(false);
      onPaid?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{entry.direction === "payable" ? "Registrar pagamento" : "Registrar recebimento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border-2 border-ink/10 bg-muted/40 p-3">
            <p className="text-xs uppercase tracking-wider font-bold text-ink/50">Lançamento</p>
            <p className="font-display text-lg text-ink">{entry.description}</p>
            <p className="text-xs text-ink/60">
              Total {formatBRL(entry.amount)} · Pago {formatBRL(entry.amount_paid)} · Restante <strong>{formatBRL(remaining)}</strong>
            </p>
          </div>

          <div>
            <Label>Valor a {entry.direction === "payable" ? "pagar" : "receber"} (R$)</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div>
            <Label>Forma de pagamento</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as FinancePayMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {method === "cash" && (
            <div className="flex items-center justify-between rounded-lg border-2 border-ink/10 bg-muted/40 px-3 py-2">
              <div>
                <p className="text-sm font-bold text-ink">Lançar no caixa aberto</p>
                <p className="text-xs text-ink/60">
                  {cashSessionId ? "Cria movimentação de suprimento/sangria no caixa atual." : "Nenhum caixa aberto — não será lançado."}
                </p>
              </div>
              <Switch checked={linkCash && !!cashSessionId} disabled={!cashSessionId} onCheckedChange={setLinkCash} />
            </div>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Confirmar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
