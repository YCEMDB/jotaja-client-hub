type OperationalBadgeProps = {
  status: "novo" | "produzindo" | "pronto" | "entregue" | "cancelado";
  className?: string;
};

const MAP = {
  novo:       { label: "Novo",       bg: "var(--mesivo-peach)",    fg: "var(--mesivo-tomato)" },
  produzindo: { label: "Produzindo", bg: "var(--warning-soft)",    fg: "#8A5A00" },
  pronto:     { label: "Pronto",     bg: "var(--mesivo-leaf-soft)", fg: "var(--mesivo-leaf)" },
  entregue:   { label: "Entregue",   bg: "var(--info-soft)",       fg: "#0F4C81" },
  cancelado:  { label: "Cancelado",  bg: "var(--danger-soft)",     fg: "#8A1A1A" },
} as const;

/** OperationalBadge — pill de status operacional. Estático. */
export function OperationalBadge({ status, className }: OperationalBadgeProps) {
  const s = MAP[status];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        backgroundColor: s.bg,
        color: s.fg,
        fontFamily: "var(--font-ui)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
        textTransform: "uppercase",
      }}
    >
      {s.label}
    </span>
  );
}
