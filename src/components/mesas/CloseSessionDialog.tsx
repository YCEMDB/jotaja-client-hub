import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Users, Percent, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  closeTableSession, getSessionDetail, translateTableError,
  type CloseSplit, type TableMapRow, type SessionDetail,
} from "@/lib/tables";

const METHODS: { value: CloseSplit["method"]; label: string }[] = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "card_credit", label: "Crédito" },
  { value: "card_debit", label: "Débito" },
  { value: "other", label: "Outro" },
];

type LocalSplit = { id: string; method: CloseSplit["method"]; amount: string; percent?: string; payer_label?: string };

function fmtBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function parseNum(s: string) { return Number((s ?? "").toString().replace(",", ".")) || 0; }

export function CloseSessionDialog({
  table, open, onOpenChange, onClosed,
}: {
  table: TableMapRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onClosed: () => void;
}) {
  const [mode, setMode] = useState<"single" | "value" | "percent" | "people" | "item">("single");
  const [singleMethod, setSingleMethod] = useState<CloseSplit["method"]>("cash");
  const [singleAmount, setSingleAmount] = useState<string>("");
  const [splits, setSplits] = useState<LocalSplit[]>([]);
  const [people, setPeople] = useState<string>("2");
  const [peopleMethod, setPeopleMethod] = useState<CloseSplit["method"]>("cash");
  const [itemAssign, setItemAssign] = useState<Record<string, number>>({}); // itemKey -> bucket idx
  const [itemBuckets, setItemBuckets] = useState<{ id: string; method: CloseSplit["method"]; payer_label?: string }[]>([]);
  const [force, setForce] = useState(false);
  const [justification, setJustification] = useState("");
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const total = Number(table?.current_total ?? 0);
  const hasOpen = (table?.open_orders ?? 0) > 0;

  useEffect(() => {
    if (!open || !table?.session_id) return;
    setMode("single");
    setSingleMethod("cash"); setSingleAmount(total > 0 ? total.toFixed(2) : "");
    setSplits([{ id: uid(), method: "cash", amount: total.toFixed(2), payer_label: "" }]);
    setPeople("2"); setPeopleMethod("cash");
    setItemAssign({}); setItemBuckets([{ id: uid(), method: "cash" }, { id: uid(), method: "cash" }]);
    setForce(false); setJustification("");
    // Modo item precisa dos pedidos → carrega detalhe.
    (async () => {
      try { setDetail(await getSessionDetail(table.session_id!)); }
      catch { /* silent */ }
    })();
  }, [open, table?.session_id, total]);

  const finalSplits: CloseSplit[] = useMemo(() => {
    if (mode === "single") {
      const a = parseNum(singleAmount);
      return a > 0 ? [{ method: singleMethod, amount: Number(a.toFixed(2)) }] : [];
    }
    if (mode === "value") {
      return splits
        .map((s) => ({ method: s.method, amount: Number(parseNum(s.amount).toFixed(2)), payer_label: s.payer_label || undefined }))
        .filter((s) => s.amount > 0);
    }
    if (mode === "percent") {
      return splits
        .map((s) => {
          const pct = parseNum(s.percent ?? "0");
          const amt = Number(((total * pct) / 100).toFixed(2));
          return { method: s.method, amount: amt, payer_label: s.payer_label || undefined };
        })
        .filter((s) => s.amount > 0);
    }
    if (mode === "people") {
      const n = Math.max(1, Math.floor(parseNum(people)));
      const share = Number((total / n).toFixed(2));
      const arr: CloseSplit[] = Array.from({ length: n }, (_, i) => ({
        method: peopleMethod, amount: share, payer_label: `Pessoa ${i + 1}`,
      }));
      // Ajuste do centavo residual na última.
      const diff = Number((total - share * n).toFixed(2));
      if (arr.length > 0 && Math.abs(diff) >= 0.01) arr[arr.length - 1].amount = Number((arr[arr.length - 1].amount + diff).toFixed(2));
      return arr;
    }
    // item
    const totals = new Map<number, number>();
    (detail?.orders ?? []).forEach((o) => {
      if (o.status === "cancelled") return;
      o.items.forEach((it) => {
        const key = `${o.id}:${it.id}`;
        const bucket = itemAssign[key];
        if (bucket == null) return;
        totals.set(bucket, (totals.get(bucket) ?? 0) + Number(it.subtotal ?? 0));
      });
    });
    return itemBuckets
      .map((b, idx) => ({ method: b.method, amount: Number((totals.get(idx) ?? 0).toFixed(2)), payer_label: b.payer_label || `Grupo ${idx + 1}` }))
      .filter((s) => s.amount > 0);
  }, [mode, singleMethod, singleAmount, splits, people, peopleMethod, itemAssign, itemBuckets, detail, total]);

  const paidSum = finalSplits.reduce((a, s) => a + s.amount, 0);
  const balance = Number((total - paidSum).toFixed(2));
  const hasDiff = Math.abs(balance) >= 0.01;

  const submit = async () => {
    if (!table?.session_id) return;
    if (hasDiff && !justification.trim()) {
      toast.error("Há diferença entre pago e total. Justifique antes de fechar.");
      return;
    }
    setBusy(true);
    try {
      const splitsToSend = hasDiff
        ? [...finalSplits, ...(justification.trim() ? [{ method: "other" as const, amount: 0, payer_label: `Ajuste: ${justification.trim()}` }] : [])]
        : finalSplits;
      const res = await closeTableSession(table.session_id, splitsToSend, force);
      const bal = Number(res.balance ?? 0);
      if (Math.abs(bal) > 0.005) toast.warning(`Mesa fechada · saldo ${fmtBRL(bal)}.`);
      else toast.success(`Mesa ${table.number} fechada · ${fmtBRL(Number(res.total ?? 0))}.`);
      onOpenChange(false); onClosed();
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro ao fechar mesa"));
    } finally { setBusy(false); }
  };

  const addSplit = () => setSplits((s) => [...s, { id: uid(), method: "cash", amount: "", percent: "", payer_label: "" }]);
  const removeSplit = (id: string) => setSplits((s) => s.filter((x) => x.id !== id));
  const updateSplit = (id: string, patch: Partial<LocalSplit>) =>
    setSplits((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addBucket = () => setItemBuckets((b) => [...b, { id: uid(), method: "cash" }]);
  const removeBucket = (idx: number) => {
    setItemBuckets((b) => b.filter((_, i) => i !== idx));
    setItemAssign((m) => {
      const copy: Record<string, number> = {};
      Object.entries(m).forEach(([k, v]) => {
        if (v === idx) return;
        copy[k] = v > idx ? v - 1 : v;
      });
      return copy;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fechar mesa {table?.number}</DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border-2 border-ink/10 bg-background p-4 flex items-baseline justify-between mb-3">
          <span className="text-xs uppercase tracking-wider font-bold text-ink/60">Total da sessão</span>
          <span className="font-display text-2xl text-ink">{fmtBRL(total)}</span>
        </div>

        {hasOpen && (
          <div className="rounded-lg border-2 border-brand-amber bg-brand-amber/15 p-3 text-sm mb-3">
            <strong>Atenção:</strong> {table?.open_orders} pedido(s) em preparo. Marque "forçar" para fechar mesmo assim (apenas dono).
          </div>
        )}

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="single">Único</TabsTrigger>
            <TabsTrigger value="value" className="gap-1"><DollarSign className="h-3.5 w-3.5" />Valor</TabsTrigger>
            <TabsTrigger value="percent" className="gap-1"><Percent className="h-3.5 w-3.5" />%</TabsTrigger>
            <TabsTrigger value="people" className="gap-1"><Users className="h-3.5 w-3.5" />Pessoas</TabsTrigger>
            <TabsTrigger value="item" className="gap-1"><Package className="h-3.5 w-3.5" />Item</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-2 mt-3">
            <TabsContent value="single" className="mt-0">
              <div className="grid grid-cols-[1fr_140px] gap-3">
                <div>
                  <Label>Forma de pagamento</Label>
                  <Select value={singleMethod} onValueChange={(v) => setSingleMethod(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input inputMode="decimal" value={singleAmount} onChange={(e) => setSingleAmount(e.target.value)} placeholder="0,00" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="value" className="mt-0 space-y-2">
              {splits.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_130px_100px_auto] gap-2 items-end">
                  <div>
                    <Select value={s.method} onValueChange={(v) => updateSplit(s.id, { method: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input placeholder="Pagador" value={s.payer_label ?? ""} onChange={(e) => updateSplit(s.id, { payer_label: e.target.value })} />
                  <Input inputMode="decimal" placeholder="0,00" value={s.amount} onChange={(e) => updateSplit(s.id, { amount: e.target.value })} />
                  <Button size="icon" variant="ghost" onClick={() => removeSplit(s.id)} disabled={splits.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addSplit}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
            </TabsContent>

            <TabsContent value="percent" className="mt-0 space-y-2">
              {splits.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_130px_90px_auto] gap-2 items-end">
                  <Select value={s.method} onValueChange={(v) => updateSplit(s.id, { method: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Pagador" value={s.payer_label ?? ""} onChange={(e) => updateSplit(s.id, { payer_label: e.target.value })} />
                  <div className="relative">
                    <Input inputMode="decimal" placeholder="0" value={s.percent ?? ""} onChange={(e) => updateSplit(s.id, { percent: e.target.value })} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/50 text-xs">%</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeSplit(s.id)} disabled={splits.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={addSplit}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
                <div className="text-xs text-ink/60">Soma %: <b>{splits.reduce((a, s) => a + parseNum(s.percent ?? "0"), 0).toFixed(1)}%</b></div>
              </div>
            </TabsContent>

            <TabsContent value="people" className="mt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nº de pessoas</Label>
                  <Input inputMode="numeric" value={people} onChange={(e) => setPeople(e.target.value)} />
                </div>
                <div>
                  <Label>Forma de pagamento</Label>
                  <Select value={peopleMethod} onValueChange={(v) => setPeopleMethod(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-ink/70">
                Cada pessoa paga <b>{fmtBRL(total / Math.max(1, Math.floor(parseNum(people))))}</b>.
              </div>
            </TabsContent>

            <TabsContent value="item" className="mt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-ink/70">Atribua cada item a um grupo. Cada grupo é um pagamento.</div>
                <Button variant="outline" size="sm" onClick={addBucket}><Plus className="h-4 w-4 mr-1" /> Grupo</Button>
              </div>
              <div className="space-y-2">
                {itemBuckets.map((b, idx) => (
                  <div key={b.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center rounded-lg border-2 border-ink/10 p-2">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-brand-orange/15 text-brand-orange">G{idx + 1}</span>
                    <Input placeholder="Pagador" value={b.payer_label ?? ""} onChange={(e) => setItemBuckets((arr) => arr.map((x, i) => i === idx ? { ...x, payer_label: e.target.value } : x))} />
                    <Select value={b.method} onValueChange={(v) => setItemBuckets((arr) => arr.map((x, i) => i === idx ? { ...x, method: v as any } : x))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => removeBucket(idx)} disabled={itemBuckets.length === 1}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border-2 border-ink/10 p-2 space-y-1 max-h-64 overflow-auto">
                {(detail?.orders ?? []).filter(o => o.status !== "cancelled").flatMap((o) => o.items.map((it) => {
                  const key = `${o.id}:${it.id}`;
                  const assigned = itemAssign[key];
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 text-sm py-1 border-b border-ink/5 last:border-0">
                      <div className="min-w-0 truncate"><b>{it.quantity}×</b> {it.name} <span className="text-ink/50">· #{o.order_number}</span></div>
                      <div className="flex items-center gap-2">
                        <span className="text-ink/60">{fmtBRL(Number(it.subtotal ?? 0))}</span>
                        <Select value={assigned == null ? "" : String(assigned)} onValueChange={(v) => setItemAssign((m) => ({ ...m, [key]: Number(v) }))}>
                          <SelectTrigger className="w-24 h-8"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {itemBuckets.map((_, i) => <SelectItem key={i} value={String(i)}>G{i + 1}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                }))}
                {(!detail?.orders || detail.orders.length === 0) && <div className="text-sm text-ink/60 p-2">Sem itens.</div>}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className={cn("mt-3 rounded-xl border-2 p-3 flex items-center justify-between",
          hasDiff ? "border-brand-magenta bg-brand-magenta/10" : "border-emerald-500/40 bg-emerald-500/10")}>
          <div className="text-sm">
            Pago: <b>{fmtBRL(paidSum)}</b> {hasDiff && <span className="ml-2">· Diferença: <b>{fmtBRL(balance)}</b></span>}
          </div>
          <div className="text-xs text-ink/60">{finalSplits.length} pagamento(s)</div>
        </div>

        {hasDiff && (
          <div className="mt-2">
            <Label className="text-xs">Justificativa da diferença (obrigatório)</Label>
            <Textarea rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Ex.: cortesia, gorjeta, cliente pagou fora, etc." />
          </div>
        )}

        {hasOpen && (
          <label className="flex items-center gap-2 text-sm mt-2">
            <Checkbox checked={force} onCheckedChange={(v) => setForce(v === true)} />
            Forçar fechamento com pedidos em preparo (apenas dono)
          </label>
        )}

        <DialogFooter className="mt-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Fechando..." : "Fechar mesa"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
