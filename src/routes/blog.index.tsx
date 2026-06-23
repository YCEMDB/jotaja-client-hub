import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/blog";
const TITLE = "Blog Comandex — guias e tutoriais para restaurantes";
const DESC =
  "Conteúdo prático sobre cardápio digital, sistema de pedidos, WhatsApp, QR Code e alternativas ao iFood para donos de restaurante.";

const posts = [
  {
    to: "/cardapio-digital",
    title: "Cardápio Digital: o guia completo para restaurantes em 2026",
    desc: "Tudo o que você precisa saber: o que é, como funciona, quanto custa e como criar o seu sem comissão.",
  },
  {
    to: "/alternativa-ifood",
    title: "Alternativa ao iFood: venda direto sem comissão",
    desc: "Como sair (ou diminuir) o iFood e recuperar até 27% de margem por pedido.",
  },
  {
    to: "/blog/sistema-de-pedidos-para-restaurante",
    title: "Sistema de pedidos para restaurante: como escolher",
    desc: "Critérios, preços, comissão e funcionalidades essenciais.",
  },
  {
    to: "/blog/como-fazer-cardapio-digital-whatsapp",
    title: "Como fazer cardápio digital para WhatsApp",
    desc: "Tutorial passo a passo para receber pedido direto no chat.",
  },
  {
    to: "/blog/como-criar-cardapio-digital-qr-code",
    title: "Como criar cardápio digital com QR Code",
    desc: "Do cadastro do produto à impressão do QR na embalagem.",
  },
  {
    to: "/blog/como-fazer-cardapio-digital-gratis",
    title: "Cardápio digital grátis: como fazer e quando vale a pena",
    desc: "O que esperar das opções gratuitas e quando migrar para o pago.",
  },
  {
    to: "/blog/como-montar-cardapio-digital-canva-vs-plataforma",
    title: "Cardápio digital no Canva vs plataforma",
    desc: "Onde o Canva ajuda e onde ele te faz perder venda.",
  },
  {
    to: "/comparativo/comandahub-vs-goomer",
    title: "Comandex vs Goomer",
    desc: "Cardápio digital + delivery: qual escolher?",
  },
  {
    to: "/comparativo/comandahub-vs-anota-ai",
    title: "Comandex vs Anota.ai",
    desc: "Plataforma completa ou bot de WhatsApp?",
  },
  {
    to: "/comparativo/comandahub-vs-saipos",
    title: "Comandex vs Saipos",
    desc: "ERP grande ou delivery próprio enxuto?",
  },
  {
    to: "/segmentos/pizzaria",
    title: "Sistema de pedidos para pizzaria",
    desc: "Sabores divididos, broto/grande, bordas e adicionais.",
  },
  {
    to: "/segmentos/hamburgueria",
    title: "Cardápio digital para hamburgueria",
    desc: "Combos, ponto da carne e adicionais que aumentam ticket.",
  },
] as const;

export const Route = createFileRoute("/blog/")({
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
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <ContentLayout width="wide">
      <h1>Blog Comandex</h1>
      <p className="lead">
        Guias práticos para donos de restaurante venderem mais sem depender de
        marketplace.
      </p>
      <div className="not-prose grid gap-4 md:grid-cols-2 mt-8">
        {posts.map((post) => (
          <Link
            key={post.to}
            to={post.to}
            className="block rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-primary/60 hover:bg-accent/30"
          >
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {post.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{post.desc}</p>
          </Link>
        ))}
      </div>
    </ContentLayout>
  );
}
