import { Link } from "@tanstack/react-router";
import { Phone, Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/comanda-logo.png";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para quem é", href: "#segmentos" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/60">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-18 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logo} alt="Comanda" className="h-10 w-10 group-hover:rotate-6 transition-bounce" width={40} height={40} />
            <span className="font-display font-extrabold text-2xl tracking-tight text-foreground">
              Comanda<span className="text-accent">.</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-full font-semibold text-sm text-foreground/80 hover:text-foreground hover:bg-accent-soft transition-smooth"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="tel:2120422913" className="flex items-center gap-2 text-sm font-semibold text-foreground/70 hover:text-foreground transition-smooth">
              <Phone className="w-4 h-4" />
              <span>(21) 2042-2913</span>
            </a>
            <a href="/auth" className="px-3 py-2 rounded-full text-sm font-semibold text-foreground/80 hover:text-foreground hover:bg-accent-soft transition-smooth">
              Entrar
            </a>
            <Button size="lg" className="rounded-full font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent-lg" asChild>
              <a href="#cadastro"><Sparkles className="w-4 h-4 mr-1.5" /> Testar grátis</a>
            </Button>
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden pb-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg hover:bg-muted font-medium"
              >
                {item.label}
              </a>
            ))}
            <Button asChild className="mt-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"><a href="/auth">Testar grátis 14 dias</a></Button>
          </div>
        )}
      </div>
    </header>
  );
}
