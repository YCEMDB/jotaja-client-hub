import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL =
  "https://comandahub.online/blog/sistema-de-pedidos-para-restaurante";
const TITLE = "Sistema de pedidos para restaurante: como escolher em 2026";
const DESC =
  "Guia para escolher o melhor sistema de pedidos para restaurante: funcionalidades essenciais, preços, comissão, integração com WhatsApp e PIX.";

export const Route = createFileRoute(
  "/blog/sistema-de-pedidos-para-restaurante",
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
  component: SistemaPedidosPage,
});

function SistemaPedidosPage() {
  return (
    <ContentLayout>
      <h1>Sistema de pedidos para restaurante: como escolher em 2026</h1>
      <p className="lead">
        Bom sistema de pedidos paga a própria mensalidade em uma semana. Ruim
        custa cliente perdido todo dia. Veja o que avaliar antes de assinar.
      </p>

      <h2>O que é um sistema de pedidos para restaurante</h2>
      <p>
        É a plataforma que recebe o pedido (no balcão, mesa ou delivery),
        encaminha para a cozinha, registra o pagamento e gera relatório. Pode
        ser <strong>integrado a cardápio digital</strong> para o cliente pedir
        pelo celular.
      </p>

      <h2>Funcionalidades essenciais</h2>
      <ul>
        <li>Cardápio digital com foto, descrição e adicionais</li>
        <li>Pedido online via link próprio e WhatsApp</li>
        <li>Pagamento por PIX, cartão e dinheiro</li>
        <li>Cálculo de taxa de entrega por bairro/CEP</li>
        <li>Gestão de entregadores</li>
        <li>Impressão automática de comanda na cozinha</li>
        <li>Cupons e programa de fidelidade</li>
        <li>Relatórios de venda, ticket médio e produto mais pedido</li>
      </ul>

      <h2>Quanto custa um sistema de pedidos</h2>
      <table>
        <thead>
          <tr>
            <th>Modelo</th>
            <th>Custo típico</th>
            <th>Quando faz sentido</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Marketplace (iFood, Rappi)</td>
            <td>12% a 27% por pedido</td>
            <td>Precisa de tráfego pronto</td>
          </tr>
          <tr>
            <td>Plataforma própria (Mesivo)</td>
            <td>Mensalidade fixa, 0% comissão</td>
            <td>Quer marca e margem próprias</td>
          </tr>
          <tr>
            <td>ERP completo (Saipos)</td>
            <td>R$ 300+/mês</td>
            <td>Operação grande, multi-loja</td>
          </tr>
        </tbody>
      </table>

      <h2>Sistema de pedidos para restaurante grátis</h2>
      <p>
        Versões 100% gratuitas existem, mas costumam ter limite de pedidos ou
        forçar a marca da plataforma. Comece testando o{" "}
        <Link to="/blog/como-fazer-cardapio-digital-gratis">
          cardápio digital grátis
        </Link>{" "}
        antes de pagar.
      </p>

      <h2>Como o Mesivo se compara</h2>
      <p>
        Veja nossos comparativos diretos:{" "}
        <Link to="/comparativo/comandahub-vs-goomer">vs Goomer</Link>,{" "}
        <Link to="/comparativo/comandahub-vs-anota-ai">vs Anota.ai</Link> e{" "}
        <Link to="/comparativo/comandahub-vs-saipos">vs Saipos</Link>.
      </p>

      <h2>Por segmento</h2>
      <ul>
        <li>
          <Link to="/segmentos/pizzaria">
            Sistema de pedidos para pizzaria
          </Link>
        </li>
        <li>
          <Link to="/segmentos/hamburgueria">
            Sistema de pedidos para hamburgueria
          </Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Comece grátis</Link> e tenha cardápio + pedido em
        minutos.
      </p>
    </ContentLayout>
  );
}
