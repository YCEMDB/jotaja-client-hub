import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/jotaja-logo.png";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Início", href: "#inicio" },
  { label: "Vantagens", href: "#vantagens" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Clientes", href: "#clientes" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="hidden md:block border-b border-border/50">
        <div className="container mx-auto px-6 py-2 flex justify-end gap-8 text-sm">
          <a href="tel:2120422913" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
            <span className="bg-primary/10 text-primary p-1.5 rounded-full"><Phone className="w-3.5 h-3.5" /></span>
            <span>Telefone: <strong className="text-foreground">21 2042.2913</strong></span>
          </a>
          <a href="https://wa.me/5521964757948" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth">
            <span className="bg-primary/10 text-primary p-1.5 rounded-full"><MessageCircle className="w-3.5 h-3.5" /></span>
            <span>Whatsapp: <strong className="text-foreground">21 9 6475.7948</strong></span>
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Jotajá" className="h-9 w-9" width={36} height={36} />
            <span className="font-display font-black text-2xl tracking-tight text-foreground">
              JOTA<span className="text-primary">JÁ</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2 py-1.5 shadow-soft">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-5 py-2 rounded-full font-semibold text-sm hover:bg-white/15 transition-smooth"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button variant="default" size="lg" className="rounded-full font-semibold shadow-elegant" asChild>
              <a href="#contato">Receber ligação →</a>
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
            <Button asChild className="mt-2 rounded-full"><a href="#contato">Receber ligação</a></Button>
          </div>
        )}
      </div>
    </header>
  );
}
