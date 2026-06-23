import { createFileRoute } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/contato";
const TITLE = "Contato — Comandex";
const DESC =
  "Fale com o time do Comandex: vendas, suporte, parcerias e imprensa. Atendimento humano em português, todos os dias.";

export const Route = createFileRoute("/contato")({
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
  component: Contato,
});

function Contato() {
  return (
    <ContentLayout>
      <h1>Fale com a gente</h1>
      <p className="lead">
        Atendimento humano, em português, pelos canais que você já usa
        todo dia. Respondemos rápido — geralmente no mesmo dia útil.
      </p>

      <h2>WhatsApp comercial</h2>
      <p>
        Quer entender se o Comandex serve para o seu restaurante?
        Chame no WhatsApp e a gente conversa sem compromisso.
      </p>
      <p>
        <a
          href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20Comandex"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir conversa no WhatsApp →
        </a>
      </p>

      <h2>E-mail</h2>
      <ul>
        <li>
          Comercial: <a href="mailto:contato@comandahub.online">contato@comandahub.online</a>
        </li>
        <li>
          Suporte: <a href="mailto:suporte@comandahub.online">suporte@comandahub.online</a>
        </li>
        <li>
          Imprensa: <a href="mailto:imprensa@comandahub.online">imprensa@comandahub.online</a>
        </li>
      </ul>

      <h2>Horário de atendimento</h2>
      <p>
        Segunda a sexta, das 9h às 19h. Sábado, das 9h às 13h. Mensagens
        fora desse horário são respondidas no próximo dia útil.
      </p>

      <h2>Já é cliente?</h2>
      <p>
        Clientes ativos têm canal de suporte prioritário dentro do painel
        administrativo. Acesse sua loja e clique em "Suporte" no menu.
      </p>
    </ContentLayout>
  );
}
