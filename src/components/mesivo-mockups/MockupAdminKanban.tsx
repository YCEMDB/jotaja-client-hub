import { DEMO_ORDERS } from "./demo-data";
import { OperationalBadge } from "@/components/mesivo-graphics/OperationalBadge";

const COLS: { key: DEMO_ORDERS_KEY; label: string }[] = [
  { key: "novo", label: "Novos" },
  { key: "produzindo", label: "Produzindo" },
  { key: "pronto", label: "Prontos" },
  { key: "entregue", label: "Entregues" },
];
type DEMO_ORDERS_KEY = "novo" | "produzindo" | "pronto" | "entregue";

/** MockupAdminKanban — visualização estática (dados demonstrativos). */
export function MockupAdminKanban({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Mockup do painel de pedidos Mesivo (dados demonstrativos)"
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        padding: 16,
        borderRadius: 20,
        border: "1.5px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {COLS.map((col) => (
        <div key={col.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong style={{ color: "var(--fg-hi)", fontSize: 13 }}>{col.label}</strong>
            <OperationalBadge status={col.key} />
          </div>
          {DEMO_ORDERS.filter((o) => o.status === col.key).map((o) => (
            <div
              key={o.id}
              style={{
                padding: 10,
                borderRadius: 12,
                backgroundColor: "var(--mesivo-warm-white)",
                border: "1px solid var(--hairline)",
                fontSize: 12,
                color: "var(--fg)",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--fg-hi)" }}>{o.code}</div>
              <div style={{ color: "var(--fg-mid)" }}>{o.customer}</div>
              <div style={{ marginTop: 4 }}>{o.items}</div>
              <div style={{ marginTop: 4, fontWeight: 700 }}>{o.total}</div>
            </div>
          ))}
        </div>
      ))}
      <p
        style={{
          gridColumn: "1 / -1",
          margin: 0,
          fontSize: 11,
          color: "var(--fg-low)",
          fontStyle: "italic",
        }}
      >
        Dados demonstrativos — nenhum pedido real.
      </p>
    </div>
  );
}
