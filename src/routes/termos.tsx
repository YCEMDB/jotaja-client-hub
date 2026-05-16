import { createFileRoute } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/termos";
const TITLE = "Termos de Uso — ComandaHub";
const DESC =
  "Termos de uso da plataforma ComandaHub: regras de utilização, responsabilidades, pagamentos, cancelamento e propriedade intelectual.";

export const Route = createFileRoute("/termos")({
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
  component: Termos,
});

function Termos() {
  return (
    <ContentLayout>
      <h1>Termos de Uso</h1>
      <p>
        <em>Última atualização: 16 de maio de 2026.</em>
      </p>
      <p className="lead">
        Estes Termos regulam o uso da plataforma ComandaHub. Ao criar uma
        conta ou utilizar qualquer funcionalidade, você concorda com as
        condições abaixo.
      </p>

      <h2>1. Aceitação</h2>
      <p>
        Ao se cadastrar, você declara ter capacidade legal para contratar
        em nome próprio ou da pessoa jurídica que representa, e que aceita
        integralmente estes Termos e a nossa{" "}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>2. Cadastro e conta</h2>
      <ul>
        <li>As informações fornecidas devem ser verdadeiras e atualizadas.</li>
        <li>Você é responsável por manter a confidencialidade do acesso.</li>
        <li>É proibido criar contas falsas ou se passar por terceiros.</li>
      </ul>

      <h2>3. Planos, pagamentos e renovação</h2>
      <p>
        Os planos vigentes estão descritos na página de preços. A cobrança
        é recorrente (mensal ou anual) e renovada automaticamente, salvo
        cancelamento. Em caso de inadimplência por mais de 7 dias, a
        plataforma pode suspender o acesso até regularização.
      </p>

      <h2>4. Período de teste</h2>
      <p>
        Novos clientes podem ter direito a um período de teste gratuito,
        com prazo informado no momento da contratação. Encerrado o teste,
        o plano contratado entra em vigor automaticamente.
      </p>

      <h2>5. Cancelamento</h2>
      <p>
        O cancelamento pode ser feito a qualquer momento pelo painel
        administrativo ou pelos canais oficiais de suporte. Valores já
        pagos não são reembolsados proporcionalmente, salvo previsão legal
        em contrário (CDC, art. 49 — direito de arrependimento em 7 dias).
      </p>

      <h2>6. Conteúdo do cliente</h2>
      <p>
        Imagens, textos, cardápios e marcas inseridos pelo cliente
        permanecem de sua propriedade. O ComandaHub apenas hospeda e exibe
        esse conteúdo conforme necessário para a prestação do serviço.
      </p>

      <h2>7. Uso aceitável</h2>
      <p>
        É proibido utilizar a plataforma para atividades ilícitas,
        comercialização de produtos proibidos, envio de spam ou qualquer
        prática que viole leis brasileiras ou direitos de terceiros.
      </p>

      <h2>8. Disponibilidade do serviço</h2>
      <p>
        Trabalhamos para manter o serviço sempre disponível, mas podem
        ocorrer interrupções para manutenção, atualizações ou por causas
        alheias à nossa vontade. Não nos responsabilizamos por perdas
        decorrentes de indisponibilidade pontual.
      </p>

      <h2>9. Limitação de responsabilidade</h2>
      <p>
        O ComandaHub é uma ferramenta tecnológica. As decisões comerciais,
        a operação do restaurante, a qualidade dos produtos vendidos e o
        relacionamento com clientes finais são de responsabilidade
        exclusiva do contratante.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Estes Termos podem ser atualizados a qualquer momento. Mudanças
        relevantes serão comunicadas por e-mail ou no painel
        administrativo, com antecedência mínima de 15 dias.
      </p>

      <h2>11. Foro</h2>
      <p>
        Fica eleito o foro da comarca do contratante para dirimir
        eventuais controvérsias decorrentes destes Termos, com renúncia a
        qualquer outro, por mais privilegiado que seja.
      </p>
    </ContentLayout>
  );
}
