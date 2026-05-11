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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comanda — Plataforma de delivery próprio para restaurantes" },
      { name: "description", content: "Receba pedidos pelo seu cardápio digital, gerencie operação e fidelize clientes. Sem comissão, sua marca, seus dados." },
      { property: "og:title", content: "Comanda — Delivery próprio sem comissão" },
      { property: "og:description", content: "Plataforma completa para restaurantes: cardápio digital, pedidos, gestão e relatórios em tempo real." },
      { property: "og:type", content: "website" },
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
