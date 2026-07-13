import { LayoutGrid, Clock3, ClipboardList, Truck, Gauge, Wallet } from "lucide-react";
import { MotionSection, MotionText, MotionStagger, MotionStaggerItem } from "@/components/motion";

/**
 * Benefícios Qualitativos — substitui a antiga seção "Depoimentos".
 *
 * Auditoria (Onda 3): os depoimentos anteriores citavam pessoas, restaurantes
 * e métricas sem lastro verificável. Foram removidos por completo. Enquanto
 * não houver casos autorizados e assinados, esta seção comunica benefícios
 * qualitativos reais da plataforma, sem números fabricados nem prova social
 * fictícia.
 *
 * Se e quando existirem casos reais autorizados, esta seção pode voltar a
 * ser `Depoimentos` — mas cada depoimento precisa ter autorização escrita,
 * identificação verdadeira e dados verificáveis.
 */
const beneficios = [
  {
    icon: LayoutGrid,
    title: "Operação centralizada",
    desc: "Salão, mesas, balcão, retirada e delivery em um único painel — sem alternar entre ferramentas.",
  },
  {
    icon: Clock3,
    title: "Menos retrabalho",
    desc: "Pedidos entram uma única vez e seguem para cozinha, caixa e entrega automaticamente.",
  },
  {
    icon: ClipboardList,
    title: "Acompanhamento claro",
    desc: "Cada pedido tem um status visível para equipe e cliente, do recebimento à entrega.",
  },
  {
    icon: Truck,
    title: "Salão e delivery no mesmo fluxo",
    desc: "Comandas, mesas e entregas convivem sem misturar filas, prioridades ou cobranças.",
  },
  {
    icon: Gauge,
    title: "Visão diária da operação",
    desc: "Volume por canal, tempo de preparo e ticket médio disponíveis assim que fecham no caixa.",
  },
  {
    icon: Wallet,
    title: "Pedidos e caixa em um só lugar",
    desc: "Fechamento diário integrado ao histórico de pedidos, sem planilhas paralelas.",
  },
];

export function Depoimentos() {
  return (
    <MotionSection
      id="beneficios"
      className="relative bg-background py-24 md:py-32 overflow-hidden"
      aria-label="Benefícios de usar a Mesivo"
    >
      <div className="container mx-auto px-6 relative">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-2 w-2 rounded-full bg-brand-orange" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink/60">
              04 — Por que Mesivo
            </span>
          </div>
          <MotionText
            as="h2"
            className="font-display text-ink uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(2.25rem,6vw,5rem)]"
            ariaLabel="Uma plataforma pensada para a rotina real do restaurante"
            lines={[
              <>Uma plataforma</>,
              <>pensada para a</>,
              <>
                <span className="text-gradient-sunset">rotina real</span> do restaurante.
              </>,
            ]}
          />
          <p className="mt-6 text-lg text-ink/70 max-w-2xl leading-relaxed">
            Benefícios que aparecem já nos primeiros dias de uso — sem prometer números que dependem
            do seu contexto.
          </p>
        </div>

        <MotionStagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {beneficios.map(({ icon: Icon, title, desc }) => (
            <MotionStaggerItem
              key={title}
              className="group rounded-2xl border-2 border-ink bg-card p-6 shadow-brutal transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-brutal-lg"
            >
              <div
                aria-hidden="true"
                className="w-11 h-11 grid place-items-center rounded-xl bg-brand-orange/15 border-2 border-ink text-brand-orange mb-4"
              >
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <h3 className="font-display text-xl md:text-2xl text-ink leading-tight tracking-tight">
                {title}
              </h3>
              <p className="mt-3 text-sm text-ink/70 leading-relaxed">{desc}</p>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>
    </MotionSection>
  );
}
