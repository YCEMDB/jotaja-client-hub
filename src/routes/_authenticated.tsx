import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings, LogOut, Tags, Truck, BarChart3, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "@/assets/comanda-logo.png";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/cupons", label: "Cupons", icon: Tags },
  { to: "/admin/entregadores", label: "Entregadores", icon: Truck },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AuthLayout() {
  const { user, signOut, loading, restaurantId, isSuperAdmin, restaurants, selectRestaurant } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && !isSuperAdmin && !restaurantId && window.location.pathname !== "/admin/onboarding") {
      nav({ to: "/admin/onboarding" });
    }
  }, [user, loading, restaurantId, isSuperAdmin, nav]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center">Carregando…</div>;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-6 flex items-center gap-2 border-b border-primary-foreground/10">
          <img src={logo} alt="" className="h-8 w-8 rounded-md bg-white p-0.5" />
          <span className="font-bold text-lg">Comanda</span>
        </div>

        {(isSuperAdmin || restaurants.length > 1) && restaurants.length > 0 && (
          <div className="p-3 border-b border-primary-foreground/10">
            <label className="text-[10px] uppercase tracking-wider text-primary-foreground/60 px-1">Restaurante ativo</label>
            <Select value={restaurantId ?? ""} onValueChange={selectRestaurant}>
              <SelectTrigger className="mt-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {isSuperAdmin && (
            <Link
              to="/admin/super"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-primary-foreground/10 transition-colors mb-2 border border-accent/40"
            >
              <ShieldCheck className="h-4 w-4" />
              Super-Admin
            </Link>
          )}
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/admin" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-primary-foreground/10 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-foreground/10">
          <div className="px-3 py-2 text-xs text-primary-foreground/60 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/10" onClick={async () => { await signOut(); nav({ to: "/auth" }); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
