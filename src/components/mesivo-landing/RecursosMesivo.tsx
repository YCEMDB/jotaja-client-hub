import type { ReactNode } from "react";
import { MotionReveal } from "@/components/motion";
import { MockupPhoneCardapio } from "@/components/mesivo-mockups/MockupPhoneCardapio";
import { MockupMesas } from "@/components/mesivo-mockups/MockupMesas";
import { MockupKDS } from "@/components/mesivo-mockups/MockupKDS";
import { MockupCaixa } from "@/components/mesivo-mockups/MockupCaixa";

type Bloco = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  desc: string;
  bullets: string[];
  mockup: ReactNode;
  reverse?: boolean;
  bg?: string;
};

const blocos: Bloco[] = [
  {
    id: "cardapio",
    eyebrow: "Cardápio digital",
    title: (
      <>
        Um link, <span className="mesivo-accent">todo o cardápio</span>.
      </>
    ),
    desc: "Foto, descrição, adicional, tamanho, esgotado. O cliente pede pelo celular sem baixar app; você atualiza no painel e o cardápio muda na hora.",
    bullets: ["Categorias ilimitadas", "Adicionais e observações", "Esgotar item em 1 toque"],
    mockup: (
      <div
        style={{
          aspectRatio: "3 / 4",
          maxWidth: 320,
          marginInline: "auto",
          padding: 16,
          borderRadius: 28,
          background: "linear-gradient(160deg, var(--mesivo-peach), var(--mesivo-cream))",
          border: "1px solid var(--hairline)",
        }}
      >
        <MockupPhoneCardapio className="h-full w-full" />
      </div>
    ),
  },
  {
    id: "mesas",
    eyebrow: "Mesas e comandas",
    title: <>Cada mesa tem sua história.</>,
    desc: "Abre comanda, transfere pedido, divide conta, imprime só a parte de quem vai embora. Tudo sem cadernos e sem confusão no fechamento.",
    bullets: ["Transferência entre mesas", "Divisão de conta", "Impressão parcial"],
    mockup: <MockupMesas />,
    reverse: true,
    bg: "var(--mesivo-cream)",
  },
  {
    id: "cozinha",
    eyebrow: "Cozinha (KDS)",
    title: (
      <>
        Cozinha com <span className="mesivo-accent">ritmo próprio</span>.
      </>
    ),
    desc: "Pedidos aparecem por etapa (fritura, montagem, saída) com relógio por item. Sem comanda perdida, sem produção duplicada.",
    bullets: ["Etapas configuráveis", "Cronômetro por pedido", "Confirmação por toque"],
    mockup: <MockupKDS />,
  },
  {
    id: "caixa",
    eyebrow: "Caixa e financeiro",
    title: <>Fim do dia que fecha sozinho.</>,
    desc: "Abertura, sangrias, suprimentos, formas de pagamento e conferência. Relatório do turno gerado em 1 clique — pronto pra levar pra contabilidade.",
    bullets: ["Fechamento por turno", "Relatório PDF/CSV", "Conciliação por método"],
    mockup: <MockupCaixa />,
    reverse: true,
    bg: "var(--mesivo-cream)",
  },
];

export function RecursosMesivo() {
  return (
    <section id="recursos" aria-label="Recursos do Mesivo">
      {blocos.map((b) => (
        <div
          key={b.id}
          id={b.id}
          style={{
            paddingBlock: "clamp(64px, 8vw, 112px)",
            backgroundColor: b.bg ?? "var(--surface)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              marginInline: "auto",
              paddingInline: "clamp(16px, 4vw, 32px)",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "clamp(32px, 5vw, 56px)",
              alignItems: "center",
            }}
            className={b.reverse ? "md:grid-cols-[1fr_1.05fr]" : "md:grid-cols-[1.05fr_1fr]"}
          >
            <MotionReveal
              variant="fade"
              style={{ order: b.reverse ? 2 : 1 }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--mesivo-tomato)",
                }}
              >
                {b.eyebrow}
              </span>
              <h3
                style={{
                  marginTop: 12,
                  fontSize: "clamp(1.75rem, 3.2vw, 2.75rem)",
                  lineHeight: 1.05,
                  color: "var(--fg-hi)",
                }}
              >
                {b.title}
              </h3>
              <p style={{ marginTop: 16, color: "var(--fg-mid)", maxWidth: 520 }}>{b.desc}</p>
              <ul
                style={{
                  marginTop: 20,
                  display: "grid",
                  gap: 10,
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {b.bullets.map((x) => (
                  <li
                    key={x}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      color: "var(--fg-hi)",
                      fontSize: 15,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: "inline-flex",
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        backgroundColor: "var(--mesivo-tomato)",
                        color: "var(--mesivo-white)",
                        fontSize: 11,
                        fontWeight: 700,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✓
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </MotionReveal>

            <MotionReveal
              variant="up"
              delay={0.1}
              style={{ order: b.reverse ? 1 : 2 }}
            >
              <div
                style={{
                  padding: "clamp(16px, 2.5vw, 28px)",
                  borderRadius: 28,
                  border: "1px solid var(--hairline)",
                  backgroundColor: "var(--mesivo-warm-white)",
                  boxShadow: "0 30px 60px -40px color-mix(in oklab, var(--mesivo-coffee) 40%, transparent)",
                }}
              >
                {b.mockup}
              </div>
            </MotionReveal>
          </div>
        </div>
      ))}
    </section>
  );
}
