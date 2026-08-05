import { MotionReveal } from "@/components/motion";

const passos = [
  { n: "01", t: "Cliente pede", d: "Cardápio digital no link único do seu restaurante — sem app pra baixar." },
  { n: "02", t: "Pedido entra", d: "Chega no painel, com aviso sonoro, cupom, forma de pagamento e endereço." },
  { n: "03", t: "Cozinha produz", d: "KDS mostra por etapa e por tempo. Nada de comanda perdida ou pedido dobrado." },
  { n: "04", t: "Saiu / entregue", d: "Status atualiza em tempo real pro cliente e pro seu caixa. Fim do dia fecha sozinho." },
];

export function FluxoPedidos() {
  return (
    <section id="como-funciona" className="py-40 bg-cream">
      <div className="max-w-[1440px] mx-auto px-8">
        <MotionReveal variant="fade" className="mb-24">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-copper mb-8 block">
            O Fluxo
          </span>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.9] tracking-[-0.05em] text-foreground mb-12">
            Um pedido entra. <br />Ele passa por <span className="italic font-serif text-deep-forest">quatro etapas</span>.
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed font-sans">
            Sem atravessar caderno nenhum. O Mesivo conecta cliente, painel, cozinha e caixa em um ritmo constante.
          </p>
        </MotionReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {passos.map((p, i) => (
            <MotionReveal key={p.n} variant="fade" delay={i * 0.1}>
              <div className="group p-10 bg-white border border-border rounded-[40px] h-full transition-editorial hover:shadow-lg">
                <div className="font-display text-5xl text-copper/20 mb-10 group-hover:text-copper transition-editorial">
                  {p.n}
                </div>
                <h3 className="font-display text-2xl text-foreground mb-4">
                  {p.t}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {p.d}
                </p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
