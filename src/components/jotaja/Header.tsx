import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./LeadFormDialog";
import { Logo } from "./Logo";

type NavItem = { label: string; href: string; route?: boolean };

const navItems: NavItem[] = [
  { label: "Cardápio Digital", href: "/cardapio-digital", route: true },
  { label: "Alternativa ao iFood", href: "/alternativa-ifood", route: true },
  { label: "Blog", href: "/blog", route: true },
  { label: "Planos", href: "/#planos" },
  { label: "FAQ", href: "/#faq" },
];

/**
 * Header — integrado ao Hero no topo (fundo quase transparente) e
 * consolidado após ~24px de rolagem (fundo translúcido + borda + leve
 * redução de altura). Sem hide-on-scroll nesta sprint. Mobile mantém
 * fundo sólido depois da rolagem e menu sempre acessível.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shellClass = scrolled
    ? "bg-background/80 backdrop-blur-2xl border-b border-ink/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
    : "bg-background/0 border-b border-transparent";

  const rowHeight = scrolled ? "h-16 md:h-20" : "h-20 md:h-24";

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${shellClass}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div
          className={`flex items-center justify-between gap-4 transition-[height] duration-300 ease-out motion-reduce:transition-none ${rowHeight}`}
        >
          <div className="flex items-center gap-12 lg:gap-16 shrink-0 min-w-0">
            <Link
              to="/"
              className="flex items-center group animate-logo-in motion-reduce:animate-none shrink-0"
            >
              <Logo size="sm" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1 min-w-0">
              {navItems.map((item) =>
                item.route ? (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="px-4 py-2 text-[13px] font-bold text-ink/60 hover:text-ink uppercase tracking-wider transition-all hover:bg-ink/5 rounded-lg"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-4 py-2 text-[13px] font-bold text-ink/60 hover:text-ink uppercase tracking-wider transition-all hover:bg-ink/5 rounded-lg"
                  >
                    {item.label}
                  </a>
                ),
              )}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <a
              href="/auth"
              className="text-[13px] font-bold text-ink/60 hover:text-ink uppercase tracking-wider transition-colors"
            >
              Entrar
            </a>
            <LeadFormDialog
              trigger={
                <Button
                  className="rounded-xl bg-ink text-background hover:bg-ink/90 font-bold px-6 h-11 text-sm shadow-brutal transition-all uppercase tracking-widest border-2 border-ink"
                >
                  Começar agora
                </Button>
              }
            />
          </div>

          <button
            className="lg:hidden p-2 text-foreground shrink-0"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden pb-4 flex flex-col gap-1 border-t border-border/60 pt-3 bg-background">
            {navItems.map((item) =>
              item.route ? (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </a>
              ),
            )}
            <a
              href="/auth"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
            >
              Entrar
            </a>
            <LeadFormDialog
              trigger={
                <Button
                  className="mt-2 rounded-lg bg-ink text-background hover:bg-ink/90 font-bold border-2 border-ink shadow-brutal uppercase tracking-wider"
                  onClick={() => setOpen(false)}
                >
                  Começar grátis
                </Button>
              }
            />
          </div>
        )}
      </div>
    </header>
  );
}
