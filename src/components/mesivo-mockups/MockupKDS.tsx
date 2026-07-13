import { DEMO_KDS } from "./demo-data";

/** MockupKDS — cozinha (tickets em produção). Estático. */
export function MockupKDS({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Mockup da tela de cozinha Mesivo (dados demonstrativos)"
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        padding: 16,
        borderRadius: 20,
        border: "1.5px solid var(--hairline)",
        backgroundColor: "var(--mesivo-coffee)",
        color: "var(--mesivo-white)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {DEMO_KDS.map((k) => (
        <article
          key={k.id}
          style={{
            padding: 12,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{k.ticket}</strong>
            <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8, fontSize: 13 }}>
              {k.time}
            </span>
          </div>
          <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", fontSize: 13 }}>
            {k.items.map((it, i) => (
              <li
                key={i}
                style={{
                  padding: "3px 0",
                  borderTop: i ? "1px solid rgba(255,255,255,0.14)" : "none",
                }}
              >
                {it}
              </li>
            ))}
          </ul>
        </article>
      ))}
      <p
        style={{
          gridColumn: "1 / -1",
          margin: 0,
          fontSize: 11,
          opacity: 0.7,
          fontStyle: "italic",
        }}
      >
        Dados demonstrativos.
      </p>
    </div>
  );
}
