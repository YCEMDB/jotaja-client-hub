import { createFileRoute, Outlet, Link, useNavigate, useLocation, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings, LogOut,
  Tags, Truck, BarChart3, ShieldCheck, ShoppingCart, Wallet, Monitor, Cog,
  PanelLeftClose, PanelLeftOpen, Menu, ChevronRight, User as UserIcon, MessageSquare,
  LayoutGrid, Boxes,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BlockedStoreScreen } from "@/components/BlockedStoreScreen";
import { GlobalAnnouncementsBanner } from "@/components/GlobalAnnouncementsBanner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
      { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
      { to: "/admin/mesas", label: "Mesas", icon: LayoutGrid },
      { to: "/admin/kds", label: "KDS", icon: Monitor },
      { to: "/admin/pdv", label: "PDV Manual", icon: ShoppingCart },
      { to: "/admin/caixa", label: "Caixa", icon: Wallet },
      { to: "/admin/entregas", label: "Entregas", icon: Truck },
      { to: "/admin/estoque", label: "Estoque", icon: Boxes },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
      { to: "/admin/cupons", label: "Cupons", icon: Tags },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { to: "/admin/clientes", label: "Clientes", icon: Users },
      { to: "/admin/entregadores", label: "Entregadores", icon: Truck },
      { to: "/admin/equipe", label: "Equipe", icon: UserIcon },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/admin/financeiro", label: "Financeiro", icon: Wallet },
      { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/comunicacao", label: "Comunicação", icon: MessageSquare },
      { to: "/admin/operacoes", label: "Operações", icon: Cog },
      { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

function SidebarBody({
  collapsed,
  isSuperAdmin,
  restaurants,
  restaurantId,
  selectRestaurant,
  onNavigate,
}: {
  collapsed: boolean;
  isSuperAdmin: boolean;
  restaurants: { id: string; name: string }[];
  restaurantId: string | null;
  selectRestaurant: (id: string) => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

      <Link
        to="/admin"
        onClick={onNavigate}
        className={`relative p-5 flex items-center gap-3 border-b-2 border-background/10 hover:bg-background/5 transition-colors ${collapsed ? "justify-center px-2" : ""}`}
        title="Comandex"
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
            <div className="font-display text-lg tracking-tight">Comandex</div>
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

      <nav className="relative flex-1 p-3 overflow-y-auto">
        {isSuperAdmin && (
          <Link
            to="/super"
            onClick={onNavigate}
            title="Ir para Super-Admin"
            className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-background/10 transition-all mb-3 border-2 border-brand-violet/60 text-brand-violet`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && "Super-Admin"}
          </Link>
        )}

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3 last:mb-0">
            {!collapsed && (
              <div className="px-3 pb-1.5 pt-1 text-[9px] uppercase tracking-[0.22em] font-bold text-background/40">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={item.label}
                  activeOptions={{ exact: !!item.exact }}
                  activeProps={{
                    className: "!bg-brand-orange !text-ink !border-background shadow-[3px_3px_0_0_oklch(0.62_0.24_0)] translate-x-0.5",
                  }}
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide border-2 border-transparent hover:bg-background/10 transition-all`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

function TopBar({
  onOpenMobile,
  userEmail,
  onSignOut,
}: {
  onOpenMobile: () => void;
  userEmail?: string | null;
  onSignOut: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = ALL_NAV.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to) && n.to !== "/admin")) ??
    ALL_NAV.find((n) => n.to === "/admin");
  const groupLabel = NAV_GROUPS.find((g) => g.items.some((i) => i.to === current?.to))?.label ?? "Operação";
  const initial = (userEmail?.[0] ?? "U").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10 h-14 md:h-16 bg-background/95 backdrop-blur-md border-b-2 border-ink/10">
      <button
        onClick={onOpenMobile}
        aria-label="Abrir menu"
        className="md:hidden h-9 w-9 grid place-items-center rounded-lg border-2 border-ink/20 hover:bg-ink/5"
      >
        <Menu className="h-5 w-5 text-ink" />
      </button>

      {/* Breadcrumb */}
      <nav className="min-w-0 flex-1 flex items-center gap-1.5 text-sm">
        <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] font-bold text-ink/40">
          {groupLabel}
        </span>
        <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-ink/30 shrink-0" />
        <span className="font-display text-base md:text-lg text-ink truncate">
          {current?.label ?? "Painel"}
        </span>
      </nav>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border-2 border-ink/15 hover:border-ink/40 hover:bg-ink/5 pl-1 pr-2 md:pr-3 py-1 transition-colors">
          <div className="h-7 w-7 grid place-items-center rounded-md bg-ink text-background font-bold text-sm">
            {initial}
          </div>
          <span className="hidden md:inline text-xs font-bold text-ink/70 max-w-[160px] truncate">
            {userEmail}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate text-xs">{userEmail}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/admin/configuracoes" className="cursor-pointer">
              <UserIcon className="h-4 w-4 mr-2" /> Conta
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
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
      // Trial expirado = tinha trial_ends_at e já venceu. Sem trial_ends_at
      // ou com data futura → bloqueio é de assinatura.
      const hadTrial = !!activeRestaurant.trial_ends_at;
      const trialExpired = hadTrial && new Date(activeRestaurant.trial_ends_at as string).getTime() <= Date.now();
      return { reason: trialExpired ? ("trial" as const) : ("subscription" as const) };
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
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden relative flex flex-col">
        <TopBar
          onOpenMobile={() => setMobileOpen(true)}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />
        <div className="absolute top-14 md:top-16 left-0 right-0 h-32 bg-gradient-radial opacity-60 pointer-events-none" />
        <div className="relative flex-1 min-w-0">
          <GlobalAnnouncementsBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
