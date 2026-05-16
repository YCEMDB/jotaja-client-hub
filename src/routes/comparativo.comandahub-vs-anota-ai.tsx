import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/comparativo/comandahub-vs-anota-ai";
const TITLE = "ComandaHub vs Anota.ai: comparativo de delivery próprio";
const DESC =
  "ComandaHub ou Anota.ai? Veja a comparação de preços, comissões, cardápio digital, WhatsApp, PIX e gestão para escolher a plataforma certa.";

export const Route = createFileRoute("/comparativo/comandahub-vs-anota-ai")({
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
  component: VsAnotaAiPage,
});

function VsAnotaAiPage() {
  return (
    <ContentLayout>
      <h1>ComandaHub vs Anota.ai: qual escolher para delivery próprio?</h1>
      <p className="lead">
        Anota.ai é referência em pedidos via WhatsApp com IA. ComandaHub é
        plataforma completa de delivery próprio. As duas competem em vários
        pontos — entenda onde cada uma brilha.
      </p>

      <h2>Tabela comparativa</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>ComandaHub</th>
            <th>Anota.ai</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Comissão por pedido</td>
            <td>0%</td>
            <td>0% (planos pagos)</td>
          </tr>
          <tr>
            <td>Pedido via WhatsApp</td>
            <td>Sim, link automático</td>
            <td>Sim, bot com IA</td>
          </tr>
          <tr>
            <td>Cardápio digital QR Code</td>
            <td>Sim</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td>Delivery próprio (entregadores)</td>
            <td>Gestão nativa</td>
            <td>Integração</td>
          </tr>
          <tr>
            <td>PIX instantâneo</td>
            <td>Sim</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td>Painel de gestão</td>
            <td>Completo (pedidos, clientes, cupons)</td>
            <td>Foco no robô de WhatsApp</td>
          </tr>
          <tr>
            <td>Curva de aprendizado</td>
            <td>Baixa</td>
            <td>Média</td>
          </tr>
        </tbody>
      </table>

      <h2>Quando escolher Anota.ai</h2>
      <p>
        Se seu fluxo é 100% WhatsApp e você quer um bot inteligente respondendo
        clientes 24/7, Anota.ai é forte. O foco deles é automatizar a conversa.
      </p>

      <h2>Quando escolher ComandaHub</h2>
      <p>
        Se você quer um <strong>ecossistema completo</strong> — cardápio
        digital, link próprio, salão, delivery, entregadores, relatórios e PIX —
        sem precisar contratar 3 ferramentas, ComandaHub centraliza tudo.
      </p>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/comparativo/comandahub-vs-goomer">
            ComandaHub vs Goomer
          </Link>
        </li>
        <li>
          <Link to="/comparativo/comandahub-vs-saipos">
            ComandaHub vs Saipos
          </Link>
        </li>
        <li>
          <Link to="/alternativa-ifood">Alternativa ao iFood</Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Crie sua conta grátis no ComandaHub</Link> e teste sem
        compromisso.
      </p>
    </ContentLayout>
  );
}
