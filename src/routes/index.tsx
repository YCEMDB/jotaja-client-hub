import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/jotaja/Header";
import { Hero } from "@/components/jotaja/Hero";
import { Vantagens } from "@/components/jotaja/Vantagens";
import { Funcionalidades } from "@/components/jotaja/Funcionalidades";
import { Depoimentos } from "@/components/jotaja/Depoimentos";
import { Planos } from "@/components/jotaja/Planos";
import { ComparativoPlanos } from "@/components/jotaja/ComparativoPlanos";
import { FAQ } from "@/components/jotaja/FAQ";
import { CTA } from "@/components/jotaja/CTA";
import { Footer } from "@/components/jotaja/Footer";
import { WhatsAppFloat } from "@/components/jotaja/WhatsAppFloat";

const SITE_URL = "https://jotaja-client-hub.lovable.app";
const OG_IMAGE = `${SITE_URL}/og-comandahub.jpg`;
const TITLE = "ComandaHub — Plataforma de delivery próprio para restaurantes | Sem comissão";
const DESCRIPTION =
  "Aumente vendas, automatize a operação e reduza custos. Cardápio digital, pedidos online, gestão e relatórios em tempo real. Teste grátis 14 dias, sem cartão.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "keywords", content: "delivery próprio, cardápio digital, sistema para restaurante, pedidos online, sem comissão, gestão de restaurante, pix instantâneo, plataforma delivery" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Painel da ComandaHub mostrando faturamento, pedidos e clientes" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ComandaHub",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
          url: SITE_URL,
          image: OG_IMAGE,
          offers: {
            "@type": "Offer",
            price: "99.00",
            priceCurrency: "BRL",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            ratingCount: "1200",
          },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Vantagens />
        <Funcionalidades />
        <Depoimentos />
        <Planos />
        <ComparativoPlanos />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
