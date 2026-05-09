import {
  MessageCircle, Layout, Headphones, BookOpen, UserCheck, Tag,
  UsersRound, Settings, Printer, BarChart3, Clock, Cloud,
  PhoneCall, Network, Truck, CalendarClock, CreditCard, Plug
} from "lucide-react";
import featureImg from "@/assets/feature-restaurant.jpg";
import customerImg from "@/assets/feature-customer.jpg";

const funcs = [
  { icon: MessageCircle, title: "Recepção pelo WhatsApp", desc: "Status do pedido chega direto no WhatsApp do restaurante. Recurso exclusivo." },
  { icon: Layout, title: "Interface familiar", desc: "Semelhante aos maiores deliveries do mercado mundial." },
  { icon: Headphones, title: "Suporte premium", desc: "Atendimento por email, telefone, WhatsApp e TeamViewer." },
  { icon: BookOpen, title: "Gestão de cardápio", desc: "Pratos, categorias, descrições e disponibilidade configurável." },
  { icon: UserCheck, title: "Gestão de clientes", desc: "Lista completa de todos que pediram no seu delivery." },
  { icon: Tag, title: "Cupons e ofertas", desc: "Cupons de desconto em valor fixo ou percentual." },
  { icon: UsersRound, title: "Multiusuário", desc: "Usuário admin para configurar e operador para aceitar pedidos." },
  { icon: Settings, title: "Administração da loja", desc: "URL personalizada, horários, área de entrega, design customizado." },
  { icon: Printer, title: "Impressoras", desc: "Imprima pedidos com suporte a corte automático." },
  { icon: BarChart3, title: "Financeiro", desc: "Extrato detalhado com lista de compras, valores e datas." },
  { icon: Clock, title: "Preço dinâmico", desc: "Configure valores diferentes para cada dia e horário." },
  { icon: Cloud, title: "Servidores na nuvem", desc: "Infraestrutura na Azure Microsoft. Sem servidor local." },
  { icon: PhoneCall, title: "Pedidos por telefone", desc: "Registre pedidos recebidos pelo telefone." },
  { icon: Network, title: "Redes e franquias", desc: "Controle de pedidos por unidade da rede." },
  { icon: Truck, title: "Gestão de entregas", desc: "Atribua pedidos aos entregadores e gere relatórios." },
  { icon: CalendarClock, title: "Agendamento", desc: "Permita que seus clientes agendem pedidos." },
  { icon: CreditCard, title: "Pagamento online", desc: "Seu cliente pode pagar direto na plataforma." },
  { icon: Plug, title: "Integrações", desc: "Loggi, Saipos, Colibri e SD." },
];

export function Funcionalidades() {
  return (
    <section id="funcionalidades" className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-4">
            Funcionalidades que <span className="text-primary">transformam</span> seu delivery
          </h2>
          <div className="underline-wave" />
          <p className="text-muted-foreground mt-6 text-lg">
            Suporte por telefone, email e WhatsApp. Todos os dias, inclusive feriados, das 8h às 22h.
          </p>
        </div>

        {/* Two big cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="relative rounded-3xl overflow-hidden shadow-elegant group">
            <img src={featureImg} alt="Para o seu restaurante" className="w-full h-72 object-cover group-hover:scale-105 transition-smooth" loading="lazy" width={1024} height={1024} />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-background">
              <h3 className="font-display text-3xl font-black mb-2">Para o seu restaurante</h3>
              <p className="text-background/90">Organize pedidos, equipe e cardápio em um só lugar.</p>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-elegant group">
            <img src={customerImg} alt="Para o seu cliente" className="w-full h-72 object-cover group-hover:scale-105 transition-smooth" loading="lazy" width={1024} height={1024} />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-background">
              <h3 className="font-display text-3xl font-black mb-2">Para o seu cliente</h3>
              <p className="text-background/90">Pedido fácil, sem app, com acompanhamento em tempo real.</p>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {funcs.map((f, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary hover:shadow-card transition-smooth flex gap-4"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-accent text-primary flex items-center justify-center">
                <f.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base mb-1 leading-tight">{f.title}</h4>
                <p className="text-sm text-muted-foreground leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
