import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

export type PublicShellVariant = "default" | "landing";

type PublicShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  variant?: PublicShellVariant;
};

/**
 * PublicShell — casca das páginas públicas Mesivo (contexto marketing).
 *
 * variant="landing" ativa o cabeçalho de âncoras da landing principal e
 * carrega o display Bricolage Grotesque + acento Instrument Serif escopados
 * a `[data-theme="marketing"][data-variant="landing"]` — não afeta as demais
 * páginas marketing (empresa, sobre, contato, blog).
 */
export function PublicShell({
  children,
  className,
  mainClassName,
  showHeader = true,
  showFooter = true,
  variant = "default",
}: PublicShellProps) {
  return (
    <div
      data-theme="marketing"
      data-variant={variant}
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
      {showHeader ? <PublicHeader variant={variant} /> : null}
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
