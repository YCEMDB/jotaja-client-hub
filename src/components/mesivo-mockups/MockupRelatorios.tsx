import { DEMO_REPORT_ROWS } from "./demo-data";

/** MockupRelatorios — KPIs demonstrativos. Estático. */
export function MockupRelatorios({ className }: { className?: string }) {
  return (
    <section
      className={className}
      role="img"
      aria-label="Mockup de relatórios Mesivo (dados demonstrativos)"
      style={{
        padding: 20,
        borderRadius: 20,
        border: "1.5px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <h4 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--fg-hi)" }}>
        Relatórios (demo)
      </h4>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        }}
      >
        {DEMO_REPORT_ROWS.map((r) => (
          <div
            key={r.label}
            style={{
              padding: 12,
              borderRadius: 14,
              backgroundColor: "var(--mesivo-cream)",
              border: "1px solid var(--hairline)",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--fg-mid)" }}>{r.label}</div>
            <div
              style={{
                marginTop: 4,
                fontFamily: "var(--font-display)",
                color: "var(--fg-hi)",
                fontSize: 24,
              }}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--fg-low)", fontStyle: "italic" }}>
        Dados demonstrativos, sem representar performance real de clientes.
      </p>
    </section>
  );
}
