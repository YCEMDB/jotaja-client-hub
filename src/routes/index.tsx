import { createFileRoute, redirect } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { resolveHostToSlug } from "@/lib/custom-domain.functions";
import { PublicShell } from "@/components/mesivo-shell/PublicShell";
import { ScrollProgress } from "@/components/motion";
import { WhatsAppFloat } from "@/components/jotaja/WhatsAppFloat";
import {
  LandingHero,
  ProblemaSolucao,
  FluxoPedidos,
  RecursosMesivo,
  Beneficios,
  PlanosMesivo,
  FAQMesivo,
  CTAFinal,
} from "@/components/mesivo-landing";
import { mesivoFaq } from "@/components/mesivo-landing/faq-data";

const SITE_URL = "https://comandahub.online";
const TITLE = "Mesivo | Gestão completa para restaurantes";
const DESCRIPTION =
  "Cardápio digital, pedidos online, PDV, mesas, comandas, cozinha e caixa sincronizados em tempo real. Sem comissão por venda, com fluxo pensado para a rotina real do restaurante.";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      const { slug } = await resolveHostToSlug();
      if (slug) {
        throw redirect({ to: "/$slug", params: { slug } });
      }
    } catch (e: unknown) {
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
    }
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "gestão de restaurante, cardápio digital, pedidos online, comandas, mesas, PDV, cozinha, KDS, caixa, delivery próprio, sistema para restaurante",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
      // Bricolage Grotesque (display marketing) + Instrument Serif (acento
      // editorial pontual). Carregados apenas na landing — outras rotas
      // marketing permanecem no display global.
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
    scripts: [
      {
        // Estende o nó #software emitido no root com Offers reais dos planos
        // (fonte: public.app_plans). Sem AggregateRating/Review — a marca
        // Mesivo é nova e não há prova social auditável a apresentar.
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": `${SITE_URL}/#software`,
          name: "Mesivo",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web, iOS, Android (PWA)",
          url: SITE_URL,
          description: DESCRIPTION,
          inLanguage: "pt-BR",
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "BRL",
            lowPrice: "97.00",
            highPrice: "397.00",
            offerCount: 3,
            offers: [
              {
                "@type": "Offer",
                name: "Starter",
                price: "97.00",
                priceCurrency: "BRL",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "97.00",
                  priceCurrency: "BRL",
                  billingIncrement: 1,
                  unitCode: "MON",
                },
                category: "SubscriptionNewMember",
                availability: "https://schema.org/InStock",
                url: `${SITE_URL}/#planos`,
              },
              {
                "@type": "Offer",
                name: "Pro",
                price: "197.00",
                priceCurrency: "BRL",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "197.00",
                  priceCurrency: "BRL",
                  billingIncrement: 1,
                  unitCode: "MON",
                },
                category: "SubscriptionNewMember",
                availability: "https://schema.org/InStock",
                url: `${SITE_URL}/#planos`,
              },
              {
                "@type": "Offer",
                name: "Business",
                price: "397.00",
                priceCurrency: "BRL",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: "397.00",
                  priceCurrency: "BRL",
                  billingIncrement: 1,
                  unitCode: "MON",
                },
                category: "SubscriptionNewMember",
                availability: "https://schema.org/InStock",
                url: `${SITE_URL}/#planos`,
              },
            ],
          },
        }),
      },
      {
        // FAQPage gerado a partir de mesivoFaq (fonte única compartilhada
        // com FAQMesivo.tsx) — garante paridade 1:1 com o FAQ visível.
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: mesivoFaq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    // reducedMotion="never" evita hydration mismatch — cada primitivo do
    // motion/react troca para variantes reduzidas via useReducedMotionSafe.
    <MotionConfig reducedMotion="never">
      <PublicShell variant="landing">
        <ScrollProgress />
        <LandingHero />
        <ProblemaSolucao />
        <FluxoPedidos />
        <RecursosMesivo />
        <Beneficios />
        <PlanosMesivo />
        <FAQMesivo />
        <CTAFinal />
      </PublicShell>
      <WhatsAppFloat />
    </MotionConfig>
  );
}
