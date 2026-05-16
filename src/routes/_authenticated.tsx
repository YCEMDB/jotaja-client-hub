import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings, LogOut, Tags, Truck, BarChart3, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logoIcon from "@/assets/comandahub-mark.svg";
import { BlockedStoreScreen } from "@/components/BlockedStoreScreen";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const NAV = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/cupons", label: "Cupons", icon: Tags },
  { to: "/admin/entregadores", label: "Entregadores", icon: Truck },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/configuracoes", label: "Config", icon: Settings },
] as const;

function AuthLayout() {
  const { user, signOut, loading, metaLoading, restaurantId, isSuperAdmin, restaurants, selectRestaurant } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && !metaLoading && user && !isSuperAdmin && !restaurantId && window.location.pathname !== "/admin/onboarding") {
      nav({ to: "/admin/onboarding" });
    }
  }, [user, loading, metaLoading, restaurantId, isSuperAdmin, nav]);

  const activeRestaurant = useMemo(
    () => restaurants.find((r) => r.id === restaurantId) ?? null,
    [restaurants, restaurantId],
  );

  const blocked = useMemo(() => {
    if (!activeRestaurant || isSuperAdmin) return null;
    if (activeRestaurant.is_active === false) {
      const isTrial = activeRestaurant.plan === "trial";
      return { reason: isTrial ? ("trial" as const) : ("subscription" as const) };
    }
    return null;
  }, [activeRestaurant, isSuperAdmin]);

  if (loading || (user && metaLoading)) {
    return (
      <div className="min-h-screen grid place-items-center bg-background bg-gradient-mesh">
        <div className="font-display text-3xl text-ink animate-pulse">Carregando…</div>
      </div>
    );
  }

  if (blocked && activeRestaurant && !location.pathname.startsWith("/admin/onboarding")) {
    return <BlockedStoreScreen restaurantName={activeRestaurant.name} reason={blocked.reason} />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — ink brutalist */}
      <aside className="w-64 bg-ink text-background flex flex-col border-r-2 border-ink relative">
        {/* Decorative noise/grain */}
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

        <Link
          to="/admin"
          className="relative p-5 flex items-center gap-3 border-b-2 border-background/10 hover:bg-background/5 transition-colors"
        >
          <div className="h-11 w-11 rounded-xl bg-brand-orange border-2 border-background grid place-items-center shadow-[3px_3px_0_0_oklch(0.62_0.24_0)]">
            <img src={logoIcon} alt="" className="h-7 w-7" />
          </div>
          <div className="leading-none">
            <div className="font-display text-lg tracking-tight">ComandaHub</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-background/50 mt-1">painel</div>
          </div>
        </Link>

        {(isSuperAdmin || restaurants.length > 1) && restaurants.length > 0 && (
          <div className="relative p-3 border-b-2 border-background/10">
            <label className="text-[10px] uppercase tracking-[0.18em] font-bold text-background/60 px-1">Restaurante</label>
            <Select value={restaurantId ?? ""} onValueChange={selectRestaurant}>
              <SelectTrigger className="mt-1.5 bg-background/10 border-2 border-background/20 text-background font-bold hover:bg-background/15">
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

        <nav className="relative flex-1 p-3 space-y-1.5 overflow-y-auto">
          {isSuperAdmin && (
            <Link
              to="/admin/super"
              activeProps={{ className: "!bg-brand-magenta !text-background shadow-[3px_3px_0_0_oklch(0.78_0.17_65)]" }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-background/10 transition-all mb-3 border-2 border-brand-magenta/60 text-brand-magenta"
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
              activeProps={{
                className: "!bg-brand-orange !text-ink !border-background shadow-[3px_3px_0_0_oklch(0.62_0.24_0)] translate-x-0.5",
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide border-2 border-transparent hover:bg-background/10 transition-all"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative p-3 border-t-2 border-background/10">
          <div className="px-2 py-1.5 text-[11px] text-background/60 truncate font-medium">{user?.email}</div>
          <button
            onClick={async () => { await signOut(); nav({ to: "/auth" }); }}
            className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide text-background/80 hover:bg-destructive hover:text-background border-2 border-transparent hover:border-background transition-all"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-radial opacity-60 pointer-events-none" />
        <div className="relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
