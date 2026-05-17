import { createFileRoute, Outlet, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck, LayoutDashboard, Building2, Inbox, Layers, Megaphone,
  Settings2, LogOut, ArrowLeftRight, Users, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

export const Route = createFileRoute("/_super")({
  component: SuperLayout,
});

const NAV = [
  { to: "/super", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { to: "/super/lojas", label: "Lojas", icon: Building2 },
  { to: "/super/leads", label: "Leads", icon: Inbox },
  { to: "/super/equipe", label: "Equipe", icon: Users },
  { to: "/super/planos", label: "Planos & Preços", icon: Layers },
  { to: "/super/avisos", label: "Avisos globais", icon: Megaphone },
  { to: "/super/configuracoes", label: "Configurações", icon: Settings2 },
] as const;

function SuperLayout() {
  const { user, loading, metaLoading, isSuperAdmin, signOut } = useAuth();
  const nav = useNavigate();

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
      <div className="min-h-screen grid place-items-center bg-background bg-gradient-mesh">
        <div className="font-display text-3xl text-ink animate-pulse">Carregando…</div>
      </div>
    );
  }
  if (!user || !isSuperAdmin) return null;


  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — violet/ink, distinct from restaurant admin */}
      <aside className={`${collapsed ? "w-16" : "w-64"} transition-[width] duration-200 bg-ink text-background flex flex-col border-r-2 border-ink relative`}>
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />

        <div className={`relative p-5 flex items-center gap-3 border-b-2 border-background/10 ${collapsed ? "justify-center px-2" : ""}`} title="Super-Admin">
          <div className="h-11 w-11 rounded-xl bg-brand-violet border-2 border-background grid place-items-center shadow-[3px_3px_0_0_oklch(0.65_0.22_300)] shrink-0">
            <ShieldCheck className="h-6 w-6 text-background" />
          </div>
          {!collapsed && (
            <div className="leading-none">
              <div className="font-display text-lg tracking-tight">ComandaHub</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-brand-violet mt-1 font-bold">super-admin</div>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapsed}
          className="relative mx-3 mt-3 mb-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide text-background/70 hover:bg-background/10 border-2 border-background/15 transition-all"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Recolher</>}
        </button>

        <nav className="relative flex-1 p-3 space-y-1.5 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              activeOptions={{ exact: !!(item as any).exact }}
              activeProps={{
                className: "!bg-brand-violet !text-background !border-background shadow-[3px_3px_0_0_oklch(0.65_0.22_300)] translate-x-0.5",
              }}
              className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide border-2 border-transparent hover:bg-background/10 transition-all`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        <div className="relative p-3 border-t-2 border-background/10 space-y-1">
          <Link
            to="/admin"
            title="Painel da loja"
            className={`flex items-center ${collapsed ? "justify-center" : "gap-2"} px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-background/80 hover:bg-background/10 border-2 border-transparent hover:border-background/30 transition-all`}
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" /> {!collapsed && "Painel da loja"}
          </Link>
          {!collapsed && (
            <div className="px-2 py-1.5 text-[11px] text-background/60 truncate font-medium">{user?.email}</div>
          )}
          <button
            onClick={async () => { await signOut(); nav({ to: "/auth" }); }}
            title="Sair"
            className={`w-full mt-1 flex items-center ${collapsed ? "justify-center" : "gap-2"} px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide text-background/80 hover:bg-destructive hover:text-background border-2 border-transparent hover:border-background transition-all`}
          >
            <LogOut className="h-4 w-4 shrink-0" /> {!collapsed && "Sair"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-radial opacity-40 pointer-events-none" />
        <div className="relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
