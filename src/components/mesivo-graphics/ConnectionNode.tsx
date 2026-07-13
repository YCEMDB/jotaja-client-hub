type ConnectionNodeProps = {
  label: string;
  tone?: "orange" | "coffee" | "leaf" | "mango";
  className?: string;
};

const TONE = {
  orange: { bg: "var(--mesivo-tomato)", fg: "var(--mesivo-white)" },
  coffee: { bg: "var(--mesivo-coffee)", fg: "var(--mesivo-white)" },
  leaf: { bg: "var(--mesivo-leaf)", fg: "var(--mesivo-white)" },
  mango: { bg: "var(--mesivo-mango)", fg: "var(--mesivo-coffee)" },
} as const;

/** ConnectionNode — nó operacional (etapa do fluxo de pedidos). SVG puro. */
export function ConnectionNode({ label, tone = "orange", className }: ConnectionNodeProps) {
  const c = TONE[tone];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        backgroundColor: c.bg,
        color: c.fg,
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        fontSize: 13,
        border: "1px solid var(--hairline-strong)",
        boxShadow: "0 2px 0 var(--mesivo-coffee)",
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
        <circle cx="4" cy="4" r="3" fill="currentColor" opacity="0.6" />
      </svg>
      {label}
    </span>
  );
}
