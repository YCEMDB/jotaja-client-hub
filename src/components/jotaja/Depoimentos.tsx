import { Star, Quote } from "lucide-react";

type Tone = "orange" | "magenta" | "amber" | "violet" | "ink" | "card";
type Item = { quote: string; name: string; role: string; tone: Tone; size: "sm" | "md" | "lg" };

const items: Item[] = [
  {
    quote: "Saímos do iFood e em 3 meses dobramos o faturamento. O painel é simples e o suporte é rápido demais.",
    name: "Marcelo Andrade", role: "Burger House · SP",
    tone: "ink", size: "lg",
  },
  {
    quote: "Pix em 2s mudou meu fluxo de caixa.",
    name: "Camila Rocha", role: "Bella Pizza · RJ",
    tone: "orange", size: "sm",
  },
  {
    quote: "Migrei numa quarta. Sexta já tinha 40 pedidos pelo link próprio.",
    name: "Rafael Mendes", role: "Sabor & Cia · BH",
    tone: "amber", size: "md",
  },
  {
    quote: "Cardápio digital nota 1000. Cliente comenta como ficou bonito.",
    name: "Patrícia Lima", role: "Sushi do Bairro · POA",
    tone: "card", size: "sm",
  },
  {
    quote: "Os cupons aumentaram o ticket médio em 23%. Sério.",
    name: "Diego Albuquerque", role: "Empório Verde · Curitiba",
    tone: "magenta", size: "md",
  },
  {
    quote: "Finalmente meu CRM é meu. Não fico mais refém de quem segura meus dados de cliente.",
    name: "Fernanda Couto", role: "Pão & Cia · Salvador",
    tone: "violet", size: "md",
  },
];

const TONE: Record<Tone, string> = {
  orange: "bg-brand-orange text-ink",
  magenta: "bg-brand-magenta text-background",
  amber: "bg-brand-amber text-ink",
  violet: "bg-brand-violet text-background",
  ink: "bg-ink text-background",
  card: "bg-card text-ink",
};

const STAR_TONE: Record<Tone, string> = {
  orange: "text-ink",
  magenta: "text-brand-amber",
  amber: "text-brand-magenta",
  violet: "text-brand-amber",
  ink: "text-brand-orange",
  card: "text-brand-orange",
};

export function Depoimentos() {
  return (
    <section id="depoimentos" className="relative bg-background py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-end mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-brand-amber" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink/60">
                05 — Quem já fez a virada
              </span>
            </div>
            <h2 className="font-display text-ink uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(2.25rem,6vw,5rem)]">
              Restaurantes que
              <br />
              <span className="text-gradient-sunset">dispensaram</span>
              <br />
              o intermediário.
            </h2>
          </div>
          <div className="text-ink/60 max-w-md">
            <div className="flex gap-1 text-brand-orange mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <p className="text-sm font-semibold text-ink">
              4.9 de 5 — média entre +1.247 lojas ativas em 2026.
            </p>
            <p className="text-xs text-ink/50 mt-1">
              Avaliações coletadas pelo nosso onboarding pós-30-dias.
            </p>
          </div>
        </div>

        {/* Masonry */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:mb-5">
          {items.map((t, i) => (
            <figure
              key={i}
              className={`break-inside-avoid rounded-2xl border-2 border-ink p-6 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all relative ${TONE[t.tone]} ${
                t.size === "lg" ? "py-10" : t.size === "md" ? "py-7" : "py-6"
              }`}
            >
              <Quote className={`w-6 h-6 mb-3 ${STAR_TONE[t.tone]}`} fill="currentColor" />
              <blockquote
                className={`font-display tracking-tight leading-[1.05] ${
                  t.size === "lg" ? "text-2xl md:text-3xl" : t.size === "md" ? "text-xl md:text-2xl" : "text-lg"
                }`}
              >
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 pt-4 border-t-2 border-current/15">
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs opacity-70 font-medium">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
