import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, QrCode, Ban, Unlock, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { AdminPageLayout, LoadingState, ErrorState } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/hooks/useAuth";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { supabase } from "@/integrations/supabase/client";
import {
  getTableMap, deleteTable, blockTable, unblockTable,
  translateTableError, type TableMapRow,
} from "@/lib/tables";
import { TableFormDialog } from "@/components/mesas/TableFormDialog";
import { QrCodeDialog } from "@/components/mesas/QrCodeDialog";

export const Route = createFileRoute("/_authenticated/admin/mesas/cadastro")({
  component: CadastroPage,
});

function CadastroPage() {
  return (
    <FeatureGate feature="tables_max">
      <CadastroContent />
    </FeatureGate>
  );
}

function CadastroContent() {
  const { restaurantId } = useAuth();
  const { plan } = usePlanFeatures();
  const limit = (plan?.features as any)?.tables_max as number | null | undefined;
  const isUnlimited = limit === null;

  const [rows, setRows] = useState<TableMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableMapRow | null>(null);
  const [qr, setQr] = useState<TableMapRow | null>(null);

  const reload = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setError(null);
      setRows(await getTableMap(restaurantId));
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar mesas.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { reload(); }, [reload, tick]);

  useEffect(() => {
    if (!restaurantId) return;
    const ch = supabase.channel(`tables-crud-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables", filter: `restaurant_id=eq.${restaurantId}` }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId]);

  const total = rows.length;
  const atLimit = typeof limit === "number" && total >= limit;

  const doDelete = async (t: TableMapRow) => {
    if (!confirm(`Remover mesa ${t.number}?`)) return;
    try {
      await deleteTable(t.id);
      toast.success("Mesa removida.");
      setTick((x) => x + 1);
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro ao remover"));
    }
  };

  const toggleBlock = async (t: TableMapRow) => {
    try {
      if (t.ui_status === "blocked") { await unblockTable(t.id); toast.success("Mesa desbloqueada."); }
      else { await blockTable(t.id); toast.success("Mesa bloqueada."); }
      setTick((x) => x + 1);
    } catch (e: any) {
      toast.error(translateTableError(e?.message ?? "Erro"));
    }
  };

  const openCreate = () => {
    if (atLimit) {
      toast.error(`Limite de ${limit} mesas do seu plano atingido. Faça upgrade para adicionar mais mesas.`);
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <AdminPageLayout
      title="Cadastro de mesas"
      subtitle={isUnlimited ? `${total} mesas cadastradas (plano ilimitado)` : `${total} de ${limit ?? 0} mesas usadas`}
      kicker="Configuração"
      icon={LayoutGrid}
      accent="violet"
      maxWidth="6xl"
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/mesas"><ArrowLeft className="h-4 w-4 mr-1" /> Mapa</Link>
          </Button>
          <Button size="sm" onClick={openCreate} disabled={atLimit}>
            <Plus className="h-4 w-4 mr-1" /> Nova mesa
          </Button>
        </>
      }
    >
      {atLimit && (
        <div className="rounded-lg border-2 border-brand-orange bg-brand-orange/10 p-3 text-sm">
          <strong>Limite do plano atingido.</strong> Você já cadastrou {total} mesas — o máximo permitido no plano{" "}
          <strong>{plan?.name ?? "atual"}</strong>. Faça upgrade em <Link to="/admin/configuracoes" className="underline font-bold">Configurações</Link>.
        </div>
      )}

      {loading ? (
        <LoadingState label="Carregando mesas..." />
      ) : error ? (
        <ErrorState description={error} onRetry={() => { setLoading(true); reload(); }} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ink/15 p-10 text-center space-y-3">
          <div className="text-sm text-ink/60">Nenhuma mesa cadastrada ainda.</div>
          <Button onClick={openCreate} disabled={atLimit}><Plus className="h-4 w-4 mr-1" /> Criar primeira mesa</Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border-2 border-ink/10">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-[11px] uppercase tracking-wider font-bold text-ink/60">
              <tr>
                <th className="text-left px-3 py-2">Mesa</th>
                <th className="text-left px-3 py-2">Apelido</th>
                <th className="text-left px-3 py-2">Área</th>
                <th className="text-left px-3 py-2">Cap.</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-ink/[.02]">
                  <td className="px-3 py-2 font-bold">{t.number}</td>
                  <td className="px-3 py-2 text-ink/70">{t.name ?? "—"}</td>
                  <td className="px-3 py-2 text-ink/70">{t.area ?? "—"}</td>
                  <td className="px-3 py-2 text-ink/70">{t.capacity}</td>
                  <td className="px-3 py-2 text-xs">
                    <StatusBadge status={t.ui_status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setQr(t)} title="QR Code"><QrCode className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleBlock(t)} title={t.ui_status === "blocked" ? "Desbloquear" : "Bloquear"}>
                        {t.ui_status === "blocked" ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setFormOpen(true); }} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => doDelete(t)} title="Remover"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {restaurantId && (
        <TableFormDialog
          restaurantId={restaurantId}
          table={editing}
          open={formOpen}
          onOpenChange={(v) => { if (!v) setEditing(null); setFormOpen(v); }}
          onSaved={() => setTick((t) => t + 1)}
        />
      )}
      <QrCodeDialog
        table={qr}
        open={!!qr}
        onOpenChange={(v) => { if (!v) setQr(null); }}
        onRegen={() => setTick((t) => t + 1)}
      />
    </AdminPageLayout>
  );
}

function StatusBadge({ status }: { status: TableMapRow["ui_status"] }) {
  const map = {
    free: { label: "Livre", cls: "border-ink/20 text-ink" },
    open: { label: "Ocupada", cls: "border-brand-orange text-brand-orange" },
    closing: { label: "Fechando", cls: "border-brand-amber text-ink" },
    blocked: { label: "Bloqueada", cls: "border-brand-magenta text-brand-magenta" },
    inactive: { label: "Inativa", cls: "border-ink/10 text-ink/50" },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center rounded-md border-2 px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] ${s.cls}`}>
      {s.label}
    </span>
  );
}
