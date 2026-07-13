import { Users, LayoutGrid, Store, ShoppingBag, Bike, QrCode } from "lucide-react";
import { Marquee } from "@/components/motion";

/**
 * Faixa de Operações — canais atendidos pela Mesivo.
 *
 * Substitui números de vendas / clientes sem lastro por uma faixa
 * horizontal contínua listando os canais reais da plataforma.
 * O texto de apoio contextualiza a proposta sem prometer volume.
 *
 * Acessibilidade:
 * - A `Marquee` duplica visualmente o conteúdo, mas a segunda cópia
 *   é `aria-hidden`, então leitores de tela leem cada canal uma única vez.
 * - Ícones são decorativos (aria-hidden) — o rótulo textual é suficiente.
 * - Em reduced motion a faixa vira estática com rolagem manual.
 */
const canais = [
  { label: "Salão", icon: Users },
  { label: "Mesas", icon: LayoutGrid },
  { label: "Balcão", icon: Store },
  { label: "Retirada", icon: ShoppingBag },
  { label: "Delivery", icon: Bike },
  { label: "Cardápio digital", icon: QrCode },
];

export function Stats() {
  return (
    <section
      aria-label="Canais atendidos pela Mesivo"
      className="relative bg-ink text-background border-y-[3px] border-ink overflow-hidden"
    >
      <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
      <div className="container mx-auto px-6 pt-8 pb-4 md:pt-10 md:pb-6 relative">
        <p className="text-center text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold text-background/70">
          Uma única plataforma para todos os canais do seu restaurante
        </p>
      </div>

      <Marquee
        className="pb-8 md:pb-10"
        speed={55}
        ariaLabel="Canais operacionais atendidos pela Mesivo"
      >
        {canais.map(({ label, icon: Icon }) => (
          <span key={label} className="inline-flex items-center gap-3 px-3 py-2 whitespace-nowrap">
            <span
              aria-hidden="true"
              className="w-9 h-9 grid place-items-center rounded-lg bg-background/10 border border-background/20 text-brand-orange"
            >
              <Icon className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-2xl md:text-3xl leading-none tracking-tight">
              {label}
            </span>
            <span
              aria-hidden="true"
              className="ml-4 text-background/25 font-display text-2xl md:text-3xl"
            >
              ·
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
