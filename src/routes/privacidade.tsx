import { createFileRoute } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/privacidade";
const TITLE = "Política de Privacidade — ComandaHub";
const DESC =
  "Política de privacidade do ComandaHub: quais dados coletamos, como usamos, com quem compartilhamos e como você exerce seus direitos pela LGPD.";

export const Route = createFileRoute("/privacidade")({
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
  component: Privacidade,
});

function Privacidade() {
  return (
    <ContentLayout>
      <h1>Política de Privacidade</h1>
      <p>
        <em>Última atualização: 16 de maio de 2026.</em>
      </p>
      <p className="lead">
        Esta política descreve como o ComandaHub coleta, usa, armazena e
        protege os dados pessoais dos restaurantes contratantes, dos
        usuários do painel e dos consumidores finais que fazem pedidos
        nos cardápios hospedados em nossa plataforma. Estamos em
        conformidade com a Lei Geral de Proteção de Dados (Lei
        nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Quem é o controlador dos dados</h2>
      <p>
        O ComandaHub é controlador dos dados de cadastro do restaurante e
        do usuário do painel. Para os dados dos consumidores finais
        (pedidos feitos no cardápio), o restaurante contratante é o
        controlador e o ComandaHub atua como operador.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Dados de cadastro:</strong> nome, e-mail, telefone, nome
          do restaurante, CNPJ (quando informado).
        </li>
        <li>
          <strong>Dados de uso:</strong> logs de acesso, IP, dispositivo,
          páginas visitadas, ações no painel.
        </li>
        <li>
          <strong>Dados de pagamento:</strong> processados por gateways
          parceiros (Stripe, Pagar.me, etc.); não armazenamos número
          completo de cartão.
        </li>
        <li>
          <strong>Pedidos dos consumidores:</strong> nome, telefone,
          endereço de entrega, itens, observações, forma de pagamento.
        </li>
      </ul>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>Operar a plataforma e cumprir o contrato com o restaurante.</li>
        <li>Suporte técnico e atendimento humano.</li>
        <li>Comunicações operacionais (faturas, avisos, alertas).</li>
        <li>Análise interna de uso para melhorar o produto.</li>
        <li>Cumprimento de obrigações legais e regulatórias.</li>
      </ul>

      <h2>4. Base legal</h2>
      <p>
        Tratamos dados com base em execução de contrato, cumprimento de
        obrigação legal, legítimo interesse para melhoria do serviço e,
        quando aplicável, consentimento do titular.
      </p>

      <h2>5. Compartilhamento</h2>
      <p>
        Não vendemos dados pessoais. Compartilhamos apenas com:
      </p>
      <ul>
        <li>
          Provedores essenciais de infraestrutura (hospedagem, banco de
          dados, envio de e-mail, gateway de pagamento).
        </li>
        <li>Autoridades públicas, quando exigido por lei.</li>
        <li>
          O próprio restaurante contratante, no caso de dados de pedidos
          feitos por seus consumidores finais.
        </li>
      </ul>

      <h2>6. Retenção</h2>
      <p>
        Mantemos os dados pelo tempo necessário para prestação do
        serviço e cumprimento de obrigações legais (por exemplo, dados
        fiscais e contábeis por até 5 anos). Após esse período, os dados
        são anonimizados ou eliminados.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais para proteger os
        dados: criptografia em trânsito (HTTPS), criptografia de senhas,
        controle de acesso por papel, backups regulares e monitoramento.
      </p>

      <h2>8. Direitos do titular</h2>
      <p>
        Você pode, a qualquer momento, solicitar: confirmação de
        tratamento, acesso, correção, anonimização, portabilidade,
        eliminação dos dados e revogação do consentimento. Para exercer
        esses direitos, envie e-mail para{" "}
        <a href="mailto:privacidade@comandahub.online">
          privacidade@comandahub.online
        </a>
        .
      </p>

      <h2>9. Cookies</h2>
      <p>
        Utilizamos cookies essenciais para manter a sessão autenticada e
        cookies analíticos para entender uso agregado da plataforma.
        Cookies analíticos podem ser desativados nas configurações do
        navegador.
      </p>

      <h2>10. Encarregado de dados (DPO)</h2>
      <p>
        Para dúvidas, reclamações ou exercício de direitos, fale com
        nosso encarregado pelo e-mail{" "}
        <a href="mailto:privacidade@comandahub.online">
          privacidade@comandahub.online
        </a>
        .
      </p>

      <h2>11. Alterações</h2>
      <p>
        Esta política pode ser atualizada. Mudanças relevantes serão
        comunicadas no painel administrativo ou por e-mail. A data no
        topo indica a última revisão.
      </p>
    </ContentLayout>
  );
}
