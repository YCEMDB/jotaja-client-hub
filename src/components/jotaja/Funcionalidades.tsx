import {
  Globe, MessageCircle, ShoppingBag, BookOpen, Truck, MapPin,
  CreditCard, Tag, CalendarClock, Printer, BarChart3, Users,
  UserCog, Building2, Cloud, Headphones, GraduationCap, Wallet
} from "lucide-react";

const grupos = [
  {
    titulo: "Cardápio digital + Site próprio",
    icon: Globe,
    items: [
      { icon: Globe, t: "URL personalizada", d: "comanda.app/seu-restaurante" },
      { icon: BookOpen, t: "Cardápio com fotos", d: "Categorias, descrições, adicionais e combos" },
      { icon: ShoppingBag, t: "Layout customizável", d: "Logo, cores e banners da sua marca" },
    ],
  },
  {
    titulo: "Recebimento de pedidos",
    icon: MessageCircle,
    items: [
      { icon: MessageCircle, t: "Pedidos no WhatsApp", d: "Resumo automático no chat do restaurante" },
      { icon: ShoppingBag, t: "Painel em tempo real", d: "Aceitar, recusar e acompanhar status" },
      { icon: CalendarClock, t: "Agendamento", d: "Cliente escolhe data e hora da entrega" },
    ],
  },
  {
    titulo: "Logística de entrega",
    icon: Truck,
    items: [
      { icon: Truck, t: "Gestão de entregadores", d: "Atribua pedidos e gere relatórios" },
      { icon: MapPin, t: "Áreas de entrega", d: "Bairros e taxas (fixa ou %) no mapa" },
      { icon: Printer, t: "Impressão automática", d: "Caixa e cozinha, com corte automático" },
    ],
  },
  {
    titulo: "Pagamentos e promoções",
    icon: CreditCard,
    items: [
      { icon: CreditCard, t: "Online e presencial", d: "PIX, cartão, vale-refeição, dinheiro" },
      { icon: Tag, t: "Cupons inteligentes", d: "Valor ou %, validade, link auto-aplicado" },
      { icon: Wallet, t: "Pagamento integrado", d: "Receba antes do entregador sair" },
    ],
  },
  {
    titulo: "CRM e relatórios",
    icon: BarChart3,
    items: [
      { icon: Users, t: "Base de clientes (CRM)", d: "Histórico completo, exportação CSV" },
      { icon: BarChart3, t: "Dashboard e relatórios", d: "Vendas, ticket médio, mapa de calor" },
      { icon: UserCog, t: "Multiusuário", d: "Admin e operadores com permissões" },
    ],
  },
  {
    titulo: "Estrutura e suporte",
    icon: Cloud,
    items: [
      { icon: Building2, t: "Redes e franquias", d: "Direcionamento pra loja mais próxima" },
      { icon: Cloud, t: "100% nuvem", d: "Backup automático, acesso de qualquer lugar" },
      { icon: Headphones, t: "Suporte humanizado", d: "WhatsApp, telefone, e-mail e TeamViewer" },
    ],
  },
];

export function Funcionalidades() {
  return (
    <section id="funcionalidades" className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-block bg-accent-soft text-accent-foreground font-bold text-sm px-4 py-1.5 rounded-full mb-4">
            18 funcionalidades
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Tudo que você precisa pra <span className="text-gradient-primary">administrar seu delivery</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Onboarding guiado, treinamento incluso e Customer Success quando precisar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grupos.map((g, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl p-7 shadow-card hover:shadow-elegant transition-smooth group">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-smooth">
                  <g.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-extrabold text-lg leading-tight">{g.titulo}</h3>
              </div>
              <ul className="space-y-4">
                {g.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent-soft text-accent-foreground flex items-center justify-center">
                      <it.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{it.t}</div>
                      <div className="text-xs text-muted-foreground leading-snug">{it.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
