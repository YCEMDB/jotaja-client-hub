import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/comparativo/comandahub-vs-goomer";
const TITLE = "Comandex vs Goomer: qual é melhor para seu restaurante?";
const DESC =
  "Comparativo completo entre Comandex e Goomer: preços, comissão, funcionalidades, cardápio digital, integração WhatsApp e suporte. Veja qual escolher em 2026.";

export const Route = createFileRoute("/comparativo/comandahub-vs-goomer")({
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
  component: VsGoomerPage,
});

function VsGoomerPage() {
  return (
    <ContentLayout>
      <h1>Comandex vs Goomer: comparativo completo (2026)</h1>
      <p className="lead">
        Goomer é uma das plataformas mais conhecidas de cardápio digital no
        Brasil. Comandex é a alternativa moderna, focada em delivery próprio
        sem comissão. Veja qual atende melhor o seu restaurante.
      </p>

      <h2>Resumo rápido</h2>
      <ul>
        <li>
          <strong>Escolha Goomer</strong> se você quer apenas cardápio digital
          QR Code para mesa e já tem outro sistema de delivery.
        </li>
        <li>
          <strong>Escolha Comandex</strong> se você quer cardápio digital +
          delivery próprio + WhatsApp + PIX num único lugar, sem comissão.
        </li>
      </ul>

      <h2>Tabela comparativa</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Comandex</th>
            <th>Goomer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Comissão por pedido</td>
            <td>0%</td>
            <td>0% (planos pagos)</td>
          </tr>
          <tr>
            <td>Cardápio digital QR Code</td>
            <td>Sim</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td>Delivery próprio integrado</td>
            <td>Sim, nativo</td>
            <td>Limitado</td>
          </tr>
          <tr>
            <td>Pedido pelo WhatsApp</td>
            <td>Sim, com bot e link automático</td>
            <td>Plano avançado</td>
          </tr>
          <tr>
            <td>PIX instantâneo</td>
            <td>Sim</td>
            <td>Via integração</td>
          </tr>
          <tr>
            <td>Domínio próprio</td>
            <td>Sim</td>
            <td>Sim, em planos superiores</td>
          </tr>
          <tr>
            <td>Foco</td>
            <td>Delivery próprio + salão</td>
            <td>Salão / autoatendimento</td>
          </tr>
        </tbody>
      </table>

      <h2>Quando o Goomer faz sentido</h2>
      <p>
        Goomer é forte em restaurantes de salão que querem QR Code na mesa para
        que o cliente peça sem chamar o garçom. A interface é bem polida e a
        marca é consolidada.
      </p>

      <h2>Quando o Comandex é melhor</h2>
      <p>
        Se o seu restaurante vive de <strong>delivery</strong> (próprio ou
        misto), o Comandex entrega mais valor por mensalidade: cardápio
        digital, WhatsApp, PIX, gestão de entregadores e relatórios — tudo
        nativo, sem precisar integrar três sistemas diferentes.
      </p>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/comparativo/comandahub-vs-anota-ai">
            Comandex vs Anota.ai
          </Link>
        </li>
        <li>
          <Link to="/comparativo/comandahub-vs-saipos">
            Comandex vs Saipos
          </Link>
        </li>
        <li>
          <Link to="/alternativa-ifood">Alternativa ao iFood</Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Teste o Comandex grátis</Link> e compare na prática.
      </p>
    </ContentLayout>
  );
}
