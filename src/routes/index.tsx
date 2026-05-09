import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/jotaja/Header";
import { Hero } from "@/components/jotaja/Hero";
import { ComoFunciona } from "@/components/jotaja/ComoFunciona";
import { Vantagens } from "@/components/jotaja/Vantagens";
import { Funcionalidades } from "@/components/jotaja/Funcionalidades";
import { Segmentos } from "@/components/jotaja/Segmentos";
import { ComparativoIfood } from "@/components/jotaja/ComparativoIfood";
import { Calculadora } from "@/components/jotaja/Calculadora";
import { Depoimentos } from "@/components/jotaja/Depoimentos";
import { Planos } from "@/components/jotaja/Planos";
import { FAQ } from "@/components/jotaja/FAQ";
import { CTA } from "@/components/jotaja/CTA";
import { Footer } from "@/components/jotaja/Footer";
import { WhatsAppFloat } from "@/components/jotaja/WhatsAppFloat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comanda — Delivery próprio sem comissão pra restaurantes" },
      { name: "description", content: "Plataforma completa de delivery com cardápio digital, pedidos via WhatsApp e gestão completa. Sua marca, seus clientes, zero comissão." },
      { property: "og:title", content: "Comanda — Delivery próprio sem comissão" },
      { property: "og:description", content: "Receba pedidos pelo WhatsApp, gerencie cardápio, entregadores e cupons. Tudo com a sua identidade. Teste 14 dias grátis." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ComoFunciona />
        <Vantagens />
        <Funcionalidades />
        <Segmentos />
        <ComparativoIfood />
        <Calculadora />
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
