import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/jotaja/Header";
import { Footer } from "@/components/jotaja/Footer";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, BookOpen, Clock } from "lucide-react";

export const Route = createFileRoute("/suporte")({
  component: SuportePage,
  head: () => ({
    meta: [
      { title: "Suporte — ComandaHub" },
      { name: "description", content: "Suporte técnico do ComandaHub via WhatsApp, e-mail e central de ajuda." },
    ],
  }),
});

const WHATSAPP = "5527999999999"; // TODO: trocar pelo número real

function SuportePage() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-6xl font-display uppercase tracking-tight mb-4">Suporte</h1>
        <p className="text-xl text-ink/70 mb-12 max-w-2xl">
          Estamos aqui pra resolver. Escolha o canal que preferir — respondemos rápido.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a
            href={`https://wa.me/${WHATSAPP}?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20ComandaHub.`}
            target="_blank"
            rel="noreferrer"
            className="block p-8 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-magenta text-background border-2 border-ink shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <MessageCircle className="h-10 w-10 mb-4" />
            <h3 className="font-display uppercase text-2xl mb-2">WhatsApp</h3>
            <p className="opacity-90">Canal principal. Resposta em minutos no horário comercial.</p>
            <p className="mt-4 font-bold underline">Abrir conversa →</p>
          </a>

          <a
            href="mailto:suporte@comandahub.online"
            className="block p-8 rounded-2xl bg-background border-2 border-ink shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <Mail className="h-10 w-10 mb-4 text-brand-violet" />
            <h3 className="font-display uppercase text-2xl mb-2">E-mail</h3>
            <p className="text-ink/70">suporte@comandahub.online</p>
            <p className="mt-4 font-bold underline">Enviar e-mail →</p>
          </a>
        </div>

        <section className="p-8 rounded-2xl bg-ink text-background border-2 border-ink shadow-brutal mb-12">
          <div className="flex items-start gap-4">
            <Clock className="h-8 w-8 shrink-0 text-brand-amber" />
            <div>
              <h3 className="font-display uppercase text-2xl mb-3">Horários de atendimento</h3>
              <ul className="space-y-2 text-background/80">
                <li><strong className="text-background">Starter:</strong> Seg-Sex, 9h às 18h</li>
                <li><strong className="text-background">Pro:</strong> Seg-Sáb, 9h às 22h (prioritário)</li>
                <li><strong className="text-background">Business:</strong> 24/7 (canal dedicado)</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display uppercase text-3xl mb-6">Perguntas comuns</h2>
          <div className="space-y-4">
            {[
              { q: "Como ativo a impressão automática?", a: "No painel admin → Configurações → Impressão. Você precisa abrir o Chrome com a flag --kiosk-printing. Veja o guia na própria aba." },
              { q: "Como recebo pagamentos pelo PIX?", a: "Conecte sua conta Mercado Pago em Configurações → Pagamentos. PIX é gerado automaticamente no checkout." },
              { q: "Posso mudar de plano a qualquer momento?", a: "Sim. Acesse Configurações → Plano. A mudança vale a partir do próximo ciclo." },
              { q: "Como cadastro vários bairros de uma vez?", a: "Em Configurações → Áreas de entrega, use 'Importar bairros pré-cadastrados' (já temos Vitória e Vila Velha)." },
            ].map((item, i) => (
              <details key={i} className="p-5 border-2 border-ink rounded-2xl bg-background shadow-brutal group">
                <summary className="font-bold cursor-pointer list-none flex justify-between items-center">
                  {item.q}
                  <span className="text-brand-orange group-open:rotate-45 transition-transform text-2xl">+</span>
                </summary>
                <p className="mt-3 text-ink/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-16 p-6 border-2 border-ink rounded-2xl bg-brand-amber/20 text-center">
          <BookOpen className="h-8 w-8 mx-auto mb-3" />
          <p className="font-bold mb-3">Sistema fora do ar?</p>
          <a href={`https://wa.me/${WHATSAPP}?text=URGENTE`} target="_blank" rel="noreferrer">
            <Button className="bg-ink text-background hover:bg-ink/90 font-bold shadow-brutal">
              Falar com plantão URGENTE
            </Button>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
