import type { ReactNode } from "react";

type ModuleCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

/** ModuleCard — cartão de módulo Mesivo (salão, cozinha, retirada...). Estático. */
export function ModuleCard({ title, description, icon, className }: ModuleCardProps) {
  return (
    <article
      className={className}
      style={{
        borderRadius: 16,
        border: "1.5px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        padding: 20,
        fontFamily: "var(--font-ui)",
        color: "var(--fg)",
      }}
    >
      {icon ? (
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--mesivo-peach)",
            color: "var(--mesivo-tomato)",
            marginBottom: 12,
          }}
        >
          {icon}
        </div>
      ) : null}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--fg-hi)",
          fontSize: "1.125rem",
          margin: 0,
        }}
      >
        {title}
      </h3>
      {description ? (
        <p style={{ color: "var(--fg-mid)", marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
          {description}
        </p>
      ) : null}
    </article>
  );
}
