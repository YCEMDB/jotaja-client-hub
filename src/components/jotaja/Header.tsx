import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center text-white font-bold text-sm shadow-blue">
              C
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Comanda
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
              >
                {item.label}
              </a>
            ))}
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
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/auth"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
            >
              Entrar
            </a>
            <Button
              asChild
              className="mt-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              <a href="#cadastro" onClick={() => setOpen(false)}>
                Começar grátis
              </a>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
