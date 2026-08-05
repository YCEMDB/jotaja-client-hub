import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** PageHeader — cabeçalho institucional/de conteúdo. Usa H1. */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {eyebrow ? (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "var(--mesivo-tomato)",
          }}
        >
          {eyebrow}
        </span>
      ) : null}
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          color: "var(--fg-hi)",
          fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
        }}
      >
        {title}
      </h1>
      {description ? (
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-ui)",
            color: "var(--fg-mid)",
            fontSize: "1.05rem",
            lineHeight: 1.55,
            maxWidth: "60ch",
          }}
        >
          {description}
        </p>
      ) : null}
      {actions ? <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{actions}</div> : null}
    </header>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

/** SectionHeader — cabeçalho de seção (h2). */
export function SectionHeader({ eyebrow, title, description, className }: SectionHeaderProps) {
  return (
    <header
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}
    >
      {eyebrow ? (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "var(--mesivo-tomato)",
          }}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          color: "var(--fg-hi)",
          fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {description ? (
        <p style={{ margin: 0, color: "var(--fg-mid)", fontFamily: "var(--font-ui)" }}>
          {description}
        </p>
      ) : null}
    </header>
  );
}
