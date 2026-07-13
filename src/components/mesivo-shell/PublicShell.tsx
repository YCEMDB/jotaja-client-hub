import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

type PublicShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  showHeader?: boolean;
  showFooter?: boolean;
};

/**
 * PublicShell — casca das páginas públicas Mesivo (contexto marketing).
 *
 * Estrutura semântica:
 *   - <a class="mesivo-skip-link" href="#main-content">
 *   - <PublicHeader />
 *   - <main id="main-content">
 *   - <PublicFooter />
 *
 * IMPORTANTE ao migrar rotas piloto:
 * - Remover qualquer <Header/> ou <Footer/> antigos.
 * - NÃO usar <main> dentro do conteúdo — o PublicShell já provê.
 * - Só um <h1> por página, dentro de children.
 */
export function PublicShell({
  children,
  className,
  mainClassName,
  showHeader = true,
  showFooter = true,
}: PublicShellProps) {
  return (
    <div
      data-theme="marketing"
      className={className}
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--surface)",
        color: "var(--fg)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <a href="#main-content" className="mesivo-skip-link">
        Pular para o conteúdo
      </a>
      {showHeader ? <PublicHeader /> : null}
      <main
        id="main-content"
        tabIndex={-1}
        className={mainClassName}
        style={{ flex: 1, outline: "none" }}
      >
        {children}
      </main>
      {showFooter ? <PublicFooter /> : null}
    </div>
  );
}
