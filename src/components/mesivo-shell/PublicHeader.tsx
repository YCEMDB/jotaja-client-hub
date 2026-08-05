import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { MesivoMark } from "@/components/mesivo-graphics/MesivoMark";
import type { PublicShellVariant } from "./PublicShell";

type NavItem = { label: string; href: string; anchor?: boolean };

const defaultNav: NavItem[] = [
  { label: "Empresa", href: "/empresa" },
  { label: "Sobre", href: "/sobre" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

const landingNav: NavItem[] = [
  { label: "Produto", href: "#produto", anchor: true },
  { label: "Como funciona", href: "#como-funciona", anchor: true },
  { label: "Recursos", href: "#recursos", anchor: true },
  { label: "Planos", href: "#planos", anchor: true },
  { label: "FAQ", href: "#faq", anchor: true },
];

/**
 * PublicHeader — cabeçalho do PublicShell.
 * variant="landing" troca a nav por âncoras internas da home.
 * Agora com visual premium: floating glass navbar.
 */
export function PublicHeader({ variant = "default" }: { variant?: PublicShellVariant }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = variant === "landing" ? landingNav : defaultNav;

  const NavAnchor = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const className = mobile
      ? "block rounded-lg px-3 py-3 text-base font-medium"
      : "rounded-full px-4 py-1.5 text-sm font-semibold transition-all hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";
    const style = {
      color: "var(--foreground)",
      fontFamily: "var(--font-ui)",
    } as const;
    if (item.anchor) {
      return (
        <a href={item.href} className={className} style={style}>
          {item.label}
        </a>
      );
    }
    return (
      <Link
        to={item.href}
        className={className}
        style={style}
        activeProps={{ className: `${className} bg-black/5` }}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header
      className="fixed top-6 left-1/2 z-50 w-[95%] max-w-5xl -translate-x-1/2 transition-all duration-500 px-4 pointer-events-none"
    >
      <div 
        className="mx-auto flex h-14 items-center justify-between px-6 transition-all duration-500 pointer-events-auto"
        style={{
          backgroundColor: scrolled
            ? "rgba(255, 255, 255, 0.85)"
            : "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "999px",
          boxShadow: scrolled ? "var(--shadow-xl)" : "var(--shadow-lg)",
        }}
      >
        <Link
          to="/"
          aria-label="Mesivo — início"
          className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none"
        >
          <MesivoMark size={28} />
          <span
            className="text-lg font-extrabold tracking-tighter"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}
          >
            mesivo
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavAnchor item={item} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            {variant === "landing" ? (
              <a
                href="#cadastro"
                className="inline-flex h-9 items-center justify-center rounded-full px-5 text-sm font-bold transition-all bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-sm hover:shadow-glow"
              >
                Começar
              </a>
            ) : (
              <Link
                to="/contato"
                className="inline-flex h-9 items-center justify-center rounded-full px-5 text-sm font-bold transition-all bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-sm hover:shadow-glow"
              >
                Contato
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
                  style={{ color: "var(--foreground)" }}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] max-w-sm border-l border-black/5"
                style={{ backgroundColor: "var(--background)" }}
              >
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav aria-label="Navegação principal (mobile)" className="mt-6">
                  <ul className="flex flex-col gap-1">
                    {items.map((item) => (
                      <li key={item.href}>
                        <SheetClose asChild>
                          <NavAnchor item={item} mobile />
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <SheetClose asChild>
                      {variant === "landing" ? (
                        <a
                          href="#cadastro"
                          className="inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-bold bg-primary text-primary-foreground"
                        >
                          Começar grátis
                        </a>
                      ) : (
                        <Link
                          to="/contato"
                          className="inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-bold bg-primary text-primary-foreground"
                        >
                          Falar com a gente
                        </Link>
                      )}
                    </SheetClose>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
