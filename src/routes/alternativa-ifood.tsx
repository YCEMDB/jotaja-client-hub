import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/alternativa-ifood";
const TITLE = "Alternativa ao iFood: venda direto, sem comissão de 27%";
const DESC =
  "Cansado de pagar 12% a 27% de comissão? Veja como restaurantes brasileiros estão usando o ComandaHub como alternativa ao iFood — com cardápio digital, PIX instantâneo e marca própria.";

export const Route = createFileRoute("/alternativa-ifood")({
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
  component: AlternativaIfoodPage,
});

function AlternativaIfoodPage() {
  return (
    <ContentLayout>
      <h1>Alternativa ao iFood: venda direto sem perder 27% por pedido</h1>
      <p className="lead">
        O iFood traz volume, mas come a margem. Se você é dono de restaurante e
        já fez a conta, sabe que cada R$ 100 de venda deixa quase R$ 30 na
        plataforma. A boa notícia: existe alternativa, e ela é mais barata,
        rápida e <strong>com a sua marca</strong>.
      </p>

      <h2>Por que sair (ou diminuir) do iFood</h2>
      <ul>
        <li>
          <strong>Comissão alta:</strong> 12% a 27% por pedido, dependendo do
          plano e da entrega.
        </li>
        <li>
          <strong>Cliente não é seu:</strong> a base de dados pertence ao iFood,
          não a você.
        </li>
        <li>
          <strong>Disputa por algoritmo:</strong> seu restaurante compete com
          dezenas de outros na mesma busca.
        </li>
        <li>
          <strong>Pagamento em D+30:</strong> capital de giro travado.
        </li>
      </ul>

      <h2>O que é o ComandaHub</h2>
      <p>
        ComandaHub é uma <strong>plataforma de delivery próprio</strong>. Você
        ganha um link e/ou domínio com cardápio digital, pedido online integrado
        ao WhatsApp, PIX instantâneo, gestão de entregadores e relatórios — sem
        comissão por venda. Mensalidade fixa, previsível, e o cliente sai do
        pedido sabendo que comprou de você.
      </p>

      <h2>iFood vs ComandaHub: comparativo direto</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>iFood</th>
            <th>ComandaHub</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Comissão por pedido</td>
            <td>12% a 27%</td>
            <td>0%</td>
          </tr>
          <tr>
            <td>Sua marca</td>
            <td>Sub-página</td>
            <td>Domínio e identidade próprios</td>
          </tr>
          <tr>
            <td>Base de clientes</td>
            <td>iFood</td>
            <td>Sua</td>
          </tr>
          <tr>
            <td>Recebimento</td>
            <td>D+30</td>
            <td>PIX na hora</td>
          </tr>
          <tr>
            <td>WhatsApp integrado</td>
            <td>Não</td>
            <td>Sim, nativo</td>
          </tr>
          <tr>
            <td>Cardápio digital com QR Code</td>
            <td>Limitado</td>
            <td>Incluso</td>
          </tr>
        </tbody>
      </table>

      <h2>Quanto você economiza saindo do iFood</h2>
      <p>
        Restaurante que fatura R$ 50.000/mês no iFood paga, em média,{" "}
        <strong>R$ 10.000 a R$ 13.500 em comissão</strong>. Com o ComandaHub, a
        mensalidade é fixa e milhares de vezes menor. Em 1 mês a economia já
        paga 1 ano de plataforma.
      </p>

      <h2>Como migrar (sem perder volume)</h2>
      <ol>
        <li>
          Crie seu cardápio próprio no ComandaHub —{" "}
          <Link to="/cardapio-digital">guia completo aqui</Link>.
        </li>
        <li>
          Coloque o link na bio do Instagram, no status do WhatsApp e na
          embalagem.
        </li>
        <li>Ofereça desconto/cupom para quem pedir direto.</li>
        <li>
          Mantenha o iFood ativo no início e migre gradualmente — sem corte
          brusco.
        </li>
      </ol>

      <h2>Outras alternativas ao iFood</h2>
      <p>
        Avaliando opções? Veja como o ComandaHub se compara a{" "}
        <Link to="/comparativo/comandahub-vs-goomer">Goomer</Link>,{" "}
        <Link to="/comparativo/comandahub-vs-anota-ai">Anota.ai</Link> e{" "}
        <Link to="/comparativo/comandahub-vs-saipos">Saipos</Link>.
      </p>

      <p className="lead">
        Pare de pagar comissão de 27%.{" "}
        <Link to="/auth">Crie sua conta grátis no ComandaHub</Link>.
      </p>
    </ContentLayout>
  );
}
