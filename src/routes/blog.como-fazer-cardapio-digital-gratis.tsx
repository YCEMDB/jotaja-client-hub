import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/blog/como-fazer-cardapio-digital-gratis";
const TITLE = "Cardápio digital grátis: como fazer (e quando vale a pena)";
const DESC =
  "Quer cardápio digital gratuito? Veja as melhores opções, limitações e como começar grátis no Comandex sem perder funcionalidade essencial.";

export const Route = createFileRoute(
  "/blog/como-fazer-cardapio-digital-gratis",
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
  component: GratisPage,
});

function GratisPage() {
  return (
    <ContentLayout>
      <h1>Como fazer cardápio digital grátis (e quando vale a pena pagar)</h1>
      <p className="lead">
        Dá para começar com cardápio digital sem gastar nada — mas quase toda
        opção gratuita tem pegadinha. Veja o que esperar e como criar o seu
        sem cair em armadilhas.
      </p>

      <h2>Opções gratuitas mais comuns</h2>
      <ol>
        <li>
          <strong>PDF no Canva:</strong> grátis, mas cliente só lê — não pede.
        </li>
        <li>
          <strong>Google Drive com link:</strong> idem, sem botão de pedido.
        </li>
        <li>
          <strong>WhatsApp Business "catálogo":</strong> fica preso ao app, sem
          link público.
        </li>
        <li>
          <strong>Plataformas freemium:</strong> grátis até X pedidos/mês, depois
          cobram.
        </li>
      </ol>

      <h2>Limitações de cardápio digital grátis</h2>
      <ul>
        <li>Marca da plataforma (não a sua)</li>
        <li>Sem pedido online integrado</li>
        <li>Sem PIX instantâneo</li>
        <li>Sem relatórios nem cupons</li>
        <li>Sem suporte</li>
      </ul>

      <h2>Como criar um cardápio digital grátis de verdade</h2>
      <ol>
        <li>
          Crie conta no <Link to="/auth">Comandex</Link> — você ganha período
          de teste sem cobrança.
        </li>
        <li>Cadastre produtos com foto, descrição e preço.</li>
        <li>Personalize com sua logo e cores.</li>
        <li>Copie o link e divulgue.</li>
      </ol>

      <h2>Como criar cardápio digital interativo gratuito</h2>
      <p>
        "Interativo" = cliente clica, escolhe, paga. Isso{" "}
        <strong>não existe em ferramenta 100% grátis para sempre</strong>{" "}
        séria — porque envolve servidor, gateway de pagamento, suporte e
        atualização constante. Mas dá para começar sem investimento durante o
        teste e só assinar quando o ROI estiver provado.
      </p>

      <h2>Quando vale migrar para o pago</h2>
      <ul>
        <li>Você já recebe mais de 20 pedidos/semana</li>
        <li>Quer parar de digitar pedido manualmente</li>
        <li>Quer integrar PIX e parar de pegar dinheiro na entrega</li>
        <li>Precisa de relatórios para decidir cardápio e promoções</li>
      </ul>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/cardapio-digital">Guia completo de cardápio digital</Link>
        </li>
        <li>
          <Link to="/blog/como-montar-cardapio-digital-canva-vs-plataforma">
            Canva vs plataforma: qual escolher
          </Link>
        </li>
        <li>
          <Link to="/alternativa-ifood">Alternativa ao iFood</Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Comece grátis no Comandex</Link> sem cartão de
        crédito.
      </p>
    </ContentLayout>
  );
}
