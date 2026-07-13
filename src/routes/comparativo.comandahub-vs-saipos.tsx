import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/comparativo/comandahub-vs-saipos";
const TITLE = "Mesivo vs Saipos: ERP completo ou delivery próprio?";
const DESC =
  "Saipos é ERP robusto para restaurante. Mesivo é foco em delivery próprio sem comissão. Veja qual encaixa no seu negócio.";

export const Route = createFileRoute("/comparativo/comandahub-vs-saipos")({
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
  component: VsSaiposPage,
});

function VsSaiposPage() {
  return (
    <ContentLayout>
      <h1>Mesivo vs Saipos: qual escolher em 2026?</h1>
      <p className="lead">
        Saipos é um ERP gastronômico consolidado, com módulos de fiscal,
        estoque, financeiro e PDV. Mesivo foca em cardápio digital +
        delivery próprio sem comissão. Cada um resolve um tipo de dor.
      </p>

      <h2>Tabela comparativa</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Mesivo</th>
            <th>Saipos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cardápio digital + delivery</td>
            <td>Núcleo do produto</td>
            <td>Módulo adicional</td>
          </tr>
          <tr>
            <td>ERP completo (fiscal, estoque)</td>
            <td>Em desenvolvimento</td>
            <td>Sim, robusto</td>
          </tr>
          <tr>
            <td>Tempo de implantação</td>
            <td>Minutos</td>
            <td>Semanas</td>
          </tr>
          <tr>
            <td>Mensalidade</td>
            <td>Acessível, fixa</td>
            <td>Mais alta, modular</td>
          </tr>
          <tr>
            <td>Comissão por pedido</td>
            <td>0%</td>
            <td>0%</td>
          </tr>
          <tr>
            <td>Foco</td>
            <td>Pequenos e médios delivery</td>
            <td>Médios e grandes com gestão complexa</td>
          </tr>
        </tbody>
      </table>

      <h2>Quando escolher Saipos</h2>
      <p>
        Operação grande com várias frentes (salão, delivery, balcão, fiscal,
        estoque, controle de mesa), múltiplas lojas, necessidade de integração
        contábil avançada e equipe dedicada à TI.
      </p>

      <h2>Quando escolher Mesivo</h2>
      <p>
        Você quer começar (ou trocar) hoje, ter cardápio digital, receber pelo
        WhatsApp, despachar entregador e ver relatórios — sem implantação de
        semanas nem time de TI. Mensalidade enxuta, sem comissão.
      </p>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/comparativo/comandahub-vs-goomer">
            Mesivo vs Goomer
          </Link>
        </li>
        <li>
          <Link to="/comparativo/comandahub-vs-anota-ai">
            Mesivo vs Anota.ai
          </Link>
        </li>
        <li>
          <Link to="/alternativa-ifood">Alternativa ao iFood</Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Teste o Mesivo grátis</Link> em menos de 5 minutos.
      </p>
    </ContentLayout>
  );
}
