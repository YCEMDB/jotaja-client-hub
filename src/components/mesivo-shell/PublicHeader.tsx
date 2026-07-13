import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { MesivoMark } from "@/components/mesivo-graphics/MesivoMark";

type NavItem = { label: string; to: string };

/**
 * Links validados contra o inventário de rotas existente.
 * Só entram itens que apontam para rotas reais e públicas.
 */
const navItems: NavItem[] = [
  { label: "Empresa", to: "/empresa" },
  { label: "Sobre", to: "/sobre" },
  { label: "Blog", to: "/blog" },
  { label: "Contato", to: "/contato" },
];

/**
 * PublicHeader — cabeçalho do PublicShell (contexto marketing).
 *
 * - Primeiro render determinístico (scrolled=false).
 * - Listener passivo + cleanup.
 * - Menu mobile via <Sheet> shadcn (reaproveita focus trap, Esc,
 *   scroll lock, restauração de foco).
 * - Sem blur pesado; fundo translúcido apenas após scroll.
 */
export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 w-full transition-colors"
      style={{
        backgroundColor: scrolled
          ? "color-mix(in oklab, var(--mesivo-cream) 88%, transparent)"
          : "transparent",
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
            style={{ color: "var(--mesivo-coffee)", fontFamily: "var(--font-display)" }}
          >
            Mesivo
          </span>
        </Link>

        {/* Nav desktop */}
        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--mesivo-peach)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mesivo-tomato)]"
                  style={{ color: "var(--mesivo-coffee)", fontFamily: "var(--font-ui)" }}
                  activeProps={{ style: { color: "var(--mesivo-tomato)", fontFamily: "var(--font-ui)" } }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
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
        </div>

        {/* Menu mobile via Sheet (shadcn) */}
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
                  {navItems.map((item) => (
                    <li key={item.to}>
                      <SheetClose asChild>
                        <Link
                          to={item.to}
                          className="block rounded-lg px-3 py-3 text-base font-medium"
                          style={{
                            color: "var(--mesivo-coffee)",
                            fontFamily: "var(--font-ui)",
                          }}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <SheetClose asChild>
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
