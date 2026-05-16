import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./LeadFormDialog";
import logo from "@/assets/comandahub-logo.svg";

type NavItem = { label: string; href: string; route?: boolean };

const navItems: NavItem[] = [
  { label: "Cardápio Digital", href: "/cardapio-digital", route: true },
  { label: "Alternativa ao iFood", href: "/alternativa-ifood", route: true },
  { label: "Blog", href: "/blog", route: true },
  { label: "Planos", href: "/#planos" },
  { label: "FAQ", href: "/#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-24 md:h-28">
          <Link to="/" className="flex items-center group">
            <img
              src={logo}
              alt="ComandaHub"
              className="h-16 md:h-[4.75rem] w-auto animate-logo-in transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-rotate-1 motion-reduce:animate-none motion-reduce:transition-none"
              width={1500}
              height={360}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) =>
              item.route ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
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
            className="md:hidden p-2 text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-1 border-t border-border/60 pt-3">
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
