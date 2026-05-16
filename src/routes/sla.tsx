import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/jotaja/Header";
import { Footer } from "@/components/jotaja/Footer";

export const Route = createFileRoute("/sla")({
  component: SLAPage,
  head: () => ({
    meta: [
      { title: "SLA — ComandaHub" },
      { name: "description", content: "Acordo de Nível de Serviço (SLA) do ComandaHub: disponibilidade, suporte e responsabilidades." },
    ],
  }),
});

function SLAPage() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16 prose prose-neutral">
        <h1 className="text-4xl md:text-5xl font-display uppercase tracking-tight mb-8">SLA — Acordo de Nível de Serviço</h1>

        <p className="text-ink/70">Última atualização: 16 de maio de 2026</p>

        <h2 className="font-display uppercase mt-10">1. Disponibilidade (Uptime)</h2>
        <p>
          O ComandaHub se compromete a manter uma disponibilidade mensal de <strong>99,5%</strong> para os planos Starter e Pro, e <strong>99,9%</strong> para o plano Business, excluídas janelas de manutenção programada (sempre comunicadas com 24h de antecedência) e falhas de terceiros (provedores de internet, gateways de pagamento, WhatsApp).
        </p>

        <h2 className="font-display uppercase mt-10">2. Suporte</h2>
        <ul>
          <li><strong>Starter:</strong> WhatsApp em horário comercial (seg-sex, 9h-18h). Resposta em até 24h úteis.</li>
          <li><strong>Pro:</strong> WhatsApp prioritário (seg-sáb, 9h-22h). Resposta em até 4h úteis.</li>
          <li><strong>Business:</strong> WhatsApp dedicado 24/7 + e-mail. Resposta em até 1h para urgências.</li>
        </ul>

        <h2 className="font-display uppercase mt-10">3. Severidade dos incidentes</h2>
        <ul>
          <li><strong>Crítico:</strong> sistema fora do ar, sem receber pedidos. Atendimento imediato.</li>
          <li><strong>Alto:</strong> função importante quebrada (impressão, cardápio). Até 4h.</li>
          <li><strong>Médio:</strong> bug que não impede operação. Até 2 dias úteis.</li>
          <li><strong>Baixo:</strong> dúvida ou melhoria. Até 5 dias úteis.</li>
        </ul>

        <h2 className="font-display uppercase mt-10">4. Crédito por indisponibilidade</h2>
        <p>
          Caso o uptime mensal fique abaixo do garantido, o cliente recebe crédito proporcional na próxima mensalidade, mediante solicitação por escrito em até 30 dias após o incidente.
        </p>

        <h2 className="font-display uppercase mt-10">5. Exclusões</h2>
        <p>
          Não estão cobertos: falhas em integrações de terceiros (Mercado Pago, WhatsApp, impressoras), problemas de conexão do estabelecimento, configurações incorretas pelo cliente, ou uso fora dos limites contratados.
        </p>

        <h2 className="font-display uppercase mt-10">6. Backup e dados</h2>
        <p>
          Backups automáticos diários são feitos com retenção de 30 dias. O cliente pode solicitar exportação dos seus dados a qualquer momento.
        </p>

        <div className="mt-12 p-6 border-2 border-ink shadow-brutal rounded-2xl bg-brand-amber/20">
          <p className="m-0 font-bold">Dúvidas sobre o SLA?</p>
          <p className="m-0 mt-2">
            Fale com nosso time:{" "}
            <Link to="/suporte" className="underline font-bold">/suporte</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
