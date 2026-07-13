import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center group">
              <Logo size="md" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              A plataforma completa para o seu restaurante centralizar pedidos, salão, cardápio, caixa e gestão em um único lugar.
            </p>
          </div>

          {[
            {
              title: "Soluções",
              links: [
                { label: "Restaurantes", href: "/sistema-para-restaurantes" },
                { label: "Pizzarias", href: "/sistema-para-pizzarias" },
                { label: "Hamburguerias", href: "/sistema-para-hamburguerias" },
                { label: "Lanchonetes", href: "/sistema-para-lanchonetes" },
                { label: "Bares", href: "/sistema-para-bares" },
                { label: "Açaiterias", href: "/sistema-para-acaiterias" },
                { label: "Delivery", href: "/sistema-para-delivery" },
                { label: "Comandas digitais", href: "/sistema-de-comandas-digitais" },
                { label: "Controle de mesas", href: "/controle-de-mesas" },
                { label: "Gestão de restaurantes", href: "/gestao-de-restaurantes" },
              ],
            },
            {
              title: "Comparativos",
              links: [
                { label: "vs iFood", href: "/alternativa-ifood" },
                { label: "vs Goomer", href: "/comparativo/comandahub-vs-goomer" },
                { label: "vs Anota AI", href: "/comparativo/comandahub-vs-anota-ai" },
                { label: "vs Saipos", href: "/comparativo/comandahub-vs-saipos" },
                { label: "vs Planilha", href: "/comparativo/comandahub-vs-planilha" },
                { label: "vs Caderno", href: "/comparativo/comandahub-vs-caderno" },
                { label: "vs Comanda de papel", href: "/comparativo/comandahub-vs-comanda-de-papel" },
                { label: "vs Controle manual", href: "/comparativo/comandahub-vs-controle-manual" },
              ],
            },
            {
              title: "Empresa",
              links: [
                { label: "Sobre a Mesivo", href: "/sobre-a-comandahub" },
                { label: "Perguntas frequentes", href: "/perguntas-frequentes" },
                { label: "Blog", href: "/blog" },
                { label: "Contato", href: "/contato" },
                { label: "Empresa", href: "/empresa" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Termos", href: "/termos" },
                { label: "Privacidade", href: "/privacidade" },
                { label: "SLA", href: "/sla" },
                { label: "Suporte", href: "/suporte" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mesivo. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Feito com cuidado para restaurantes brasileiros.
          </p>
        </div>
      </div>
    </footer>
  );
}
