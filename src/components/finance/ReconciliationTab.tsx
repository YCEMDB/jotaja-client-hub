import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Section, SectionHeader, SectionContent, DashboardGrid, StatCard, LoadingState, ErrorState, EmptyState } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, Download, FileCheck2, RefreshCw, Scale } from "lucide-react";
import {
  createReconciliation, formatBRL, getReconciliationSummary, listReconciliations,
  RECON_METHOD_LABEL, type ReconciliationItem, type ReconciliationRow, type ReconciliationSummary,
} from "@/lib/finance";
import { downloadCSV } from "@/lib/export-csv";

interface Props {
  restaurantId: string;
  from: string;
  to: string;
}

export function ReconciliationTab({ restaurantId, from, to }: Props) {
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [history, setHistory] = useState<ReconciliationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notesDialog, setNotesDialog] = useState<{ open: boolean; item: ReconciliationItem | null; notes: string }>({ open: false, item: null, notes: "" });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, h] = await Promise.all([
        getReconciliationSummary(restaurantId, from, to),
        listReconciliations(restaurantId, from, to),
      ]);
      setSummary(s); setHistory(h);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar conciliação");
    } finally { setLoading(false); }
  }, [restaurantId, from, to]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const totals = summary?.totals ?? { expected_amount: 0, received_amount: 0, difference: 0 };
  const items = summary?.items ?? [];
  const divergent = useMemo(() => items.filter((i) => i.status === "divergent"), [items]);

  const persistItem = async (item: ReconciliationItem, notes: string) => {
    setSaving(true);
    try {
      await createReconciliation({
        restaurant_id: restaurantId, from, to,
        method: item.method,
        expected_amount: item.expected_amount,
        received_amount: item.received_amount,
        notes: notes || null,
      });
      toast.success(`Conciliação de ${RECON_METHOD_LABEL[item.method] ?? item.method} registrada`);
      setNotesDialog({ open: false, item: null, notes: "" });
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar");
    } finally { setSaving(false); }
  };

  const persistAll = async () => {
    if (!items.length) return;
    setSaving(true);
    try {
      for (const it of items) {
        await createReconciliation({
          restaurant_id: restaurantId, from, to,
          method: it.method,
          expected_amount: it.expected_amount,
          received_amount: it.received_amount,
          notes: null,
        });
      }
      toast.success("Conciliações registradas");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar");
    } finally { setSaving(false); }
  };

  const exportCsv = () => {
    const rows: (string | number | null)[][] = [
      ["Método", "Pedidos pagos", "Esperado (R$)", "Recebido (R$)", "Diferença (R$)", "Status"],
      ...items.map((i) => [
        RECON_METHOD_LABEL[i.method] ?? i.method,
        i.orders_count,
        Number(i.expected_amount).toFixed(2),
        Number(i.received_amount).toFixed(2),
        Number(i.difference).toFixed(2),
        i.status === "ok" ? "OK" : "Divergente",
      ]),
      ["Total", "", Number(totals.expected_amount).toFixed(2), Number(totals.received_amount).toFixed(2), Number(totals.difference).toFixed(2), ""],
    ];
    downloadCSV(`conciliacao_${from}_${to}.csv`, rows);
  };

  if (loading) return <LoadingState label="Carregando conciliação…" />;
  if (error) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <DashboardGrid cols={4}>
        <StatCard label="Esperado no período" value={formatBRL(totals.expected_amount)} icon={Scale} accent="violet" />
        <StatCard label="Recebido no período" value={formatBRL(totals.received_amount)} icon={Check} accent="amber" />
        <StatCard
          label="Diferença total"
          value={formatBRL(totals.difference)}
          icon={AlertTriangle}
          accent={Math.abs(totals.difference) < 0.01 ? "orange" : "magenta"}
        />
        <StatCard label="Divergências" value={divergent.length} icon={AlertTriangle} accent={divergent.length ? "magenta" : "violet"} />
      </DashboardGrid>

      <Section>
        <SectionHeader
          title="Conciliação por forma de pagamento"
          description="Compara pedidos pagos (esperado) com movimentações confirmadas (recebido). Dinheiro usa o caixa; PIX/cartão/online usa o Mercado Pago."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />CSV</Button>
              <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
              <Button size="sm" onClick={persistAll} disabled={!items.length || saving}>
                <FileCheck2 className="h-4 w-4 mr-2" />Registrar tudo
              </Button>
            </div>
          }
        />
        <SectionContent>
          {items.length === 0 ? (
            <EmptyState icon={Scale} title="Sem pagamentos no período" description="Não há pedidos pagos para conciliar." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-ink/60 bg-muted/40">
                  <tr>
                    <th className="px-4 py-2">Método</th>
                    <th className="px-4 py-2 text-right">Pedidos</th>
                    <th className="px-4 py-2 text-right">Esperado</th>
                    <th className="px-4 py-2 text-right">Recebido</th>
                    <th className="px-4 py-2 text-right">Diferença</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.method} className="border-t border-ink/10">
                      <td className="px-4 py-2 font-bold text-ink">{RECON_METHOD_LABEL[i.method] ?? i.method}</td>
                      <td className="px-4 py-2 text-right">{i.orders_count}</td>
                      <td className="px-4 py-2 text-right">{formatBRL(i.expected_amount)}</td>
                      <td className="px-4 py-2 text-right">{formatBRL(i.received_amount)}</td>
                      <td className={`px-4 py-2 text-right font-bold ${Math.abs(i.difference) < 0.01 ? "text-ink" : "text-brand-magenta"}`}>
                        {formatBRL(i.difference)}
                      </td>
                      <td className="px-4 py-2">
                        {i.status === "ok"
                          ? <Badge className="bg-emerald-500/20 text-ink border-emerald-500">OK</Badge>
                          : <Badge className="bg-brand-magenta/20 text-ink border-brand-magenta">Divergente</Badge>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => setNotesDialog({ open: true, item: i, notes: "" })}>
                          Registrar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader
          title="Histórico de conciliações"
          description="Snapshots registrados para auditoria."
        />
        <SectionContent>
          {history.length === 0 ? (
            <p className="text-sm text-ink/60">Nenhuma conciliação registrada nesse período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-ink/60 bg-muted/40">
                  <tr>
                    <th className="px-4 py-2">Período</th>
                    <th className="px-4 py-2">Método</th>
                    <th className="px-4 py-2 text-right">Esperado</th>
                    <th className="px-4 py-2 text-right">Recebido</th>
                    <th className="px-4 py-2 text-right">Diferença</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Registrado em</th>
                    <th className="px-4 py-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t border-ink/10">
                      <td className="px-4 py-2">{h.period_from} → {h.period_to}</td>
                      <td className="px-4 py-2 font-bold text-ink">{RECON_METHOD_LABEL[h.method] ?? h.method}</td>
                      <td className="px-4 py-2 text-right">{formatBRL(h.expected_amount)}</td>
                      <td className="px-4 py-2 text-right">{formatBRL(h.received_amount)}</td>
                      <td className={`px-4 py-2 text-right font-bold ${Math.abs(Number(h.difference)) < 0.01 ? "text-ink" : "text-brand-magenta"}`}>
                        {formatBRL(h.difference)}
                      </td>
                      <td className="px-4 py-2">
                        {h.status === "ok"
                          ? <Badge className="bg-emerald-500/20 text-ink border-emerald-500">OK</Badge>
                          : <Badge className="bg-brand-magenta/20 text-ink border-brand-magenta">Divergente</Badge>}
                      </td>
                      <td className="px-4 py-2 text-ink/60">{new Date(h.reconciled_at).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2 text-ink/60 max-w-[200px] truncate">{h.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionContent>
      </Section>

      <Dialog open={notesDialog.open} onOpenChange={(v) => setNotesDialog((d) => ({ ...d, open: v }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar conciliação</DialogTitle>
          </DialogHeader>
          {notesDialog.item && (
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-ink/10 bg-muted/40 p-3 text-sm">
                <p><strong>{RECON_METHOD_LABEL[notesDialog.item.method] ?? notesDialog.item.method}</strong></p>
                <p>Esperado: {formatBRL(notesDialog.item.expected_amount)}</p>
                <p>Recebido: {formatBRL(notesDialog.item.received_amount)}</p>
                <p>Diferença: <strong>{formatBRL(notesDialog.item.difference)}</strong></p>
              </div>
              <div>
                <Label>Observações (opcional)</Label>
                <Textarea rows={3} value={notesDialog.notes} onChange={(e) => setNotesDialog((d) => ({ ...d, notes: e.target.value }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog({ open: false, item: null, notes: "" })} disabled={saving}>Cancelar</Button>
            <Button onClick={() => notesDialog.item && persistItem(notesDialog.item, notesDialog.notes)} disabled={saving}>
              {saving ? "Salvando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
