import { Zap, ShieldCheck, TrendingUp, HeartHandshake, Sparkles, Clock } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Configure em minutos",
    desc: "Suba seu cardápio, ajuste cores e logos, e comece a receber pedidos no mesmo dia.",
  },
  {
    icon: ShieldCheck,
    title: "Sem comissão por venda",
    desc: "Você paga uma mensalidade fixa. Cada real do pedido vai direto para o seu caixa.",
  },
  {
    icon: TrendingUp,
    title: "Cresça com seus dados",
    desc: "Relatórios de vendas, produtos campeões e horários de pico em tempo real.",
  },
  {
    icon: HeartHandshake,
    title: "Sua marca, seus clientes",
    desc: "Domínio próprio, identidade visual sua e base de clientes 100% sob seu controle.",
  },
  {
    icon: Sparkles,
    title: "Experiência premium",
    desc: "Cardápio rápido, bonito e responsivo que converte navegação em pedido.",
  },
  {
    icon: Clock,
    title: "Suporte humano de verdade",
    desc: "Time de especialistas no WhatsApp para resolver junto com você quando precisar.",
  },
];

export function Vantagens() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Por que Comanda
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Tudo que você precisa para
            <br />
            <span className="text-muted-foreground">vender mais e melhor.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Uma plataforma desenhada para restaurantes que querem crescer com autonomia,
            sem depender de marketplaces.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card p-8 hover:bg-accent-soft transition-smooth group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
