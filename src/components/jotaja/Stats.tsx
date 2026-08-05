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

      <Marquee
        className="py-10 md:py-14"
        speed={40}
        ariaLabel="Canais operacionais atendidos pela Mesivo"
      >
        {canais.map(({ label, icon: Icon }) => (
          <div key={label} className="inline-flex items-center gap-4 px-6 py-2 whitespace-nowrap group">
            <div
              aria-hidden="true"
              className="w-12 h-12 grid place-items-center rounded-xl bg-background/5 border border-background/10 text-brand-orange group-hover:bg-brand-orange group-hover:text-ink transition-all duration-300"
            >
              <Icon className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="font-display text-3xl md:text-4xl leading-none tracking-tight text-background/90 group-hover:text-background transition-colors">
              {label}
            </span>
            <span
              aria-hidden="true"
              className="ml-8 text-brand-orange/20 font-display text-3xl md:text-4xl"
            >
              ·
            </span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}
