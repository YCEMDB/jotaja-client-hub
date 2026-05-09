import { Smartphone, MessageSquare, ShieldCheck, Heart, Users, DollarSign } from "lucide-react";

const vantagens = [
  { icon: DollarSign, title: "Zero comissão por pedido", desc: "Pague apenas a mensalidade fixa. 100% do lucro fica com você.", highlight: true },
  { icon: MessageSquare, title: "Pedidos direto no WhatsApp", desc: "Recurso exclusivo: pedido cai resumido no WhatsApp do restaurante." },
  { icon: Smartphone, title: "Cliente não baixa app", desc: "Pedido por link no navegador, sem fricção. Conversão muito maior." },
  { icon: Heart, title: "Sua marca, seu controle", desc: "URL própria, cores, logo e banner do seu jeito. Você dono dos clientes." },
  { icon: Users, title: "Não ocupa atendente", desc: "Pedido entra automatizado e organizado. Equipe focada na cozinha." },
  { icon: ShieldCheck, title: "Sem fidelidade nem letra miúda", desc: "Cancele quando quiser. Suporte humanizado todos os dias 8h-22h." },
];

export function Vantagens() {
  return (
    <section id="vantagens" className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-block bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            Por que Comanda
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
            Tudo que iFood te cobra <span className="marker-highlight">sem cobrar</span> nada por pedido
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vantagens.map((v, i) => (
            <div
              key={i}
              className={`group rounded-3xl p-7 border transition-smooth hover:-translate-y-1 ${
                v.highlight
                  ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
                  : "bg-card border-border shadow-card hover:shadow-elegant"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-bounce group-hover:scale-110 ${
                v.highlight ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent-foreground"
              }`}>
                <v.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display font-extrabold text-xl mb-2 leading-snug">{v.title}</h3>
              <p className={`text-sm leading-relaxed ${v.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
