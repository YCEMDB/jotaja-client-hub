import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/segmentos/hamburgueria";
const TITLE = "Cardápio digital para hamburgueria: combos, ponto e adicionais";
const DESC =
  "Comandex para hamburgueria: combos, ponto da carne, adicionais ilimitados, PIX, delivery próprio e cardápio com fotos que vendem. Sem comissão.";

export const Route = createFileRoute("/segmentos/hamburgueria")({
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
  component: HamburgueriaPage,
});

function HamburgueriaPage() {
  return (
    <ContentLayout>
      <h1>Cardápio digital para hamburgueria</h1>
      <p className="lead">
        Hamburgueria vive de combo, adicional e detalhe (ponto, queijo, bacon).
        Um cardápio digital bom aumenta o ticket médio em 20–30% só com sugestão
        no fluxo. O Comandex entrega isso sem cobrar comissão.
      </p>

      <h2>Funcionalidades pensadas para hamburgueria</h2>
      <ul>
        <li>
          <strong>Combos inteligentes:</strong> burger + acompanhamento + bebida
          com preço de combo.
        </li>
        <li>
          <strong>Ponto da carne:</strong> mal, ao ponto, bem passado — campo
          obrigatório.
        </li>
        <li>
          <strong>Adicionais ilimitados:</strong> bacon extra, queijo extra,
          molhos, sem cebola.
        </li>
        <li>
          <strong>Upsell automático:</strong> "Quer batata com cheddar e bacon
          por mais R$ X?".
        </li>
        <li>
          <strong>Foto destacada:</strong> 70% dos clientes pedem pela imagem.
        </li>
      </ul>

      <h2>Cardápio digital com QR Code na mesa</h2>
      <p>
        Cliente escaneia, escolhe ponto, monta combo e o pedido vai direto pra
        chapa.{" "}
        <Link to="/blog/como-criar-cardapio-digital-qr-code">
          Como criar o QR Code
        </Link>
        .
      </p>

      <h2>Delivery próprio + WhatsApp</h2>
      <p>
        Use o link do Comandex na bio do Instagram e no WhatsApp Business.{" "}
        <Link to="/blog/como-fazer-cardapio-digital-whatsapp">
          Tutorial completo aqui
        </Link>
        .
      </p>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/cardapio-digital">Guia completo de cardápio digital</Link>
        </li>
        <li>
          <Link to="/segmentos/pizzaria">
            Sistema de pedidos para pizzaria
          </Link>
        </li>
        <li>
          <Link to="/alternativa-ifood">Alternativa ao iFood</Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Crie sua hamburgueria digital grátis</Link>.
      </p>
    </ContentLayout>
  );
}
