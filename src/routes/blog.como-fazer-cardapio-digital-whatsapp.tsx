import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL =
  "https://comandahub.online/blog/como-fazer-cardapio-digital-whatsapp";
const TITLE = "Como fazer cardápio digital para WhatsApp em 5 passos";
const DESC =
  "Tutorial completo: como criar cardápio digital, gerar link e integrar com WhatsApp Business para receber pedidos automaticamente, sem precisar do Canva.";

export const Route = createFileRoute(
  "/blog/como-fazer-cardapio-digital-whatsapp",
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Como fazer cardápio digital para WhatsApp",
          step: [
            { "@type": "HowToStep", name: "Cadastrar produtos" },
            { "@type": "HowToStep", name: "Personalizar com sua marca" },
            { "@type": "HowToStep", name: "Gerar o link do cardápio" },
            { "@type": "HowToStep", name: "Configurar resposta automática" },
            { "@type": "HowToStep", name: "Divulgar nos canais" },
          ],
        }),
      },
    ],
  }),
  component: WhatsAppPage,
});

function WhatsAppPage() {
  return (
    <ContentLayout>
      <h1>Como fazer cardápio digital para WhatsApp (passo a passo)</h1>
      <p className="lead">
        Mais de 80% dos pedidos de delivery no Brasil ainda começam no WhatsApp.
        Em vez de mandar PDF do Canva ou listar os pratos no chat, você pode ter
        um <strong>cardápio digital interativo</strong> que o cliente abre,
        escolhe e envia o pedido em 30 segundos. Veja como configurar.
      </p>

      <h2>1. Cadastre seus produtos</h2>
      <p>
        Crie uma conta no ComandaHub e cadastre cada item com foto, descrição,
        preço, adicionais e variações (ex: tamanho, ponto da carne, borda).
      </p>

      <h2>2. Personalize com a sua marca</h2>
      <p>
        Adicione logo, cores e capa. Isso aumenta a confiança e reduz abandono.
      </p>

      <h2>3. Gere o link do seu cardápio</h2>
      <p>
        O sistema gera automaticamente um link único, como{" "}
        <code>comandahub.online/sua-loja</code>. Esse é o link que vai pro
        WhatsApp.
      </p>

      <h2>4. Configure a resposta automática do WhatsApp Business</h2>
      <ol>
        <li>Abra o WhatsApp Business no celular.</li>
        <li>Vá em <strong>Configurações → Ferramentas comerciais → Mensagem de saudação</strong>.</li>
        <li>
          Ative e cole: <em>"Olá! 😊 Aqui está nosso cardápio digital:{" "}
          comandahub.online/sua-loja — escolha e seu pedido chega direto pra
          nós."</em>
        </li>
      </ol>

      <h2>5. Divulgue nos canais certos</h2>
      <ul>
        <li>Bio do Instagram</li>
        <li>Status do WhatsApp 2x ao dia</li>
        <li>QR Code na embalagem e na porta da loja</li>
        <li>Google Meu Negócio</li>
      </ul>

      <h2>Como o cliente faz o pedido pelo WhatsApp</h2>
      <p>
        O cliente clica no link, escolhe os itens, paga com PIX e o pedido cai
        direto no seu painel + chega formatado no seu WhatsApp. Sem digitação,
        sem erro, sem perder venda.
      </p>

      <h2>Erros comuns ao integrar cardápio com WhatsApp</h2>
      <ul>
        <li>
          <strong>Usar PDF estático:</strong> cliente vê, mas não consegue
          pedir. Veja por que{" "}
          <Link to="/blog/como-montar-cardapio-digital-canva-vs-plataforma">
            Canva não substitui plataforma
          </Link>
          .
        </li>
        <li>
          <strong>Esquecer de incluir o link na bio do Instagram:</strong>{" "}
          metade da audiência chega por lá.
        </li>
        <li>
          <strong>Não atualizar preço:</strong> com cardápio digital o ajuste é
          instantâneo, em 5 segundos.
        </li>
      </ul>

      <h2>Veja também</h2>
      <ul>
        <li>
          <Link to="/cardapio-digital">Guia completo de cardápio digital</Link>
        </li>
        <li>
          <Link to="/blog/como-criar-cardapio-digital-qr-code">
            Como criar cardápio com QR Code
          </Link>
        </li>
        <li>
          <Link to="/alternativa-ifood">Alternativa ao iFood</Link>
        </li>
      </ul>

      <p className="lead">
        <Link to="/auth">Crie seu cardápio digital grátis</Link> e cole o link
        no seu WhatsApp hoje.
      </p>
    </ContentLayout>
  );
}
