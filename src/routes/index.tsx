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
