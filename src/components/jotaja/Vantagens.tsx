import { Smartphone, MessageSquare, Shield, Heart, Users, DollarSign } from "lucide-react";

const vantagens = [
  { icon: Smartphone, title: "O usuário não precisa instalar aplicativo", desc: "Seu cliente faz o pedido por um link, direto no navegador." },
  { icon: MessageSquare, title: "Pedidos via WhatsApp e redes sociais", desc: "Facilita a recepção e gestão de pedidos no canal que o cliente já usa." },
  { icon: Shield, title: "Total transparência no pedido", desc: "Cliente e restaurante sempre alinhados. Zero ruído na comunicação." },
  { icon: Heart, title: "Interface fácil e amigável", desc: "Layout familiar, parecido com os maiores deliveries do mundo." },
  { icon: Users, title: "Não ocupa o atendente", desc: "Pedido entra automatizado e organizado direto na cozinha." },
  { icon: DollarSign, title: "Sem comissões de aplicativos", desc: "Você fica com 100% do lucro. Pague apenas a mensalidade fixa." },
];

export function Vantagens() {
  return (
    <section id="vantagens" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-4">
            <span className="text-primary">VANTAGENS</span> de usar o{" "}
            <span className="text-primary">JOTAJÁ</span> em seu restaurante
          </h2>
          <div className="underline-wave" />
          <p className="text-muted-foreground mt-6 text-lg">
            Ajudamos seu estabelecimento a formar sua própria base de clientes no delivery.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vantagens.map((v, i) => (
            <div
              key={i}
              className="group bg-card rounded-2xl p-8 shadow-card border border-border hover:shadow-elegant hover:-translate-y-1 transition-smooth"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-soft group-hover:scale-110 transition-smooth">
                  <v.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-primary mb-2">
                    0{i + 1}.
                  </div>
                  <h3 className="font-display font-bold text-lg leading-snug mb-2">
                    {v.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
