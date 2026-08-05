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
        width: "100%",
        height: "100%",
        backgroundColor: "var(--mesivo-warm-white)",
        padding: 16,
        fontFamily: "var(--font-ui)",
        boxShadow: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifySelf: 'center', gap: 6, marginBottom: 16 }}>
        <MesivoMark size={18} decorative />
        <div style={{ fontWeight: 900, color: "var(--fg-hi)", fontFamily: "var(--font-display)", fontSize: 14, letterSpacing: '-0.02em' }}>
          MESIVO
        </div>
      </div>
      
      {/* Search bar simulada */}
      <div style={{ background: 'var(--mesivo-cream)', borderRadius: 12, padding: '8px 12px', marginBottom: 20, fontSize: 12, color: 'var(--fg-mid)', border: '1px solid var(--hairline)' }}>
        Buscar no cardápio...
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-orange)', marginBottom: -4 }}>
          Mais Pedidos
        </div>
        {DEMO_MENU.map((m) => (
          <article
            key={m.id}
            style={{
              padding: '12px 0',
              borderBottom: "1px solid var(--hairline)",
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--fg-hi)", fontSize: 13, marginBottom: 2 }}>{m.name}</div>
              <div style={{ color: "var(--fg-mid)", fontSize: 11, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.description}</div>
              <div style={{ marginTop: 6, color: "var(--brand-orange)", fontWeight: 800, fontSize: 13 }}>
                {m.price}
              </div>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: 'var(--mesivo-cream)', border: '1px solid var(--hairline)', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 20 }}>
              🍔
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
