import { DEMO_CASH } from "./demo-data";

/** MockupCaixa — estado do caixa. Estático, dados demonstrativos. */
export function MockupCaixa({ className }: { className?: string }) {
  return (
    <section
      className={className}
      role="img"
      aria-label="Mockup do caixa Mesivo (dados demonstrativos)"
      style={{
        padding: 20,
        borderRadius: 20,
        border: "1.5px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        fontFamily: "var(--font-ui)",
        color: "var(--fg)",
      }}
    >
      <header style={{ marginBottom: 12 }}>
        <h4 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--fg-hi)" }}>Caixa demo</h4>
        <p style={{ margin: "2px 0 0", color: "var(--fg-mid)", fontSize: 13 }}>Aberto com {DEMO_CASH.aberto}</p>
      </header>
      <dl style={{ margin: 0, display: "grid", gap: 8 }}>
        {DEMO_CASH.entradas.map((e) => (
          <div key={e.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <dt>{e.label}</dt>
            <dd style={{ margin: 0, fontWeight: 700, color: "var(--mesivo-leaf)" }}>+ {e.value}</dd>
          </div>
        ))}
        {DEMO_CASH.saidas.map((s) => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <dt>{s.label}</dt>
            <dd style={{ margin: 0, fontWeight: 700, color: "var(--mesivo-tomato)" }}>− {s.value}</dd>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            paddingTop: 10,
            borderTop: "1px solid var(--hairline)",
          }}
        >
          <dt style={{ fontWeight: 800, color: "var(--fg-hi)" }}>Saldo</dt>
          <dd style={{ margin: 0, fontWeight: 800, color: "var(--fg-hi)" }}>{DEMO_CASH.saldo}</dd>
        </div>
      </dl>
      <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--fg-low)", fontStyle: "italic" }}>
        Dados demonstrativos.
      </p>
    </section>
  );
}
