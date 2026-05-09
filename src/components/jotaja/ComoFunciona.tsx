import { Smartphone, MessageCircle, Bell } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Smartphone,
    title: "Cadastre seu restaurante",
    desc: "Em 5 minutos você cria seu cardápio com fotos, define horários, taxa de entrega e formas de pagamento. Sem instalação.",
  },
  {
    n: "02",
    icon: MessageCircle,
    title: "Compartilhe seu link",
    desc: "Você recebe uma URL própria (ex: comanda.app/seu-restaurante) pra divulgar nas redes, status do WhatsApp e cardápio físico.",
  },
  {
    n: "03",
    icon: Bell,
    title: "Receba pedidos no WhatsApp",
    desc: "O cliente pede pelo link e o pedido cai organizado no seu painel + WhatsApp. Você só aceita, prepara e entrega. 🎉",
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-block bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            Como funciona
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
            Comece a vender pelo WhatsApp em <span className="text-gradient-primary">3 passos</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Sem mensalidade escondida, sem comissão, sem complicação.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-accent/40" />

          {steps.map((s) => (
            <div
              key={s.n}
              className="relative bg-card rounded-3xl p-8 shadow-card border border-border hover:shadow-elegant hover:-translate-y-1 transition-smooth text-center"
            >
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-accent flex items-center justify-center shadow-accent-lg">
                  <s.icon className="w-9 h-9 text-accent-foreground" />
                </div>
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-extrabold px-3 py-1 rounded-full">
                  {s.n}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
