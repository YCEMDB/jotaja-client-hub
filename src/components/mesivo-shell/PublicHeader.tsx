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
 */
export function PublicHeader({ variant = "default" }: { variant?: PublicShellVariant }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = variant === "landing" ? landingNav : defaultNav;

  const NavAnchor = ({ item, mobile = false }: { item: NavItem; mobile?: boolean }) => {
    const className = mobile
      ? "block rounded-lg px-3 py-3 text-base font-medium"
      : "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--mesivo-peach)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mesivo-tomato)]";
    const style = {
      color: "var(--mesivo-coffee)",
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
        activeProps={{ style: { ...style, color: "var(--mesivo-tomato)" } }}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header
      className="sticky top-0 z-40 w-full transition-colors"
      style={{
        backgroundColor: scrolled
          ? "color-mix(in oklab, var(--mesivo-cream) 92%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "saturate(1.1) blur(6px)" : undefined,
        borderBottom: scrolled ? "1px solid var(--hairline)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          aria-label="Mesivo — início"
          className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mesivo-tomato)] focus-visible:ring-offset-2"
        >
          <MesivoMark size={32} />
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--mesivo-coffee)", fontFamily: "var(--font-ui)" }}
          >
            Mesivo
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

        <div className="hidden md:block">
          {variant === "landing" ? (
            <a
              href="#cadastro"
              className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mesivo-mango)] focus-visible:ring-offset-2"
              style={{
                backgroundColor: "var(--mesivo-tomato)",
                color: "var(--mesivo-white)",
                fontFamily: "var(--font-ui)",
              }}
            >
              Começar grátis
            </a>
          ) : (
            <Link
              to="/contato"
              className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mesivo-mango)] focus-visible:ring-offset-2"
              style={{
                backgroundColor: "var(--mesivo-tomato)",
                color: "var(--mesivo-white)",
                fontFamily: "var(--font-ui)",
              }}
            >
              Falar com a gente
            </Link>
          )}
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mesivo-tomato)]"
                style={{ color: "var(--mesivo-coffee)" }}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] max-w-sm"
              style={{ backgroundColor: "var(--mesivo-cream)" }}
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
                        className="inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold"
                        style={{
                          backgroundColor: "var(--mesivo-tomato)",
                          color: "var(--mesivo-white)",
                          fontFamily: "var(--font-ui)",
                        }}
                      >
                        Começar grátis
                      </a>
                    ) : (
                      <Link
                        to="/contato"
                        className="inline-flex h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold"
                        style={{
                          backgroundColor: "var(--mesivo-tomato)",
                          color: "var(--mesivo-white)",
                          fontFamily: "var(--font-ui)",
                        }}
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
    </header>
  );
}
