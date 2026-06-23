import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL =
  "https://comandahub.online/blog/como-criar-cardapio-digital-qr-code";
const TITLE = "Como criar cardápio digital com QR Code (passo a passo 2026)";
const DESC =
  "Aprenda a criar cardápio digital com QR Code para mesa, embalagem ou flyer. Tutorial prático com dicas de impressão e melhores práticas para restaurantes.";

export const Route = createFileRoute(
  "/blog/como-criar-cardapio-digital-qr-code",
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
  component: QrCodePage,
});

function QrCodePage() {
  return (
    <ContentLayout>
      <h1>Como criar cardápio digital com QR Code (passo a passo)</h1>
      <p className="lead">
        QR Code no cardápio elimina o menu de papel, agiliza o pedido e mostra
        prato com foto e descrição completa. Veja como criar o seu em minutos e
        usar de forma profissional.
      </p>

      <h2>Por que usar QR Code no cardápio</h2>
      <ul>
        <li>Atualização instantânea de preço e disponibilidade</li>
        <li>Fotos de alta qualidade aumentam ticket médio em até 30%</li>
        <li>Menos contato físico e troca de menu</li>
        <li>Cliente pode pedir direto pelo celular, sem garçom</li>
      </ul>

      <h2>Passo a passo</h2>
      <ol>
        <li>
          Crie sua conta no Comandex e cadastre os produtos com foto e preço.
        </li>
        <li>
          Vá em <strong>Configurações → QR Code</strong> e clique em "Gerar".
        </li>
        <li>Baixe o PNG ou PDF do QR Code em alta resolução.</li>
        <li>Imprima e cole nas mesas, embalagens, balcão ou flyer.</li>
      </ol>

      <h2>Como fazer cardápio com QR Code para WhatsApp</h2>
      <p>
        O mesmo QR Code abre o cardápio em qualquer celular. Para pedidos via
        WhatsApp, basta acoplar o fluxo descrito no nosso{" "}
        <Link to="/blog/como-fazer-cardapio-digital-whatsapp">
          tutorial de cardápio digital para WhatsApp
        </Link>
        .
      </p>

      <h2>Dicas de impressão e design</h2>
      <ul>
        <li>
          <strong>Tamanho mínimo:</strong> 4 cm × 4 cm. Menor que isso, câmeras
          de celular antigas não leem.
        </li>
        <li>
          <strong>Contraste:</strong> QR escuro em fundo claro. Evite gradiente
          atrás.
        </li>
        <li>
          <strong>Material:</strong> adesivo plastificado para mesa, papel
          couché para flyer.
        </li>
        <li>
          <strong>CTA:</strong> escreva "Aponte a câmera e peça pelo celular".
        </li>
      </ul>

      <h2>Cardápio digital QR Code grátis: vale a pena?</h2>
      <p>
        Existem geradores grátis, mas eles só criam a imagem. Eles{" "}
        <strong>não geram pedido, não recebem pagamento e não dão relatório</strong>.
        Veja a diferença em nosso{" "}
        <Link to="/blog/como-fazer-cardapio-digital-gratis">
          guia de cardápio digital grátis
        </Link>
        .
      </p>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/cardapio-digital">Guia completo de cardápio digital</Link>
        </li>
        <li>
          <Link to="/segmentos/pizzaria">
            Sistema de pedidos para pizzaria
          </Link>
        </li>
        <li>
          <Link to="/segmentos/hamburgueria">
            Cardápio digital para hamburgueria
          </Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Crie seu QR Code de cardápio em 5 minutos</Link>.
      </p>
    </ContentLayout>
  );
}
