import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/jotaja/Header";
import { Hero } from "@/components/jotaja/Hero";
import { Vantagens } from "@/components/jotaja/Vantagens";
import { Funcionalidades } from "@/components/jotaja/Funcionalidades";
import { Stats } from "@/components/jotaja/Stats";
import { FAQ } from "@/components/jotaja/FAQ";
import { CTA } from "@/components/jotaja/CTA";
import { Footer } from "@/components/jotaja/Footer";
import { WhatsAppFloat } from "@/components/jotaja/WhatsAppFloat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jotajá — Pedidos | Portal do Cliente" },
      { name: "description", content: "Tenha sua própria base de clientes no delivery. Plataforma de gestão de pedidos via WhatsApp para restaurantes, padarias, hortifrutis e mais." },
      { property: "og:title", content: "Jotajá — Pedidos | Portal do Cliente" },
      { property: "og:description", content: "Plataforma de delivery próprio sem comissão. Receba pedidos no WhatsApp, com cardápio personalizado e gestão completa." },
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
        <Vantagens />
        <Funcionalidades />
        <Stats />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
