import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, ArrowLeft } from "lucide-react";
import { AdminPageLayout, LoadingState, ErrorState } from "@/components/ds";
import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getTableMap, type TableMapRow } from "@/lib/tables";
import { TableLayoutEditor } from "@/components/mesas/TableLayoutEditor";

export const Route = createFileRoute("/_authenticated/admin/mesas/editor")({
  component: EditorPage,
});

function EditorPage() {
  return (
    <FeatureGate feature="tables_max">
      <EditorContent />
    </FeatureGate>
  );
}

function EditorContent() {
  const { restaurantId } = useAuth();
  const [tables, setTables] = useState<TableMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!restaurantId) return;
    const ch = supabase
      .channel(`tables-editor-${restaurantId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "restaurant_tables", filter: `restaurant_id=eq.${restaurantId}` },
        () => setTick((t) => t + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId]);

  return (
    <AdminPageLayout
      title="Editor visual"
      subtitle={loading ? "Carregando mesas..." : `${tables.length} mesas · arraste para posicionar`}
      kicker="Salão / Layout"
      icon={LayoutGrid}
      accent="violet"
      maxWidth="7xl"
      actions={
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/mesas"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao mapa</Link>
        </Button>
      }
    >
      {loading ? (
        <LoadingState label="Carregando..." />
      ) : error ? (
        <ErrorState description={error} onRetry={() => { setLoading(true); reload(); }} />
      ) : tables.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ink/15 p-10 text-center text-sm text-ink/60">
          Cadastre mesas antes de editar o layout.
        </div>
      ) : (
        <TableLayoutEditor
          restaurantId={restaurantId!}
          tables={tables}
          onSaved={() => setTick((t) => t + 1)}
        />
      )}
    </AdminPageLayout>
  );
}
