import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck, LayoutDashboard, Building2, Inbox, Layers, Megaphone,
  Settings2, LogOut, ArrowLeftRight, Users, PanelLeftClose, PanelLeftOpen,
  Menu, ChevronRight, User as UserIcon, FileClock,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_super")({
  component: SuperLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão",
    items: [
      { to: "/super", label: "Visão geral", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Tenants",
    items: [
      { to: "/super/lojas", label: "Lojas", icon: Building2 },
      { to: "/super/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    label: "Comercial",
    items: [
      { to: "/super/planos", label: "Planos & Preços", icon: Layers },
      { to: "/super/avisos", label: "Avisos globais", icon: Megaphone },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/super/auditoria", label: "Auditoria", icon: FileClock },
      { to: "/super/equipe", label: "Equipe", icon: Users },
      { to: "/super/configuracoes", label: "Configurações", icon: Settings2 },
    ],
  },
];


const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

function SuperBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

      <div className={`relative p-5 flex items-center gap-3 border-b-2 border-background/10 ${collapsed ? "justify-center px-2" : ""}`} title="Super-Admin">
        <div className="h-11 w-11 rounded-xl bg-brand-violet border-2 border-background grid place-items-center shadow-[3px_3px_0_0_oklch(0.65_0.22_300)] shrink-0">
          <ShieldCheck className="h-6 w-6 text-background" />
        </div>
        {!collapsed && (
          <div className="leading-none">
            <div className="font-display text-lg tracking-tight">Mesivo</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-brand-violet mt-1 font-bold">super-admin</div>
          </div>
        )}
      </div>

      <nav className="relative flex-1 p-3 overflow-y-auto">
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
                    className: "!bg-brand-violet !text-background !border-background shadow-[3px_3px_0_0_oklch(0.65_0.22_300)] translate-x-0.5",
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

      <div className="relative p-3 border-t-2 border-background/10">
        <Link
          to="/admin"
          onClick={onNavigate}
          title="Painel da loja"
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2"} px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-background/80 hover:bg-background/10 border-2 border-transparent hover:border-background/30 transition-all`}
        >
          <ArrowLeftRight className="h-4 w-4 shrink-0" /> {!collapsed && "Painel da loja"}
        </Link>
      </div>
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
  const current =
    ALL_NAV.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to) && n.to !== "/super")) ??
    ALL_NAV.find((n) => n.to === "/super");
  const groupLabel = NAV_GROUPS.find((g) => g.items.some((i) => i.to === current?.to))?.label ?? "Visão";
  const initial = (userEmail?.[0] ?? "S").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-10 h-14 md:h-16 bg-background/95 backdrop-blur-md border-b-2 border-ink/10">
      <button
        onClick={onOpenMobile}
        aria-label="Abrir menu"
        className="md:hidden h-9 w-9 grid place-items-center rounded-lg border-2 border-ink/20 hover:bg-ink/5"
      >
        <Menu className="h-5 w-5 text-ink" />
      </button>

      <nav className="min-w-0 flex-1 flex items-center gap-1.5 text-sm">
        <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] font-bold text-brand-violet/70">
          Super · {groupLabel}
        </span>
        <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-ink/30 shrink-0" />
        <span className="font-display text-base md:text-lg text-ink truncate">
          {current?.label ?? "Visão geral"}
        </span>
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border-2 border-ink/15 hover:border-ink/40 hover:bg-ink/5 pl-1 pr-2 md:pr-3 py-1 transition-colors">
          <div className="h-7 w-7 grid place-items-center rounded-md bg-brand-violet text-background font-bold text-sm">
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
            <Link to="/admin" className="cursor-pointer">
              <UserIcon className="h-4 w-4 mr-2" /> Painel da loja
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

function SuperLayout() {
  const { user, loading, metaLoading, isSuperAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading || metaLoading) return;
    if (!user) { nav({ to: "/auth" }); return; }
    if (!isSuperAdmin) { nav({ to: "/admin" }); }
  }, [user, loading, metaLoading, isSuperAdmin, nav]);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("super_sidebar_collapsed") === "1";
  });
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem("super_sidebar_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  if (loading || metaLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background bg-gradient-mesh p-6">
        <div className="font-display text-2xl sm:text-3xl text-ink animate-pulse">Carregando…</div>
      </div>
    );
  }
  if (!user || !isSuperAdmin) return null;

  const handleSignOut = async () => { await signOut(); nav({ to: "/auth" }); };

  return (
    <div className="min-h-screen flex bg-background overflow-x-hidden">
      <aside
        className={`${collapsed ? "w-16" : "w-64"} hidden md:flex transition-[width] duration-200 bg-ink text-background flex-col border-r-2 border-ink relative shrink-0`}
      >
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-6 z-10 h-7 w-7 rounded-full bg-ink text-background border-2 border-background grid place-items-center hover:bg-brand-violet transition-colors"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
        <SuperBody collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-ink text-background border-r-2 border-ink [&>button]:text-background">
          <SheetTitle className="sr-only">Menu Super-Admin</SheetTitle>
          <div className="flex flex-col h-full relative">
            <SuperBody collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 min-w-0 overflow-x-hidden relative flex flex-col">
        <TopBar
          onOpenMobile={() => setMobileOpen(true)}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />
        <div className="absolute top-14 md:top-16 left-0 right-0 h-32 bg-gradient-radial opacity-40 pointer-events-none" />
        <div className="relative flex-1 min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
