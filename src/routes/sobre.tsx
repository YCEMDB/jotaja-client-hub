import { createFileRoute } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/sobre";
const TITLE = "Sobre o Comandex — plataforma de delivery próprio";
const DESC =
  "Conheça a história, missão e visão do Comandex: ajudar restaurantes brasileiros a venderem direto, sem comissão e com autonomia total.";

export const Route = createFileRoute("/sobre")({
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
  component: Sobre,
});

function Sobre() {
  return (
    <ContentLayout>
      <h1>Sobre o Comandex</h1>
      <p className="lead">
        Somos uma plataforma brasileira que ajuda restaurantes, pizzarias,
        hamburguerias e lanchonetes a venderem direto pelo WhatsApp e
        cardápio digital — sem comissão por pedido.
      </p>

      <h2>Nossa missão</h2>
      <p>
        Devolver ao dono do restaurante o controle sobre o próprio negócio.
        Acreditamos que ninguém deveria pagar até 27% de comissão para vender
        a própria comida. Por isso construímos uma plataforma simples,
        bonita e robusta, que coloca o restaurante no centro.
      </p>

      <h2>O que fazemos</h2>
      <ul>
        <li>Cardápio digital responsivo, com QR Code e link próprio.</li>
        <li>Recebimento de pedidos pelo WhatsApp e painel em tempo real.</li>
        <li>Gestão de produtos, categorias, adicionais e variações.</li>
        <li>Métricas, relatórios e exportação de dados para o dono decidir.</li>
        <li>Suporte humano, em português, por humanos que entendem do setor.</li>
      </ul>

      <h2>Nossos valores</h2>
      <ul>
        <li><strong>Autonomia</strong> — o restaurante é dono dos próprios clientes.</li>
        <li><strong>Transparência</strong> — preços claros, sem letrinha miúda.</li>
        <li><strong>Simplicidade</strong> — qualquer atendente consegue usar.</li>
        <li><strong>Brasilidade</strong> — feito por quem conhece o dia a dia daqui.</li>
      </ul>

      <h2>Quem usa o Comandex</h2>
      <p>
        Hoje atendemos centenas de restaurantes em todo o Brasil — de
        operações de bairro a redes com várias unidades. Pizzarias,
        hamburguerias, açaiterias, marmitarias, japoneses, food trucks e
        muito mais.
      </p>
    </ContentLayout>
  );
}
