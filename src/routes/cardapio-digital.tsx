import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/cardapio-digital";
const TITLE = "Cardápio Digital: o guia completo para restaurantes em 2026";
const DESC =
  "Aprenda o que é cardápio digital, como funciona com QR Code e WhatsApp, quanto custa e como criar o seu sem comissão. Guia atualizado para restaurantes brasileiros.";

export const Route = createFileRoute("/cardapio-digital")({
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "O que é um cardápio digital?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Cardápio digital é uma versão online do menu do restaurante, acessada pelo cliente via QR Code, link do WhatsApp ou site próprio, com fotos, preços e botão de pedido integrado.",
              },
            },
            {
              "@type": "Question",
              name: "Quanto custa um cardápio digital?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Plataformas variam de gratuitas (com limitações) até R$ 200/mês. O Comandex oferece cardápio digital sem comissão por venda a partir de planos acessíveis.",
              },
            },
            {
              "@type": "Question",
              name: "Cardápio digital funciona sem internet?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "O cliente precisa de internet para abrir o cardápio. No restaurante, recomenda-se Wi-Fi disponível ou conexão 4G para evitar atritos.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: CardapioDigitalPage,
});

function CardapioDigitalPage() {
  return (
    <ContentLayout>
      <h1>Cardápio Digital: o guia completo para restaurantes em 2026</h1>
      <p className="lead">
        Se você ainda imprime cardápio em papel ou depende só do iFood, está
        perdendo vendas, dados de cliente e margem. Este guia explica tudo sobre
        cardápio digital: como funciona, quanto custa, como criar e como usar
        para vender direto sem pagar comissão.
      </p>

      <h2>O que é cardápio digital</h2>
      <p>
        Cardápio digital é a versão online do menu do seu restaurante. Em vez de
        entregar uma folha plastificada, o cliente abre um link ou escaneia um{" "}
        <strong>QR Code</strong> e vê os pratos com foto, descrição e preço
        atualizados em tempo real. O grande diferencial é que ele pode{" "}
        <strong>fazer o pedido direto pelo cardápio</strong>, sem garçom e sem
        intermediário.
      </p>

      <h2>Como funciona o cardápio digital com QR Code</h2>
      <ol>
        <li>Você cadastra seus produtos com foto, preço e adicionais.</li>
        <li>A plataforma gera um QR Code único para o seu restaurante.</li>
        <li>Você imprime e cola nas mesas, embalagens ou flyers.</li>
        <li>O cliente aponta a câmera, abre o cardápio e faz o pedido.</li>
        <li>O pedido cai direto no seu sistema (cozinha ou impressora).</li>
      </ol>
      <p>
        Veja o passo a passo detalhado em nosso{" "}
        <Link to="/blog/como-criar-cardapio-digital-qr-code">
          tutorial de cardápio com QR Code
        </Link>
        .
      </p>

      <h2>Cardápio digital pelo WhatsApp</h2>
      <p>
        A maioria dos pedidos no Brasil ainda chega pelo WhatsApp. Um cardápio
        digital bem feito gera um link único que você cola no status, na bio do
        Instagram ou na mensagem automática do WhatsApp Business. O cliente
        escolhe pelo navegador e o pedido volta formatado para o seu chat.{" "}
        <Link to="/blog/como-fazer-cardapio-digital-whatsapp">
          Aprenda como integrar cardápio digital ao WhatsApp
        </Link>
        .
      </p>

      <h2>Quanto custa um cardápio digital</h2>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Custo</th>
            <th>Limitações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cardápio digital grátis</td>
            <td>R$ 0</td>
            <td>Marca da plataforma, sem pedido online, sem suporte</td>
          </tr>
          <tr>
            <td>Plataforma com comissão (iFood etc.)</td>
            <td>12% a 27% por pedido</td>
            <td>Você não fica com seu cliente; margem comprimida</td>
          </tr>
          <tr>
            <td>Plataforma própria (Comandex)</td>
            <td>Mensalidade fixa, 0% de comissão</td>
            <td>Você gerencia o crescimento</td>
          </tr>
        </tbody>
      </table>
      <p>
        Se quer cardápio sem custo agora, veja como criar um{" "}
        <Link to="/blog/como-fazer-cardapio-digital-gratis">
          cardápio digital grátis (e quando vale a pena)
        </Link>
        .
      </p>

      <h2>Cardápio digital vs Canva: qual escolher?</h2>
      <p>
        Muita gente começa montando um PDF no Canva e mandando pelo WhatsApp. É
        rápido, mas o cliente <strong>não consegue pedir</strong> — ele só vê.
        Isso significa zero automação, zero relatório e fricção alta na hora de
        fechar o pedido.{" "}
        <Link to="/blog/como-montar-cardapio-digital-canva-vs-plataforma">
          Veja o comparativo completo Canva vs plataforma.
        </Link>
      </p>

      <h2>Como criar seu cardápio digital sem comissão</h2>
      <p>
        O Comandex é a plataforma de delivery próprio que une cardápio digital,
        pedido online, PIX instantâneo e gestão num único painel — sem cobrar
        comissão por venda. Veja por que somos a{" "}
        <Link to="/alternativa-ifood">melhor alternativa ao iFood</Link> e como
        nos comparamos a{" "}
        <Link to="/comparativo/comandahub-vs-goomer">Goomer</Link>,{" "}
        <Link to="/comparativo/comandahub-vs-anota-ai">Anota.ai</Link> e{" "}
        <Link to="/comparativo/comandahub-vs-saipos">Saipos</Link>.
      </p>

      <h2>Cardápio digital por segmento</h2>
      <ul>
        <li>
          <Link to="/segmentos/pizzaria">
            Sistema de pedidos para pizzaria
          </Link>{" "}
          — broto/grande, sabores divididos, adicionais.
        </li>
        <li>
          <Link to="/segmentos/hamburgueria">
            Cardápio digital para hamburgueria
          </Link>{" "}
          — combos, ponto da carne, adicionais por andar.
        </li>
      </ul>

      <h2>Perguntas frequentes</h2>
      <h3>Cardápio digital substitui o garçom?</h3>
      <p>
        Não. Ele agiliza o pedido e elimina erros de anotação, deixando o garçom
        focado em hospitalidade e venda sugestiva.
      </p>
      <h3>Funciona no iPhone e Android?</h3>
      <p>
        Sim — o cardápio abre no navegador do celular, sem precisar instalar app.
      </p>
      <h3>Posso usar minha própria marca?</h3>
      <p>
        Sim, no Comandex o cardápio fica em <code>sua-loja.comandahub.online</code>{" "}
        ou em domínio próprio, com sua logo e cores.
      </p>

      <p className="lead">
        Pronto para sair do papel?{" "}
        <Link to="/auth">Crie seu cardápio digital grátis em 5 minutos</Link>.
      </p>
    </ContentLayout>
  );
}
