import { ShoppingBag, Smartphone, BarChart3, Tag, Bike, MessageSquare, CreditCard, Users } from "lucide-react";

const features = [
  { icon: Smartphone, title: "Cardápio digital", desc: "Seu menu no link, com fotos, categorias e adicionais." },
  { icon: ShoppingBag, title: "Gestão de pedidos", desc: "Painel em tempo real com fluxo do pedido até a entrega." },
  { icon: CreditCard, title: "Pagamento online", desc: "Pix instantâneo, cartão na entrega ou dinheiro." },
  { icon: Bike, title: "Entregas e motoboys", desc: "Áreas de entrega, taxas por bairro e atribuição de drivers." },
  { icon: Tag, title: "Cupons e promoções", desc: "Crie cupons percentuais ou de valor fixo em segundos." },
  { icon: BarChart3, title: "Relatórios completos", desc: "Faturamento, ticket médio e produtos mais vendidos." },
  { icon: Users, title: "Base de clientes", desc: "Histórico de pedidos e dados de cada cliente seu." },
  { icon: MessageSquare, title: "Acompanhamento", desc: "Cliente acompanha pedido pelo celular sem login." },
];

export function Funcionalidades() {
  return (
    <section id="funcionalidades" className="py-24 md:py-32 bg-secondary border-y border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Funcionalidades
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Uma plataforma. Tudo integrado.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Recursos profissionais pensados para a operação real de um restaurante.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative rounded-xl border border-border bg-card p-6 shadow-xs hover:shadow-card-md hover:-translate-y-0.5 transition-smooth"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Icon className="w-4.5 h-4.5" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
