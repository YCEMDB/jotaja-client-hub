import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL =
  "https://comandahub.online/blog/como-montar-cardapio-digital-canva-vs-plataforma";
const TITLE = "Cardápio digital no Canva vs plataforma: qual escolher?";
const DESC =
  "Cardápio digital no Canva é prático, mas tem limites. Veja a diferença real entre montar no Canva e usar uma plataforma de pedido online.";

export const Route = createFileRoute(
  "/blog/como-montar-cardapio-digital-canva-vs-plataforma",
)({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: CanvaPage,
});

function CanvaPage() {
  return (
    <ContentLayout>
      <h1>Cardápio digital no Canva vs plataforma: qual escolher?</h1>
      <p className="lead">
        Canva é incrível para design, mas <strong>não é cardápio digital de
        verdade</strong>. Entenda quando cada solução faz sentido — e por que
        misturar as duas dá o melhor resultado.
      </p>

      <h2>O que dá para fazer com cardápio digital no Canva</h2>
      <ul>
        <li>PDF ou imagem com layout bonito</li>
        <li>Link público compartilhável (Canva Site)</li>
        <li>Atualização manual quando preço muda</li>
      </ul>

      <h2>O que NÃO dá para fazer no Canva</h2>
      <ul>
        <li>Cliente clicar e fazer pedido</li>
        <li>Receber pagamento (PIX, cartão)</li>
        <li>Imprimir comanda na cozinha</li>
        <li>Calcular taxa de entrega por bairro</li>
        <li>Ver relatório de venda</li>
        <li>Aplicar cupom de desconto</li>
      </ul>

      <h2>Quando usar Canva</h2>
      <p>
        Para <strong>cardápio de mesa em restaurante de salão</strong>, onde o
        garçom anota o pedido. Funciona como um menu bonito digitalizado.
      </p>

      <h2>Quando usar plataforma (Comandex)</h2>
      <p>
        Sempre que você quer <strong>receber pedido pelo celular do cliente</strong>:
        delivery, pegue-e-leve, autoatendimento de mesa. A plataforma cuida do
        fluxo todo: catálogo → pedido → pagamento → cozinha → entrega.
      </p>

      <h2>Combinação ideal</h2>
      <ol>
        <li>Use Canva para criar arte do QR Code, flyer e identidade visual.</li>
        <li>
          Use Comandex para o <strong>cardápio funcional</strong> que recebe
          pedido.
        </li>
        <li>
          Cole o QR Code do Comandex na arte do Canva. Pronto: design Canva +
          inteligência Comandex.
        </li>
      </ol>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/cardapio-digital">Guia completo de cardápio digital</Link>
        </li>
        <li>
          <Link to="/blog/como-criar-cardapio-digital-qr-code">
            Como criar cardápio com QR Code
          </Link>
        </li>
        <li>
          <Link to="/blog/como-fazer-cardapio-digital-gratis">
            Cardápio digital grátis: vale a pena?
          </Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Crie um cardápio que vende</Link>, não só um que mostra.
      </p>
    </ContentLayout>
  );
}
