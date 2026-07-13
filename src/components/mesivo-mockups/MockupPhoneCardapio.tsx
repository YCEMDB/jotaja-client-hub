import { DEMO_MENU } from "./demo-data";
import { MesivoMark } from "@/components/mesivo-graphics/MesivoMark";

/** MockupPhoneCardapio — cardápio digital dentro de um telefone. Estático. */
export function MockupPhoneCardapio({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Mockup do cardápio digital Mesivo em um telefone (dados demonstrativos)"
      style={{
        width: 260,
        borderRadius: 32,
        border: "6px solid var(--mesivo-coffee)",
        backgroundColor: "var(--mesivo-warm-white)",
        padding: 16,
        fontFamily: "var(--font-ui)",
        boxShadow: "0 20px 40px -20px rgba(52,36,29,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <MesivoMark size={22} decorative />
        <div style={{ fontWeight: 800, color: "var(--fg-hi)", fontFamily: "var(--font-display)" }}>
          Restaurante Demo
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DEMO_MENU.map((m) => (
          <article
            key={m.id}
            style={{
              padding: 10,
              borderRadius: 14,
              backgroundColor: "var(--mesivo-cream)",
              border: "1px solid var(--hairline)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--fg-hi)", fontSize: 13 }}>{m.name}</div>
            <div style={{ color: "var(--fg-mid)", fontSize: 12 }}>{m.description}</div>
            <div style={{ marginTop: 4, color: "var(--mesivo-tomato)", fontWeight: 800 }}>{m.price}</div>
          </article>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 10, color: "var(--fg-low)", fontStyle: "italic" }}>
        Dados demonstrativos.
      </p>
    </div>
  );
}
