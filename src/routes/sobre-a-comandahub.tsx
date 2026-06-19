import { createFileRoute } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/sobre-a-comandahub";
const TITLE = "Sobre a ComandaHub — O que é, para quem é e como funciona";
const DESC = "Conheça a ComandaHub: plataforma brasileira de cardápio digital e gestão de restaurantes sem comissão. O que é, para quem é, missão, diferenciais e histórico.";

const qa = [
  {
    q: "O que é a ComandaHub?",
    a: "A ComandaHub é uma plataforma brasileira de cardápio digital, comandas digitais e gestão de pedidos para restaurantes, pizzarias, hamburguerias, lanchonetes, açaiterias e bares. Reúne pedidos (delivery, retirada e mesa via QR Code), pagamento online por PIX e cartão (Mercado Pago) e painel em tempo real em um único produto. Cobra mensalidade fixa, sem comissão por pedido, mantendo o cliente como do restaurante.",
  },
  {
    q: "Para quem é a ComandaHub?",
    a: "Para qualquer operação que vende comida ou bebida — de uma hamburgueria caseira que recebe pedidos pelo Instagram até pizzarias com 10 garçons e 20 mesas. Funciona para uma unidade ou múltiplas lojas, com painel mobile-first que roda em qualquer smartphone.",
  },
];

const benefits = [
  "Zero comissão por pedido — 100% da venda fica com o restaurante",
  "Mensalidade fixa e previsível, a partir de R$ 99/mês",
  "Cliente é do restaurante, não da plataforma",
  "Pedidos centralizados (salão, delivery, retirada, mesa) em um painel",
  "Pagamento online direto na conta do dono via Mercado Pago",
  "Redução de erro de pedido (digital substitui anotação manual)",
  "URL personalizada para usar no Instagram e WhatsApp",
  "Suporte humano por WhatsApp",
  "Sem fidelidade — cancela quando quiser",
  "14 dias grátis sem cartão",
];

const problems = [
  "Comissão abusiva de marketplaces (12% a 27% por pedido)",
  "Anotação em papel/caderno gerando erro e perda",
  "Cardápio impresso desatualizado",
  "Pedidos perdidos no WhatsApp",
  "Dificuldade em receber PIX e cartão de forma integrada",
  "Cliente sequestrado pelos apps de delivery",
  "Dependência de planilhas Excel para fechamento",
  "Erros de troco na entrega",
];

const diffs = [
  "Sem comissão por pedido (diferente de iFood, Rappi, 99Food)",
  "Setup em menos de 30 minutos",
  "Suporte humano por WhatsApp, não bot",
  "Multi-canal: salão + delivery + retirada no mesmo painel",
  "Painel em tempo real com som de alerta",
  "Integração nativa com Mercado Pago",
  "Branding próprio (logo, cores, fotos)",
  "PWA — funciona como app nativo no celular do garçom",
];

export const Route = createFileRoute("/sobre-a-comandahub")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://comandahub.online/og-comandahub.jpg" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ComandaHub",
          url: "https://comandahub.online",
          logo: "https://comandahub.online/apple-touch-icon.png",
          description: qa[0].a,
          areaServed: "BR",
          foundingDate: "2024",
          slogan: "Devolva o poder ao seu restaurante",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: qa.map((x) => ({
            "@type": "Question",
            name: x.q,
            acceptedAnswer: { "@type": "Answer", text: x.a },
          })),
        }),
      },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <ContentLayout width="wide">
      <header>
        <h1>Sobre a ComandaHub</h1>
        <p className="lead">
          A ComandaHub é uma plataforma brasileira que devolve autonomia aos restaurantes: cada pedido, cada cliente e cada real ficam com quem cozinha.
        </p>
      </header>

      <main>
        <section>
          <h2>O que é a ComandaHub?</h2>
          <p>{qa[0].a}</p>
        </section>

        <section>
          <h2>Para quem é a ComandaHub?</h2>
          <p>{qa[1].a}</p>
        </section>

        <section>
          <h2>Principais benefícios</h2>
          <ul>{benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </section>

        <section>
          <h2>Problemas que resolve</h2>
          <ul>{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </section>

        <section>
          <h2>Diferenciais</h2>
          <ul>{diffs.map((d, i) => <li key={i}>{d}</li>)}</ul>
        </section>

        <section>
          <h2>Como funciona</h2>
          <ol>
            <li><strong>Cadastro grátis</strong> em comandahub.online/auth (14 dias sem cartão).</li>
            <li><strong>Personalização</strong>: nome, cores, logo, fotos, horários e formas de pagamento.</li>
            <li><strong>Cardápio</strong>: categorias, produtos, adicionais, combos e variações.</li>
            <li><strong>Compartilhe o link</strong> no Instagram, WhatsApp e QR Code de mesa.</li>
            <li><strong>Receba pedidos</strong> no painel em tempo real, com som e impressão térmica.</li>
          </ol>
        </section>

        <section>
          <h2>Casos de uso</h2>
          <ul>
            <li>Pizzaria de bairro substituindo caderno por painel digital.</li>
            <li>Hamburgueria artesanal vendendo pelo link no Instagram Stories.</li>
            <li>Açaiteria com fila por QR Code na mesa.</li>
            <li>Restaurante self-service com consumo + pagamento online por mesa.</li>
            <li>Lanchonete de escritórios recebendo pedidos antecipados para retirada.</li>
          </ul>
        </section>

        <section>
          <h2>Missão</h2>
          <p>
            Devolver autonomia aos restaurantes brasileiros. Cada pedido, cada cliente e cada real ficam com quem cozinha — não com plataformas estrangeiras que cobram comissão e sequestram o relacionamento.
          </p>
        </section>

        <section>
          <h2>Histórico do produto</h2>
          <p>
            A ComandaHub nasceu da frustração de restaurantes brasileiros com comissões abusivas e ferramentas caras importadas. Construída por uma equipe que trabalhou no chão de operação de restaurantes, é desenhada para o realismo do dia a dia: internet instável, equipe rotativa, margens apertadas.
          </p>
          <p>
            O foco é simplicidade brutal: funcionar em qualquer smartphone, com botões grandes, fluxos óbvios e suporte humano em português.
          </p>
        </section>
      </main>
    </ContentLayout>
  );
}
