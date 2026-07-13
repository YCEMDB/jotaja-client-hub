import { Link } from "@tanstack/react-router";
import { MesivoMark } from "@/components/mesivo-graphics/MesivoMark";

type FooterLink = { label: string; to: string };
type FooterCol = { title: string; links: FooterLink[] };

/**
 * Todos os links validados contra o inventário de rotas existente.
 * Nada inventado (sem CNPJ, telefone, endereço, redes sociais, selos).
 */
const COLS: FooterCol[] = [
  {
    title: "Produto",
    links: [
      { label: "Cardápio digital",    to: "/cardapio-digital" },
      { label: "Controle de mesas",   to: "/controle-de-mesas" },
      { label: "Gestão do restaurante", to: "/gestao-de-restaurantes" },
      { label: "Alternativa ao iFood", to: "/alternativa-ifood" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre",   to: "/sobre" },
      { label: "Empresa", to: "/empresa" },
      { label: "Contato", to: "/contato" },
      { label: "Blog",    to: "/blog" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Perguntas frequentes", to: "/perguntas-frequentes" },
      { label: "Glossário",            to: "/glossario" },
      { label: "Termos",               to: "/termos" },
      { label: "Privacidade",          to: "/privacidade" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer
      style={{
        backgroundColor: "var(--mesivo-coffee)",
        color: "var(--mesivo-white)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px clamp(16px, 4vw, 32px)",
          display: "grid",
          gap: 32,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Link
            to="/"
            aria-label="Mesivo — início"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: "var(--mesivo-white)",
              textDecoration: "none",
            }}
          >
            <MesivoMark size={32} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem" }}>Mesivo</span>
          </Link>
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.75)",
              maxWidth: "36ch",
            }}
          >
            Plataforma brasileira para restaurantes centralizarem pedidos, mesas,
            cardápio digital, delivery, caixa e gestão em um único lugar.
          </p>
        </div>

        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "0.95rem",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "var(--mesivo-mango)",
              }}
            >
              {col.title}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}

            </ul>
          </nav>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.15)",
          padding: "18px clamp(16px, 4vw, 32px)",
          fontSize: 13,
          color: "rgba(255,255,255,0.65)",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>© {new Date().getFullYear()} Mesivo</span>
        <span>Feito no Brasil</span>
      </div>
    </footer>
  );
}
