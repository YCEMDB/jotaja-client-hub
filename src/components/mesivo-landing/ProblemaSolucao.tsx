import { MotionReveal } from "@/components/motion";

const problemas = [
  "Pedido chega por WhatsApp, mesa por caderno, retirada por telefone.",
  "Cozinha só sabe do pedido quando o garçom lembra.",
  "Fechamento de caixa consome horas e nunca bate.",
  "Marketplaces cobram 20% de comissão e ficam com seu cliente.",
];

const solucoes = [
  "Todos os canais chegam no mesmo painel, em tempo real.",
  "Cozinha vê o pedido no KDS assim que ele entra.",
  "Caixa fecha em minutos, com relatório automático por turno.",
  "Você recebe direto no seu Pix ou conta, sem intermediário.",
];

export function ProblemaSolucao() {
  return (
    <section
      id="problema-solucao"
      aria-label="Antes e depois do Mesivo"
      style={{
        paddingBlock: "clamp(64px, 8vw, 120px)",
        backgroundColor: "var(--mesivo-cream)",
      }}
    >
      <div style={{ maxWidth: 1200, marginInline: "auto", paddingInline: "clamp(16px, 4vw, 32px)" }}>
        <MotionReveal variant="fade">
          <div style={{ maxWidth: 640, marginInline: "auto", textAlign: "center" }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--mesivo-tomato)",
              }}
            >
              O contraste
            </span>
            <h2
              style={{
                marginTop: 12,
                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                lineHeight: 1.02,
                color: "var(--fg-hi)",
              }}
            >
              A rotina real de um restaurante,{" "}
              <span className="mesivo-accent">antes e depois</span> do Mesivo.
            </h2>
          </div>
        </MotionReveal>

        <div
          className="mt-14 grid gap-6 md:grid-cols-2"
          style={{ marginTop: 48 }}
        >
          <MotionReveal variant="up">
            <Card
              tone="muted"
              label="Sem Mesivo"
              icon="—"
              items={problemas}
            />
          </MotionReveal>
          <MotionReveal variant="up" delay={0.1}>
            <Card
              tone="brand"
              label="Com Mesivo"
              icon="✓"
              items={solucoes}
            />
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}

function Card({
  tone,
  label,
  icon,
  items,
}: {
  tone: "muted" | "brand";
  label: string;
  icon: string;
  items: string[];
}) {
  const brand = tone === "brand";
  return (
    <div
      style={{
        borderRadius: 24,
        padding: "clamp(20px, 3vw, 32px)",
        border: brand ? "1px solid var(--mesivo-tomato)" : "1px solid var(--hairline)",
        backgroundColor: brand ? "var(--mesivo-warm-white)" : "color-mix(in oklab, var(--mesivo-cream) 60%, white 40%)",
        boxShadow: brand
          ? "0 20px 40px -24px color-mix(in oklab, var(--mesivo-tomato) 30%, transparent)"
          : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: brand ? "var(--mesivo-tomato)" : "var(--hairline)",
            color: brand ? "var(--mesivo-white)" : "var(--fg-mid)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {icon}
        </span>
        <strong
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: brand ? "var(--mesivo-tomato)" : "var(--fg-mid)",
          }}
        >
          {label}
        </strong>
      </div>
      <ul style={{ marginTop: 20, display: "grid", gap: 14, listStyle: "none", padding: 0 }}>
        {items.map((t) => (
          <li
            key={t}
            style={{
              fontSize: "clamp(0.95rem, 1.1vw, 1.05rem)",
              lineHeight: 1.5,
              color: brand ? "var(--fg-hi)" : "var(--fg-mid)",
            }}
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
