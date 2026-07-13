import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveHostToSlug } from "@/lib/custom-domain.functions";
import { Header } from "@/components/jotaja/Header";
import { Hero } from "@/components/jotaja/Hero";
import { Stats } from "@/components/jotaja/Stats";
import { Bento } from "@/components/jotaja/Bento";
import { ComoFunciona } from "@/components/jotaja/ComoFunciona";
import { ComparativoIfood } from "@/components/jotaja/ComparativoIfood";
import { Depoimentos } from "@/components/jotaja/Depoimentos";
import { Planos } from "@/components/jotaja/Planos";
import { FAQ } from "@/components/jotaja/FAQ";
import { CTA } from "@/components/jotaja/CTA";
import { Footer } from "@/components/jotaja/Footer";
import { WhatsAppFloat } from "@/components/jotaja/WhatsAppFloat";
import { ScrollProgress } from "@/components/motion";

const SITE_URL = "https://comandahub.online";
const TITLE = "Mesivo | Gestão completa para restaurantes";
const DESCRIPTION =
  "Centralize pedidos, mesas, comandas, cardápio digital, delivery, retirada, caixa e cozinha em uma plataforma criada para a rotina real do seu restaurante.";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      const { slug } = await resolveHostToSlug();
      if (slug) {
        throw redirect({ to: "/$slug", params: { slug } });
      }
    } catch (e: any) {
      // Re-throw router redirects; swallow lookup errors so landing still renders.
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
    }
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "keywords", content: "gestão de restaurante, cardápio digital, pedidos online, comandas digitais, controle de mesas, sistema para restaurante, delivery próprio, PDV, caixa, cozinha, KDS" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Mesivo",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
          url: SITE_URL,
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
        <Stats />
        <Bento />
        <ComoFunciona />
        <ComparativoIfood />
        <Depoimentos />
        <Planos />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
