import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutGrid, Plus, RefreshCw, Settings } from "lucide-react";

import { AdminPageLayout } from "@/components/ds";
import { LoadingState, ErrorState } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getTableMap, type TableMapRow } from "@/lib/tables";
import { TableMap } from "@/components/mesas/TableMap";
import { OpenSessionDialog } from "@/components/mesas/OpenSessionDialog";
import { CloseSessionDialog } from "@/components/mesas/CloseSessionDialog";
import { QrCodeDialog } from "@/components/mesas/QrCodeDialog";
import { TableActionsSheet } from "@/components/mesas/TableActionsSheet";
import { SessionDetailDialog } from "@/components/mesas/SessionDetailDialog";

export const Route = createFileRoute("/_authenticated/admin/mesas")({
  component: MesasPage,
});

function MesasPage() {
  return (
    <FeatureGate feature="tables_max">
      <MesasContent />
    </FeatureGate>
  );
}

function MesasContent() {
  const { restaurantId } = useAuth();
  const [tables, setTables] = useState<TableMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TableMapRow | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState<TableMapRow | null>(null);
  const [closeDialog, setCloseDialog] = useState<TableMapRow | null>(null);
  const [qrDialog, setQrDialog] = useState<TableMapRow | null>(null);
  const [detailDialog, setDetailDialog] = useState<TableMapRow | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setError(null);
      const rows = await getTableMap(restaurantId);
      setTables(rows);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar mesas.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { reload(); }, [reload, tick]);

  // Realtime: qualquer mudança em mesas/sessões/pedidos vinculados dispara reload.
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`tables-map-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables", filter: `restaurant_id=eq.${restaurantId}` }, () => setTick((t) => t + 1))
      .on("postgres_changes", { event: "*", schema: "public", table: "table_sessions", filter: `restaurant_id=eq.${restaurantId}` }, () => setTick((t) => t + 1))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  // Recalcula duração exibida a cada minuto.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => ({
    total: tables.length,
    open: tables.filter((t) => t.ui_status === "open" || t.ui_status === "closing").length,
    free: tables.filter((t) => t.ui_status === "free").length,
    revenue: tables.reduce((acc, t) => acc + Number(t.current_total ?? 0), 0),
  }), [tables]);

  const handleSelect = (t: TableMapRow) => { setSelected(t); setActionsOpen(true); };

  return (
    <AdminPageLayout
      title="Mesas"
      subtitle={loading ? "Carregando mapa..." : `${stats.open}/${stats.total} ocupadas · ${stats.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em aberto`}
      kicker="Salão"
      icon={LayoutGrid}
      accent="orange"
      maxWidth="7xl"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/mesas/cadastro">
              <Settings className="h-4 w-4 mr-1" /> Cadastro
            </Link>
          </Button>
        </>
      }
    >
      {loading ? (
        <LoadingState label="Carregando mesas..." />
      ) : error ? (
        <ErrorState description={error} onRetry={() => { setLoading(true); reload(); }} />
      ) : tables.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ink/15 p-10 text-center space-y-3">
          <div className="text-sm text-ink/60">Você ainda não cadastrou nenhuma mesa.</div>
          <Button asChild>
            <Link to="/admin/mesas/cadastro"><Plus className="h-4 w-4 mr-1" /> Cadastrar primeira mesa</Link>
          </Button>
        </div>
      ) : (
        <TableMap
          tables={tables}
          onSelect={handleSelect}
          onQr={(t) => { setQrDialog(t); }}
        />
      )}

      <TableActionsSheet
        table={selected}
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        onOpenSession={(t) => { setActionsOpen(false); setOpenDialog(t); }}
        onCloseSession={(t) => { setActionsOpen(false); setCloseDialog(t); }}
        onShowQr={(t) => { setActionsOpen(false); setQrDialog(t); }}
        onChanged={() => setTick((t) => t + 1)}
      />

      <OpenSessionDialog
        table={openDialog}
        open={!!openDialog}
        onOpenChange={(v) => { if (!v) setOpenDialog(null); }}
        onOpened={() => setTick((t) => t + 1)}
      />

      <CloseSessionDialog
        table={closeDialog}
        open={!!closeDialog}
        onOpenChange={(v) => { if (!v) setCloseDialog(null); }}
        onClosed={() => setTick((t) => t + 1)}
      />

      <QrCodeDialog
        table={qrDialog}
        open={!!qrDialog}
        onOpenChange={(v) => { if (!v) setQrDialog(null); }}
        onRegen={() => setTick((t) => t + 1)}
      />
    </AdminPageLayout>
  );
}
