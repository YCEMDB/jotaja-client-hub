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
      { label: "Cardápio digital", to: "/cardapio-digital" },
      { label: "Controle de mesas", to: "/controle-de-mesas" },
      { label: "Gestão do restaurante", to: "/gestao-de-restaurantes" },
      { label: "Alternativa ao iFood", to: "/alternativa-ifood" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", to: "/sobre" },
      { label: "Empresa", to: "/empresa" },
      { label: "Contato", to: "/contato" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "Perguntas frequentes", to: "/perguntas-frequentes" },
      { label: "Glossário", to: "/glossario" },
      { label: "Termos", to: "/termos" },
      { label: "Privacidade", to: "/privacidade" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer
      className="bg-white border-t border-black/5"
      style={{
        fontFamily: "var(--font-ui)",
      }}
    >
      <div
        className="mx-auto grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr] py-20 px-6 max-w-6xl"
      >
        <div className="flex flex-col gap-6">
          <Link
            to="/"
            aria-label="Mesivo — início"
            className="inline-flex items-center gap-2 group"
          >
            <MesivoMark size={32} />
            <span 
              className="text-2xl font-extrabold tracking-tighter"
              style={{ fontFamily: "var(--font-display)" }}
            >
              mesivo
            </span>
          </Link>
          <p
            className="text-base text-muted-foreground leading-relaxed max-w-sm"
          >
            O sistema operacional para restaurantes que buscam sincronia total entre mesas, cozinha e caixa.
          </p>
          <div className="flex gap-4">
             {/* Social placeholders could go here if validated */}
          </div>
        </div>

        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="flex flex-col gap-6">
            <h3
              className="text-xs font-bold uppercase tracking-widest text-foreground"
            >
              {col.title}
            </h3>
            <ul className="flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
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
        className="max-w-6xl mx-auto border-t border-black/5 py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-muted-foreground"
      >
        <div className="flex items-center gap-6">
          <span>© {new Date().getFullYear()} Mesivo</span>
          <span>Feito no Brasil</span>
        </div>
        <div className="flex items-center gap-6">
           <Link to="/termos" className="hover:text-foreground">Termos</Link>
           <Link to="/privacidade" className="hover:text-foreground">Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
