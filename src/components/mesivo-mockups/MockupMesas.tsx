import { DEMO_TABLES } from "./demo-data";

const COLOR: Record<string, { bg: string; fg: string; label: string }> = {
  livre:       { bg: "var(--mesivo-leaf-soft)", fg: "var(--mesivo-leaf)",   label: "Livre" },
  ocupada:     { bg: "var(--mesivo-peach)",     fg: "var(--mesivo-tomato)", label: "Ocupada" },
  aguardando:  { bg: "var(--warning-soft)",     fg: "#8A5A00",              label: "Aguardando" },
};

/** MockupMesas — grade de mesas com estado. Estático. */
export function MockupMesas({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Mockup do salão Mesivo (dados demonstrativos)"
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: "repeat(3, 1fr)",
        padding: 16,
        borderRadius: 20,
        border: "1.5px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {DEMO_TABLES.map((t) => {
        const c = COLOR[t.status];
        return (
          <div
            key={t.id}
            style={{
              borderRadius: 14,
              padding: 12,
              backgroundColor: c.bg,
              border: "1px solid var(--hairline)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontFamily: "var(--font-display)", color: "var(--fg-hi)", fontSize: 20 }}>
              Mesa {t.number}
            </div>
            <div style={{ color: c.fg, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              {c.label}
            </div>
            {t.ticket ? (
              <div style={{ fontSize: 12, color: "var(--fg)" }}>{t.ticket}</div>
            ) : null}
          </div>
        );
      })}
      <p
        style={{
          gridColumn: "1 / -1",
          margin: 0,
          fontSize: 11,
          color: "var(--fg-low)",
          fontStyle: "italic",
        }}
      >
        Dados demonstrativos.
      </p>
    </div>
  );
}
