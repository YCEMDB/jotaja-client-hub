import { MesivoMark } from "@/components/mesivo-graphics/MesivoMark";
import { Search, ShoppingBag, ImageIcon } from "lucide-react";

/** 
 * MockupPhoneCardapio — Replica visual fiel do cardápio digital real ($slug.tsx).
 * Estático para o mockup da home.
 */
export function MockupPhoneCardapio({ className }: { className?: string }) {
  const primaryColor = "oklch(0.7 0.16 38)"; // brand-orange approximate
  const accentColor = "oklch(0.62 0.24 0)"; // brand-magenta approximate

  return (
    <div
      className={className}
      role="img"
      aria-label="Mockup do cardápio digital Mesivo em um telefone"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FDFCFB", // Background real da loja
        fontFamily: "var(--font-ui)",
        overflow: "hidden",
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header — Brutalist Hero (Mini) */}
      <div style={{ 
        backgroundColor: "#1A1A1A", 
        color: "white", 
        padding: "16px 12px", 
        borderBottom: `4px solid ${primaryColor}`,
        position: 'relative'
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 12, 
            backgroundColor: primaryColor, 
            border: "2px solid white",
            display: "grid",
            placeItems: "center",
            boxShadow: `3px 3px 0 0 ${accentColor}`
          }}>
            <MesivoMark size={24} decorative />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
              MESIVO BURGER<span style={{ color: primaryColor }}>.</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <span style={{ 
                fontSize: 8, 
                backgroundColor: primaryColor, 
                color: 'black', 
                padding: '1px 4px', 
                borderRadius: 4, 
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                Aberto
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Nav (Sticky simulation) */}
      <div style={{ 
        borderBottom: "2px solid #1A1A1A", 
        padding: "8px 12px", 
        display: "flex", 
        gap: 6,
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        {["Burgers", "Pizzas", "Bebidas"].map((cat, i) => (
          <div key={cat} style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: '4px 8px',
            border: '1px solid #1A1A1A',
            borderRadius: 6,
            backgroundColor: i === 0 ? '#1A1A1A' : 'white',
            color: i === 0 ? 'white' : '#1A1A1A',
          }}>
            {cat}
          </div>
        ))}
      </div>

      {/* Menu Content */}
      <div style={{ flex: 1, padding: "16px 12px", overflow: 'hidden' }}>
        <h2 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 16, 
          marginBottom: 12, 
          display: 'flex', 
          alignItems: 'baseline',
          gap: 2
        }}>
          Mais Pedidos
          <span style={{ width: 6, height: 6, backgroundColor: accentColor }} />
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: "Burger Mesivo", desc: "Blend 180g, cheddar, bacon caramelizado.", price: "38,00" },
            { name: "Pizza Artesanal", desc: "Fermentação natural, molho italiano.", price: "62,00" }
          ].map((item) => (
            <div key={item.name} style={{
              padding: 10,
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 12,
              display: 'flex',
              gap: 10,
              backgroundColor: 'white',
              boxShadow: '2px 2px 0 0 rgba(0,0,0,0.05)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1A1A' }}>{item.name}</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 2, lineHeight: 1.2 }}>{item.desc}</div>
                <div style={{ fontWeight: 900, color: '#1A1A1A', marginTop: 6, fontSize: 12 }}>R$ {item.price}</div>
              </div>
              <div style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 8, 
                backgroundColor: '#F5F5F5', 
                border: '1px solid rgba(0,0,0,0.1)',
                display: 'grid',
                placeItems: 'center'
              }}>
                <ImageIcon size={16} color="rgba(0,0,0,0.2)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button Simulation */}
      <div style={{ padding: 12 }}>
        <div style={{
          backgroundColor: primaryColor,
          color: 'black',
          padding: '10px',
          borderRadius: 12,
          border: '2px solid #1A1A1A',
          boxShadow: '4px 4px 0 0 #1A1A1A',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase'
        }}>
          <ShoppingBag size={14} />
          Ver Sacola (2)
        </div>
      </div>
    </div>
  );
}
