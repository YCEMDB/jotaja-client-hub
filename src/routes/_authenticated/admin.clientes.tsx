import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Phone, Mail, ShoppingBag } from "lucide-react";
import { CustomerTimelineDialog } from "@/components/comunicacao/CustomerTimelineDialog";
import { AdminPageLayout, StatCard, DashboardGrid, EmptyState, Section, FilterBar, SearchBar } from "@/components/ds";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: Clientes,
  head: () => ({ meta: [{ title: "Clientes — Comandex" }] }),
});

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  total_orders: number | null;
  total_spent: number | null;
  last_order_at: string | null;
  created_at: string;
}

function Clientes() {
  const { restaurantId } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("total_spent", { ascending: false, nullsFirst: false });
      setCustomers((data as Customer[]) ?? []);
    })();
  }, [restaurantId]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.email ?? "").toLowerCase().includes(s)
    );
  }, [q, customers]);

  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent ?? 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + Number(c.total_orders ?? 0), 0);

  return (
    <AdminPageLayout
      kicker="Base"
      title="Clientes"
      subtitle="Sua base de clientes"
      accent="magenta"
      icon={Users}
    >
      <DashboardGrid cols={3}>
        <StatCard label="Total de clientes" value={customers.length} icon={Users} accent="magenta" />
        <StatCard label="Total de pedidos" value={totalOrders} icon={ShoppingBag} accent="orange" />
        <StatCard label="Receita acumulada" value={`R$ ${totalRevenue.toFixed(2)}`} accent="green" />
      </DashboardGrid>

      <FilterBar>
        <SearchBar value={q} onChange={setQ} placeholder="Buscar por nome, telefone ou e-mail..." />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Ajuste os filtros ou aguarde os primeiros pedidos." />
      ) : (
        <Section className="p-0 overflow-hidden">
          <ul className="divide-y divide-ink/10">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink truncate">{c.name}</div>
                    <div className="text-sm text-ink/60 flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                      {c.last_order_at && <span>Último: {new Date(c.last_order_at).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-sm text-ink/60 flex items-center gap-1 justify-end"><ShoppingBag className="h-3 w-3" />{c.total_orders ?? 0} pedidos</div>
                    <div className="font-bold text-lg text-ink">R$ {Number(c.total_spent ?? 0).toFixed(2)}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <CustomerTimelineDialog customerId={openId} open={!!openId} onOpenChange={(v) => !v && setOpenId(null)} />
    </AdminPageLayout>
  );
}
