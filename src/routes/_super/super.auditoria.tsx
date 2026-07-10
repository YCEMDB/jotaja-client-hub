import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileClock, Search, ChevronLeft, ChevronRight, Bot, User as UserIcon, Download } from "lucide-react";

export const Route = createFileRoute("/_super/super/auditoria")({
  component: AuditoriaPage,
  head: () => ({ meta: [{ title: "Super-Admin — Auditoria" }] }),
});

type Row = {
  id: string;
  action: string;
  category: string;
  actor_id: string | null;
  actor_type: string;
  actor_role: string | null;
  actor_email: string | null;
  restaurant_id: string | null;
  restaurant_name: string | null;
  entity_type: string | null;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  reason: string | null;
  metadata: unknown;
  support_session_id: string | null;
  created_at: string;
};

const CATEGORIES = ["general", "billing", "support", "security", "team"];
const PAGE_SIZE = 50;

function AuditoriaPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    supabase.from("restaurants").select("id,name").order("name")
      .then(({ data }) => setRestaurants((data ?? []) as Array<{ id: string; name: string }>));
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_audit_logs" as never, {
      p_from: from ? new Date(from).toISOString() : null,
      p_to: to ? new Date(new Date(to).getTime() + 86400000).toISOString() : null,
      p_restaurant_id: restaurantId || null,
      p_actor_id: null,
      p_action: action || null,
      p_category: category || null,
      p_search: search.trim() || null,
      p_limit: PAGE_SIZE,
      p_offset: page * PAGE_SIZE,
    } as never);
    setLoading(false);
    if (error) return;
    const res = data as unknown as { total: number; rows: Row[] };
    setRows(res?.rows ?? []);
    setTotal(res?.total ?? 0);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = () => { setPage(0); load(); };

  const exportCsv = () => {
    const header = ["created_at","action","category","actor_email","actor_role","actor_type","restaurant_name","entity_type","entity_id","reason"];
    const lines = [header.join(",")].concat(
      rows.map((r) => header.map((k) => {
        const v = (r as unknown as Record<string, unknown>)[k];
        const s = v == null ? "" : String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      }).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `auditoria-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPageLayout
      kicker="Super-admin"
      title="Auditoria"
      subtitle="Histórico imutável de ações administrativas sensíveis"
      accent="violet"
      icon={FileClock}
      actions={
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
          <Download className="h-4 w-4 mr-1" /> Exportar página (CSV)
        </Button>
      }
    >
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por ação ou motivo…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} />
          </div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select value={category || "__all"} onValueChange={(v) => setCategory(v === "__all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={restaurantId || "__all"} onValueChange={(v) => setRestaurantId(v === "__all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Restaurante" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos restaurantes</SelectItem>
              {restaurants.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Ação exata (ex: trial_extended)" value={action} onChange={(e) => setAction(e.target.value)} className="max-w-xs" />
          <Button onClick={applyFilters} disabled={loading}>{loading ? "Carregando…" : "Aplicar filtros"}</Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="p-3">Quando</th>
              <th className="p-3">Ação</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Ator</th>
              <th className="p-3">Restaurante</th>
              <th className="p-3">Motivo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/40">
                <td className="p-3 text-xs font-mono">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="p-3"><Badge variant="outline" className="font-mono text-[11px]">{r.action}</Badge></td>
                <td className="p-3 text-xs uppercase">{r.category}</td>
                <td className="p-3 text-xs">
                  <div className="flex items-center gap-1">
                    {r.actor_type === "system" ? <Bot className="h-3 w-3 text-brand-violet" /> : <UserIcon className="h-3 w-3" />}
                    <span className="truncate max-w-[180px]">{r.actor_email ?? r.actor_type}</span>
                  </div>
                  {r.actor_role && <span className="text-[10px] text-muted-foreground uppercase">{r.actor_role}</span>}
                </td>
                <td className="p-3 text-xs">{r.restaurant_name ?? "—"}</td>
                <td className="p-3 text-xs max-w-[240px] truncate">{r.reason ?? "—"}</td>
                <td className="p-3"><Button variant="ghost" size="sm" onClick={() => setDetail(r)}>Detalhes</Button></td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum evento encontrado</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total} evento(s) · página {page + 1} de {totalPages}
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages || loading} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{detail?.action}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Quando: </span>{new Date(detail.created_at).toLocaleString("pt-BR")}</div>
                <div><span className="text-muted-foreground">Categoria: </span>{detail.category}</div>
                <div><span className="text-muted-foreground">Ator: </span>{detail.actor_email ?? detail.actor_type}</div>
                <div><span className="text-muted-foreground">Papel: </span>{detail.actor_role ?? "—"}</div>
                <div><span className="text-muted-foreground">Restaurante: </span>{detail.restaurant_name ?? "—"}</div>
                <div><span className="text-muted-foreground">Entidade: </span>{detail.entity_type ?? "—"} {detail.entity_id ? `#${detail.entity_id.slice(0,8)}` : ""}</div>
                {detail.support_session_id && (
                  <div className="col-span-2"><span className="text-muted-foreground">Sessão de suporte: </span><code className="text-[10px]">{detail.support_session_id}</code></div>
                )}
              </div>
              {detail.reason && (
                <div><p className="text-xs uppercase font-bold text-muted-foreground">Motivo</p><p>{detail.reason}</p></div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground">Valor anterior</p>
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(detail.old_value, null, 2)}</pre>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground">Novo valor</p>
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(detail.new_value, null, 2)}</pre>
                </div>
              </div>
              {(detail.metadata !== null && detail.metadata !== undefined) ? (
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground">Metadados</p>
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(detail.metadata, null, 2)}</pre>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
