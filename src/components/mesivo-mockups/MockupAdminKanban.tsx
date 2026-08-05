import { DEMO_ORDERS } from "./demo-data";
import { OperationalBadge } from "@/components/mesivo-graphics/OperationalBadge";

const COLS: { key: string; label: string; color: string }[] = [
  { key: "novo", label: "Novos", color: "#ffb000" },
  { key: "produzindo", label: "Em preparo", color: "#ff6b35" },
  { key: "pronto", label: "Prontos", color: "#e84393" },
  { key: "entregue", label: "Entregues", color: "#00c853" },
];

/** 
 * MockupAdminKanban — visualização fiel ao sistema real (MESIVO).
 * Baseado no layout de admin.pedidos.tsx.
 */
export function MockupAdminKanban({ className }: { className?: string }) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Mockup do painel de pedidos Mesivo (estilo real)"
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        padding: "16px 12px",
        backgroundColor: "#f8f9fa",
        fontFamily: "var(--font-ui)",
        minHeight: 380,
      }}
    >
      {COLS.map((col) => (
        <div key={col.key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              padding: "4px 8px",
              borderBottom: `2px solid ${col.color}`,
              marginBottom: 4
            }}
          >
            <strong style={{ color: "#1a1a1a", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {col.label}
            </strong>
            <div style={{ 
              fontSize: 10, 
              backgroundColor: col.color, 
              color: "#fff", 
              padding: "1px 6px", 
              borderRadius: 4,
              fontWeight: 700
            }}>
              {DEMO_ORDERS.filter((o) => o.status === col.key).length}
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_ORDERS.filter((o) => o.status === col.key).map((o) => (
              <div
                key={o.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                  border: "2px solid #1a1a1a",
                  boxShadow: "3px 3px 0px 0px #1a1a1a",
                  fontSize: 12,
                  color: "#1a1a1a",
                  position: "relative",
                  transition: "transform 0.1s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ 
                    fontWeight: 900, 
                    fontSize: 14, 
                    fontFamily: "var(--font-display)",
                    color: "#1a1a1a" 
                  }}>
                    {o.code}
                  </span>
                  <span style={{ 
                    fontSize: 9, 
                    fontWeight: 800, 
                    textTransform: "uppercase",
                    backgroundColor: "#f0f0f0",
                    padding: "1px 4px",
                    borderRadius: 3
                  }}>
                    {o.customer.includes("Mesa") ? "Presencial" : "Delivery"}
                  </span>
                </div>
                
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{o.customer}</div>
                <div style={{ color: "#666", fontSize: 11, lineHeight: 1.2, marginBottom: 6 }}>{o.items}</div>
                
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  paddingTop: 6,
                  borderTop: "1px dashed #eee"
                }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{o.total}</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: col.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}