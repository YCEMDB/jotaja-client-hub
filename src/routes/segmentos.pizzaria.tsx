import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/segmentos/pizzaria";
const TITLE = "Sistema de pedidos para pizzaria: cardápio digital + delivery";
const DESC =
  "ComandaHub para pizzaria: cardápio digital com sabores divididos, broto/grande, borda recheada, PIX e gestão de entregadores. Sem comissão.";

export const Route = createFileRoute("/segmentos/pizzaria")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: PizzariaPage,
});

function PizzariaPage() {
  return (
    <ContentLayout>
      <h1>Sistema de pedidos para pizzaria</h1>
      <p className="lead">
        Pizzaria tem regras únicas: tamanho, sabores divididos, borda, adicionais
        por andar. O ComandaHub foi pensado para resolver isso sem gambiarra e
        sem comissão por pedido.
      </p>

      <h2>Funcionalidades pensadas para pizzaria</h2>
      <ul>
        <li>
          <strong>Tamanhos:</strong> broto, média, grande, família — cada um com
          preço base independente.
        </li>
        <li>
          <strong>Sabores divididos:</strong> cliente escolhe 2, 3 ou 4 sabores
          e o sistema calcula o preço pelo mais caro ou pela média.
        </li>
        <li>
          <strong>Bordas:</strong> recheada, tradicional, sem borda — com preço
          adicional automático.
        </li>
        <li>
          <strong>Adicionais por sabor:</strong> bacon extra só em um andar, por
          exemplo.
        </li>
        <li>
          <strong>Combos:</strong> pizza + refrigerante + sobremesa.
        </li>
      </ul>

      <h2>Cardápio digital com QR Code na mesa</h2>
      <p>
        Cliente escaneia, escolhe os sabores e o pedido vai direto pra cozinha.
        Sem garçom traduzindo, sem pizza errada chegando.{" "}
        <Link to="/blog/como-criar-cardapio-digital-qr-code">
          Veja como gerar o QR Code
        </Link>
        .
      </p>

      <h2>Delivery próprio sem iFood</h2>
      <p>
        Comissão de 27% destrói margem de pizzaria. Com o ComandaHub você
        recebe o pedido direto, paga PIX na hora e despacha pelo seu
        entregador. Veja por que somos uma{" "}
        <Link to="/alternativa-ifood">alternativa ao iFood</Link>.
      </p>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/cardapio-digital">Guia completo de cardápio digital</Link>
        </li>
        <li>
          <Link to="/segmentos/hamburgueria">
            Sistema de pedidos para hamburgueria
          </Link>
        </li>
        <li>
          <Link to="/blog/sistema-de-pedidos-para-restaurante">
            Como escolher sistema de pedidos
          </Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Comece grátis</Link> e configure seu cardápio de
        pizzaria em minutos.
      </p>
    </ContentLayout>
  );
}
