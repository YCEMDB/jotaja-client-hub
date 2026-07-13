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
    ? "bg-background/85 backdrop-blur-xl border-b border-border/60 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
    : "bg-background/40 backdrop-blur-md border-b border-transparent";

  const rowHeight = scrolled ? "h-16 md:h-20" : "h-20 md:h-24";

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${shellClass}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div
          className={`flex items-center justify-between gap-4 transition-[height] duration-300 ease-out motion-reduce:transition-none ${rowHeight}`}
        >
          <Link
            to="/"
            className="flex items-center group animate-logo-in motion-reduce:animate-none shrink-0 min-w-0"
          >
            <Logo size="sm" className="md:[&_.logo-mark-3d]:h-10 lg:[&_.logo-mark-3d]:h-11" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 min-w-0">
            {navItems.map((item) =>
              item.route ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth whitespace-nowrap"
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <a
              href="/auth"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
            >
              Entrar
            </a>
            <Button
              size="sm"
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-blue"
              asChild
            >
              <a href="#cadastro">Começar grátis</a>
            </Button>
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
