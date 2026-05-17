import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings, LogOut,
  Tags, Truck, BarChart3, ShieldCheck, ShoppingCart,
  PanelLeftClose, PanelLeftOpen, Menu,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { BlockedStoreScreen } from "@/components/BlockedStoreScreen";
import { GlobalAnnouncementsBanner } from "@/components/GlobalAnnouncementsBanner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const NAV = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/pdv", label: "PDV Manual", icon: ShoppingCart },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/cupons", label: "Cupons", icon: Tags },
  { to: "/admin/entregadores", label: "Entregadores", icon: Truck },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/configuracoes", label: "Config", icon: Settings },
] as const;

function SidebarBody({
  collapsed,
  isSuperAdmin,
  restaurants,
  restaurantId,
  selectRestaurant,
  userEmail,
  onSignOut,
  onNavigate,
}: {
  collapsed: boolean;
  isSuperAdmin: boolean;
  restaurants: { id: string; name: string }[];
  restaurantId: string | null;
  selectRestaurant: (id: string) => void;
  userEmail?: string | null;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

      <Link
        to="/admin"
        onClick={onNavigate}
        className={`relative p-5 flex items-center gap-3 border-b-2 border-background/10 hover:bg-background/5 transition-colors ${collapsed ? "justify-center px-2" : ""}`}
        title="ComandaHub"
      >
        <div className="h-11 w-11 rounded-xl bg-brand-orange border-2 border-background grid place-items-center shadow-[3px_3px_0_0_oklch(0.62_0.24_0)] shrink-0">
          <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
            <rect x="12" y="13" width="20" height="4.5" rx="2.25" fill="#fff" />
            <rect x="12" y="21.75" width="14" height="4.5" rx="2.25" fill="#fff" />
            <rect x="12" y="30.5" width="20" height="4.5" rx="2.25" fill="#fff" />
            <circle cx="36" cy="24" r="3.25" fill="#0a0a0a" />
          </svg>
        </div>
        {!collapsed && (
          <div className="leading-none">
            <div className="font-display text-lg tracking-tight">ComandaHub</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-background/50 mt-1">painel</div>
          </div>
        )}
      </Link>

      {!collapsed && (isSuperAdmin || restaurants.length > 1) && restaurants.length > 0 && (
        <div className="relative p-3 border-b-2 border-background/10">
          <label className="text-[10px] uppercase tracking-[0.18em] font-bold text-background/60 px-1">Restaurante</label>
          <Select value={restaurantId ?? ""} onValueChange={(v) => { selectRestaurant(v); onNavigate?.(); }}>
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
            to="/super"
            onClick={onNavigate}
            title="Ir para Super-Admin"
            className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-background/10 transition-all mb-3 border-2 border-brand-violet/60 text-brand-violet`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && "Ir para Super-Admin"}
          </Link>
        )}
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={item.label}
            activeOptions={{ exact: item.to === "/admin" }}
            activeProps={{
              className: "!bg-brand-orange !text-ink !border-background shadow-[3px_3px_0_0_oklch(0.62_0.24_0)] translate-x-0.5",
            }}
            className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide border-2 border-transparent hover:bg-background/10 transition-all`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      <div className="relative p-3 border-t-2 border-background/10">
        {!collapsed && (
          <div className="px-2 py-1.5 text-[11px] text-background/60 truncate font-medium">{userEmail}</div>
        )}
        <button
          onClick={onSignOut}
          title="Sair"
          className={`w-full mt-1 flex items-center ${collapsed ? "justify-center" : "gap-2"} px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide text-background/80 hover:bg-destructive hover:text-background border-2 border-transparent hover:border-background transition-all`}
        >
          <LogOut className="h-4 w-4 shrink-0" /> {!collapsed && "Sair"}
        </button>
      </div>
    </>
  );
}

function AuthLayout() {
  const { user, signOut, loading, metaLoading, restaurantId, isSuperAdmin, restaurants, selectRestaurant } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin_sidebar_collapsed") === "1";
  });
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem("admin_sidebar_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  if (loading || (user && metaLoading)) {
    return (
      <div className="min-h-screen grid place-items-center bg-background bg-gradient-mesh p-6">
        <div className="font-display text-2xl sm:text-3xl text-ink animate-pulse">Carregando…</div>
      </div>
    );
  }

  if (blocked && activeRestaurant && !location.pathname.startsWith("/admin/onboarding")) {
    return <BlockedStoreScreen restaurantName={activeRestaurant.name} reason={blocked.reason} />;
  }

  const handleSignOut = async () => { await signOut(); nav({ to: "/auth" }); };

  const desktopBody = (extra?: ReactNode): ReactNode => extra;
  void desktopBody;

  return (
    <div className="min-h-screen flex bg-background overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-64"} hidden md:flex transition-[width] duration-200 bg-ink text-background flex-col border-r-2 border-ink relative shrink-0`}
      >
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-6 z-10 h-7 w-7 rounded-full bg-ink text-background border-2 border-background grid place-items-center hover:bg-brand-orange hover:text-ink transition-colors"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
        <SidebarBody
          collapsed={collapsed}
          isSuperAdmin={isSuperAdmin}
          restaurants={restaurants}
          restaurantId={restaurantId}
          selectRestaurant={selectRestaurant}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-ink text-background border-r-2 border-ink [&>button]:text-background">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex flex-col h-full relative">
            <SidebarBody
              collapsed={false}
              isSuperAdmin={isSuperAdmin}
              restaurants={restaurants}
              restaurantId={restaurantId}
              selectRestaurant={selectRestaurant}
              userEmail={user?.email}
              onSignOut={() => { setMobileOpen(false); handleSignOut(); }}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden relative flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-ink text-background border-b-2 border-ink">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="h-9 w-9 grid place-items-center rounded-lg border-2 border-background/20 hover:bg-background/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/admin" className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-brand-orange border-2 border-background grid place-items-center shrink-0">
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                <rect x="12" y="13" width="20" height="4.5" rx="2.25" fill="#fff" />
                <rect x="12" y="21.75" width="14" height="4.5" rx="2.25" fill="#fff" />
                <rect x="12" y="30.5" width="20" height="4.5" rx="2.25" fill="#fff" />
                <circle cx="36" cy="24" r="3.25" fill="#0a0a0a" />
              </svg>
            </div>
            <span className="font-display text-base truncate">ComandaHub</span>
          </Link>
        </header>

        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-radial opacity-60 pointer-events-none" />
        <div className="relative flex-1 min-w-0">
          <GlobalAnnouncementsBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
