import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, Mail, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: Clientes,
  head: () => ({ meta: [{ title: "Clientes — ComandaHub" }] }),
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Sua base de clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total de clientes</div>
          <div className="text-2xl font-bold">{customers.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total de pedidos</div>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Receita acumulada</div>
          <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, telefone ou e-mail..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
        </Card>
      ) : (
        <Card className="divide-y">
          {filtered.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
              <div className="flex-1">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                  {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  {c.last_order_at && <span>Último: {new Date(c.last_order_at).toLocaleDateString("pt-BR")}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end"><ShoppingBag className="h-3 w-3" />{c.total_orders ?? 0} pedidos</div>
                <div className="font-bold text-lg">R$ {Number(c.total_spent ?? 0).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
