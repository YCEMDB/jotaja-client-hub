import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

/**
 * MESIVO — Laboratório Tipográfico (dev-only)
 *
 * Rota isolada para comparar 4 sistemas tipográficos aplicados à
 * identidade da Mesivo. Não altera tokens de produção, não é linkada em
 * lugar nenhum, não entra em sitemap, é noindex e retorna 404 em builds
 * de produção. As fontes são carregadas somente quando esta rota está
 * montada (efeito de mount/unmount que injeta e remove os <link>).
 */

export const Route = createFileRoute("/dev/type-lab")({
  head: () => ({
    meta: [
      { title: "Mesivo — Laboratório Tipográfico (dev)" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: TypeLabPage,
});

// ---------- Sistemas tipográficos ----------

type System = {
  id: "A" | "B" | "C" | "D";
  label: string;
  tagline: string;
  display: string;
  ui: string;
  accent?: string;
  displayStack: string;
  uiStack: string;
  accentStack?: string;
  googleHref: string;
  weights: {
    display: number[];
    ui: number[];
    accent?: number[];
  };
  approxWoff2Kb: number; // transferência estimada (Latin) subset variável
  notes: string;
};

const SYSTEMS: System[] = [
  {
    id: "A",
    label: "Food-tech autoral",
    tagline: "Bricolage Grotesque + Manrope + Instrument Serif",
    display: "Bricolage Grotesque",
    ui: "Manrope",
    accent: "Instrument Serif",
    displayStack: `"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif`,
    uiStack: `"Manrope", ui-sans-serif, system-ui, sans-serif`,
    accentStack: `"Instrument Serif", ui-serif, Georgia, serif`,
    googleHref:
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap",
    weights: { display: [400, 500, 600, 700, 800], ui: [400, 500, 600, 700, 800], accent: [400] },
    approxWoff2Kb: 96,
    notes:
      "Personalidade forte, quente, autoral. Bricolage tem ‘g’ e ‘a’ com carácter editorial. Bom para food-tech premium.",
  },
  {
    id: "B",
    label: "Tecnológica",
    tagline: "Sora + Manrope",
    display: "Sora",
    ui: "Manrope",
    displayStack: `"Sora", ui-sans-serif, system-ui, sans-serif`,
    uiStack: `"Manrope", ui-sans-serif, system-ui, sans-serif`,
    googleHref:
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap",
    weights: { display: [400, 500, 600, 700, 800], ui: [400, 500, 600, 700, 800] },
    approxWoff2Kb: 78,
    notes:
      "Neutra, moderna, tecnológica. Menor personalidade, alta legibilidade. Segura, sem calor gastronômico.",
  },
  {
    id: "C",
    label: "Editorial contemporânea",
    tagline: "Instrument Sans + Instrument Serif",
    display: "Instrument Sans",
    ui: "Instrument Sans",
    accent: "Instrument Serif",
    displayStack: `"Instrument Sans", ui-sans-serif, system-ui, sans-serif`,
    uiStack: `"Instrument Sans", ui-sans-serif, system-ui, sans-serif`,
    accentStack: `"Instrument Serif", ui-serif, Georgia, serif`,
    googleHref:
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&display=swap",
    weights: { display: [400, 500, 600, 700], ui: [400, 500, 600, 700], accent: [400] },
    approxWoff2Kb: 72,
    notes:
      "Estética editorial (Substack/Vercel). Menos ‘brasileiro’, mais internacional. Boa para storytelling.",
  },
  {
    id: "D",
    label: "Segura e comercial",
    tagline: "Plus Jakarta Sans + Manrope",
    display: "Plus Jakarta Sans",
    ui: "Manrope",
    displayStack: `"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`,
    uiStack: `"Manrope", ui-sans-serif, system-ui, sans-serif`,
    googleHref:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap",
    weights: { display: [400, 500, 600, 700, 800], ui: [400, 500, 600, 700, 800] },
    approxWoff2Kb: 84,
    notes:
      "SaaS comercial, familiar. Alta conversão, baixa diferenciação. Escolha ‘segura’, pouco memorável.",
  },
];

// ---------- Textos reais da Mesivo ----------

const HEROES = [
  ["Controle o salão.", "Acelere cada pedido."],
  ["Seu restaurante inteiro,", "funcionando em fluxo."],
  ["O pedido entra.", "A Mesivo organiza."],
] as const;

const DESCRICAO =
  "Centralize pedidos, mesas, comandas, cardápio digital, caixa, cozinha, entregas e clientes em uma plataforma criada para a rotina real do seu restaurante.";

const SECOES = [
  "Toda a operação. Um único lugar.",
  "Menos improviso. Mais controle.",
  "Do pedido à entrega, acompanhe tudo.",
  "Seu cardápio pronto para vender.",
  "Mesas e comandas em tempo real.",
  "A cozinha no ritmo certo.",
];

const KPIS = [
  { label: "Faturamento hoje", value: "R$ 4.820,00" },
  { label: "Ticket médio", value: "R$ 62,10" },
  { label: "Pedidos em aberto", value: "78" },
  { label: "Tempo de preparo", value: "21 min" },
];

const BOTOES = ["Novo pedido", "Finalizar pedido", "Abrir caixa", "Confirmar entrega"];

const PORTUGUES = [
  "Gestão de restaurantes",
  "Informações da operação",
  "Configurações",
  "Acréscimos e observações",
  "Entrega e retirada",
  "Comissão",
  "Próximo à expiração",
];

// ---------- Escalas de teste ----------

const HERO_DESKTOP = [64, 80, 96] as const;
const HERO_MOBILE = [40, 46, 52] as const;
const SECAO_SIZES = [40, 52, 64] as const;
const CORPO_SIZES = [16, 18, 20] as const;
const UI_SIZES = [13, 14, 15, 16] as const;
const PESOS = [400, 500, 600, 700, 800] as const;

// ---------- Página ----------

function TypeLabPage() {
  const [active, setActive] = useState<System["id"]>("A");
  const [scale, setScale] = useState({
    heroDesktop: 80,
    heroMobile: 46,
    secao: 52,
    corpo: 18,
    ui: 14,
  });
  const [heroIdx, setHeroIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [noFonts, setNoFonts] = useState(false);

  const activeSystem = useMemo(() => SYSTEMS.find((s) => s.id === active)!, [active]);
  const systemsShown = showAll ? SYSTEMS : [activeSystem];

  // Injeta fontes SOMENTE enquanto a rota está montada.
  useEffect(() => {
    if (noFonts) return;
    const nodes: HTMLLinkElement[] = [];
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    document.head.appendChild(pre1);
    nodes.push(pre1);
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";
    document.head.appendChild(pre2);
    nodes.push(pre2);
    for (const sys of SYSTEMS) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = sys.googleHref;
      l.dataset.typeLab = sys.id;
      document.head.appendChild(l);
      nodes.push(l);
    }
    return () => {
      for (const n of nodes) n.remove();
    };
  }, [noFonts]);

  return (
    <div
      data-type-lab="root"
      style={{
        minHeight: "100dvh",
        background: "#faf7f2",
        color: "#1a1613",
        fontFamily: `"Manrope", ui-sans-serif, system-ui, sans-serif`,
      }}
    >
      <Controls
        systems={SYSTEMS}
        active={active}
        setActive={setActive}
        scale={scale}
        setScale={setScale}
        heroIdx={heroIdx}
        setHeroIdx={setHeroIdx}
        showAll={showAll}
        setShowAll={setShowAll}
        mobile={mobile}
        setMobile={setMobile}
        noFonts={noFonts}
        setNoFonts={setNoFonts}
      />

      <div style={{ padding: "24px", display: "grid", gap: "48px" }}>
        {systemsShown.map((sys) => (
          <SystemPreview
            key={sys.id}
            system={sys}
            scale={scale}
            heroIdx={heroIdx}
            mobile={mobile}
          />
        ))}

        <ScaleMatrix system={activeSystem} />
        <PerformanceTable systems={SYSTEMS} />
        <EvaluationTable />
      </div>
    </div>
  );
}

// ---------- Controles ----------

function Controls(props: {
  systems: System[];
  active: System["id"];
  setActive: (id: System["id"]) => void;
  scale: { heroDesktop: number; heroMobile: number; secao: number; corpo: number; ui: number };
  setScale: (s: {
    heroDesktop: number;
    heroMobile: number;
    secao: number;
    corpo: number;
    ui: number;
  }) => void;
  heroIdx: number;
  setHeroIdx: (n: number) => void;
  showAll: boolean;
  setShowAll: (b: boolean) => void;
  mobile: boolean;
  setMobile: (b: boolean) => void;
  noFonts: boolean;
  setNoFonts: (b: boolean) => void;
}) {
  const { scale, setScale } = props;
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(250,247,242,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(26,22,19,0.1)",
        padding: "16px 24px",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center",
        fontSize: "13px",
      }}
    >
      <strong style={{ letterSpacing: "-0.02em" }}>MESIVO · Type Lab</strong>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {props.systems.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => props.setActive(s.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(26,22,19,0.2)",
              background: props.active === s.id ? "#1a1613" : "transparent",
              color: props.active === s.id ? "#faf7f2" : "#1a1613",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {s.id} · {s.label}
          </button>
        ))}
      </div>
      <label>
        Hero&nbsp;
        <select value={props.heroIdx} onChange={(e) => props.setHeroIdx(Number(e.target.value))}>
          {HEROES.map((h, i) => (
            <option key={i} value={i}>
              {h.join(" / ")}
            </option>
          ))}
        </select>
      </label>
      <ScaleControl
        label="Hero desktop"
        value={scale.heroDesktop}
        opts={HERO_DESKTOP}
        onChange={(v) => setScale({ ...scale, heroDesktop: v })}
      />
      <ScaleControl
        label="Hero mobile"
        value={scale.heroMobile}
        opts={HERO_MOBILE}
        onChange={(v) => setScale({ ...scale, heroMobile: v })}
      />
      <ScaleControl
        label="Seção"
        value={scale.secao}
        opts={SECAO_SIZES}
        onChange={(v) => setScale({ ...scale, secao: v })}
      />
      <ScaleControl
        label="Corpo"
        value={scale.corpo}
        opts={CORPO_SIZES}
        onChange={(v) => setScale({ ...scale, corpo: v })}
      />
      <ScaleControl
        label="UI"
        value={scale.ui}
        opts={UI_SIZES}
        onChange={(v) => setScale({ ...scale, ui: v })}
      />
      <label style={{ display: "inline-flex", gap: "4px" }}>
        <input
          type="checkbox"
          checked={props.showAll}
          onChange={(e) => props.setShowAll(e.target.checked)}
        />
        Comparar todas
      </label>
      <label style={{ display: "inline-flex", gap: "4px" }}>
        <input
          type="checkbox"
          checked={props.mobile}
          onChange={(e) => props.setMobile(e.target.checked)}
        />
        Simular mobile 375
      </label>
      <label style={{ display: "inline-flex", gap: "4px" }}>
        <input
          type="checkbox"
          checked={props.noFonts}
          onChange={(e) => props.setNoFonts(e.target.checked)}
        />
        Fallback sem fontes
      </label>
    </header>
  );
}

function ScaleControl<T extends number>(props: {
  label: string;
  value: number;
  opts: readonly T[];
  onChange: (v: number) => void;
}) {
  return (
    <label>
      {props.label}&nbsp;
      <select value={props.value} onChange={(e) => props.onChange(Number(e.target.value))}>
        {props.opts.map((v) => (
          <option key={v} value={v}>
            {v}px
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------- Preview de um sistema ----------

function SystemPreview({
  system,
  scale,
  heroIdx,
  mobile,
}: {
  system: System;
  scale: { heroDesktop: number; heroMobile: number; secao: number; corpo: number; ui: number };
  heroIdx: number;
  mobile: boolean;
}) {
  const heroSize = mobile ? scale.heroMobile : scale.heroDesktop;
  const heroClamp = `clamp(${scale.heroMobile / 16}rem, 6vw + 1rem, ${heroSize / 16}rem)`;
  const secaoClamp = `clamp(1.75rem, 3vw + 1rem, ${scale.secao / 16}rem)`;
  const corpoRem = `${scale.corpo / 16}rem`;
  const uiRem = `${scale.ui / 16}rem`;

  const wrapStyle: React.CSSProperties = {
    fontFamily: system.uiStack,
    maxWidth: mobile ? 375 : undefined,
    margin: mobile ? "0 auto" : undefined,
    outline: "1px dashed rgba(26,22,19,0.15)",
    borderRadius: 24,
    background: "#faf7f2",
    padding: mobile ? "20px" : "48px",
    display: "grid",
    gap: "48px",
  };

  const hero = HEROES[heroIdx];

  return (
    <section data-system={system.id} style={wrapStyle}>
      <SystemHeader system={system} />

      {/* Hero */}
      <div>
        <MiniLabel text="Hero" />
        <h1
          style={{
            fontFamily: system.displayStack,
            fontWeight: 700,
            fontSize: heroClamp,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {hero[0]}
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #ff5b1f 0%, #ffb020 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {hero[1]}
          </span>
        </h1>
        <p
          style={{
            fontFamily: system.uiStack,
            fontSize: corpoRem,
            lineHeight: 1.55,
            maxWidth: "58ch",
            marginTop: "1.5rem",
            color: "rgba(26,22,19,0.75)",
          }}
        >
          {DESCRICAO}
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button
            style={{
              fontFamily: system.uiStack,
              fontSize: uiRem,
              fontWeight: 700,
              padding: "14px 22px",
              borderRadius: 14,
              background: "#1a1613",
              color: "#faf7f2",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Começar gratuitamente
          </button>
          <button
            style={{
              fontFamily: system.uiStack,
              fontSize: uiRem,
              fontWeight: 600,
              padding: "14px 22px",
              borderRadius: 14,
              background: "transparent",
              color: "#1a1613",
              border: "1.5px solid rgba(26,22,19,0.25)",
              cursor: "pointer",
            }}
          >
            Conhecer a plataforma
          </button>
        </div>
        {system.accentStack && (
          <p
            style={{
              fontFamily: system.accentStack,
              fontStyle: "italic",
              fontSize: `${scale.corpo * 1.4}px`,
              marginTop: "1.75rem",
              color: "#7a2f10",
            }}
          >
            “Feito para restaurantes que querem crescer sem perder o controle.”
          </p>
        )}
      </div>

      {/* Header/Nav */}
      <div>
        <MiniLabel text="Header + nav" />
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            padding: "14px 20px",
            border: "1px solid rgba(26,22,19,0.1)",
            borderRadius: 16,
            background: "#fff",
          }}
        >
          <strong
            style={{
              fontFamily: system.displayStack,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            mesivo
          </strong>
          <nav
            style={{
              display: "flex",
              gap: 20,
              fontSize: uiRem,
              fontWeight: 500,
              color: "rgba(26,22,19,0.75)",
              flexWrap: "wrap",
            }}
          >
            <span>Plataforma</span>
            <span>Planos</span>
            <span>Segmentos</span>
            <span>Blog</span>
            <span>Contato</span>
          </nav>
        </div>
      </div>

      {/* Título de seção + parágrafo longo */}
      <div>
        <MiniLabel text="Título + corpo" />
        <h2
          style={{
            fontFamily: system.displayStack,
            fontWeight: 700,
            fontSize: secaoClamp,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {SECOES[0]}
        </h2>
        <p
          style={{
            fontSize: corpoRem,
            lineHeight: 1.6,
            maxWidth: "65ch",
            marginTop: "1rem",
            color: "rgba(26,22,19,0.78)",
          }}
        >
          {DESCRICAO} {DESCRICAO}
        </p>
      </div>

      {/* Dashboard mockup + KPIs */}
      <div>
        <MiniLabel text="Dashboard · KPIs (dados demonstrativos)" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {KPIS.map((k) => (
            <div
              key={k.label}
              style={{
                padding: 16,
                borderRadius: 16,
                border: "1px solid rgba(26,22,19,0.1)",
                background: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgba(26,22,19,0.55)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {k.label}
              </div>
              <div
                style={{
                  fontFamily: system.displayStack,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: mobile ? "1.5rem" : "2rem",
                  fontWeight: 700,
                  marginTop: 6,
                  letterSpacing: "-0.02em",
                }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div>
        <MiniLabel text="Tabela operacional" />
        <div
          style={{
            border: "1px solid rgba(26,22,19,0.1)",
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: system.uiStack,
              fontSize: uiRem,
            }}
          >
            <thead>
              <tr style={{ background: "rgba(26,22,19,0.04)", textAlign: "left" }}>
                <th style={cellS}>Pedido</th>
                <th style={cellS}>Cliente</th>
                <th style={cellS}>Status</th>
                <th style={{ ...cellS, textAlign: "right" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["#0827", "Ana Souza", "Em preparo", "R$ 82,50"],
                ["#0828", "Carlos Mendes", "Pronto", "R$ 45,90"],
                ["#0829", "Luíza Gonçalves", "Entrega", "R$ 128,00"],
                ["#0830", "João da Silva", "Novo", "R$ 62,10"],
              ].map((row) => (
                <tr key={row[0]} style={{ borderTop: "1px solid rgba(26,22,19,0.06)" }}>
                  <td style={{ ...cellS, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                    {row[0]}
                  </td>
                  <td style={cellS}>{row[1]}</td>
                  <td style={cellS}>{row[2]}</td>
                  <td
                    style={{
                      ...cellS,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 600,
                    }}
                  >
                    {row[3]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDV */}
      <div>
        <MiniLabel text="PDV (Ponto de venda)" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr 260px",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(26,22,19,0.1)",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: corpoRem, marginBottom: 8 }}>Comanda #142</div>
            {[
              ["2× Hambúrguer Cheddar", "R$ 78,00"],
              ["1× Batata rústica", "R$ 22,00"],
              ["2× Refrigerante", "R$ 18,00"],
            ].map(([n, v]) => (
              <div
                key={n}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  fontSize: uiRem,
                  borderTop: "1px dashed rgba(26,22,19,0.1)",
                }}
              >
                <span>{n}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "#1a1613",
              color: "#faf7f2",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: "11px", opacity: 0.7, letterSpacing: "0.05em" }}>TOTAL</div>
            <div
              style={{
                fontFamily: system.displayStack,
                fontVariantNumeric: "tabular-nums",
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              R$ 118,00
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {BOTOES.map((b) => (
                <button
                  key={b}
                  style={{
                    fontFamily: system.uiStack,
                    fontSize: uiRem,
                    fontWeight: 600,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(250,247,242,0.2)",
                    background: "transparent",
                    color: "#faf7f2",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cardápio público */}
      <div>
        <MiniLabel text="Cardápio público" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: 12,
          }}
        >
          {[
            ["Hambúrguer Cheddar", "Pão brioche, blend 180g, cheddar", "R$ 39,00"],
            ["Pizza Marguerita", "Molho de tomate, muçarela, manjericão", "R$ 62,00"],
          ].map(([nome, desc, preco]) => (
            <div
              key={nome}
              style={{
                padding: 16,
                borderRadius: 16,
                border: "1px solid rgba(26,22,19,0.1)",
                background: "#fff",
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: corpoRem }}>{nome}</div>
              <div style={{ fontSize: uiRem, color: "rgba(26,22,19,0.65)" }}>{desc}</div>
              <div
                style={{
                  fontFamily: system.displayStack,
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 700,
                  marginTop: 6,
                }}
              >
                {preco}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div>
        <MiniLabel text="Formulário" />
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(26,22,19,0.1)",
            background: "#fff",
            maxWidth: 420,
          }}
        >
          <label style={{ fontSize: uiRem, fontWeight: 600 }}>
            Nome do restaurante
            <input
              placeholder="Ex.: Cantina do Zé"
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(26,22,19,0.15)",
                fontFamily: system.uiStack,
                fontSize: uiRem,
              }}
            />
          </label>
          <label style={{ fontSize: uiRem, fontWeight: 600 }}>
            E-mail
            <input
              type="email"
              placeholder="voce@restaurante.com.br"
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(26,22,19,0.15)",
                fontFamily: system.uiStack,
                fontSize: uiRem,
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              padding: "12px",
              borderRadius: 10,
              background: "#ff5b1f",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontFamily: system.uiStack,
              fontSize: uiRem,
              cursor: "pointer",
            }}
          >
            Quero testar grátis
          </button>
        </form>
      </div>

      {/* FAQ + CTA */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div>
          <MiniLabel text="FAQ" />
          <div style={{ display: "grid", gap: 8 }}>
            {["Preciso de cartão de crédito?", "Funciona no meu tablet?", "Emite nota fiscal?"].map(
              (q) => (
                <div
                  key={q}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid rgba(26,22,19,0.1)",
                    borderRadius: 12,
                    background: "#fff",
                    fontWeight: 600,
                    fontSize: corpoRem,
                  }}
                >
                  {q}
                </div>
              ),
            )}
          </div>
        </div>
        <div>
          <MiniLabel text="CTA final" />
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: "linear-gradient(135deg, #ff5b1f 0%, #7a2f10 100%)",
              color: "#faf7f2",
            }}
          >
            <div
              style={{
                fontFamily: system.displayStack,
                fontSize: `${scale.secao * 0.7}px`,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Pronto para acelerar seu restaurante?
            </div>
            <p style={{ fontSize: corpoRem, opacity: 0.9, marginTop: 8 }}>
              14 dias grátis. Sem cartão de crédito.
            </p>
            <button
              style={{
                marginTop: 12,
                padding: "12px 20px",
                borderRadius: 12,
                background: "#faf7f2",
                color: "#1a1613",
                border: "none",
                fontFamily: system.uiStack,
                fontSize: uiRem,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Começar agora
            </button>
          </div>
        </div>
      </div>

      {/* Português */}
      <div>
        <MiniLabel text="Português — acentos, cedilha, til, números" />
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4, fontSize: corpoRem }}>
          {PORTUGUES.map((t) => (
            <li key={t}>{t} — 12,5% · R$ 4.820,00 · #0827 · (Mesa 08) · até 100% de aumento</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const cellS: React.CSSProperties = { padding: "10px 12px" };

function SystemHeader({ system }: { system: System }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "baseline",
        flexWrap: "wrap",
        padding: "8px 12px",
        borderRadius: 12,
        background: "rgba(26,22,19,0.05)",
      }}
    >
      <strong style={{ letterSpacing: "-0.01em" }}>Opção {system.id}</strong>
      <span style={{ fontSize: 13, opacity: 0.75 }}>{system.tagline}</span>
      <span style={{ fontSize: 12, opacity: 0.6, marginLeft: "auto" }}>
        ~{system.approxWoff2Kb} kB WOFF2 (Latin, variável) · pesos:{" "}
        {[...system.weights.display, ...system.weights.ui].join(",")}
      </span>
    </div>
  );
}

function MiniLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(26,22,19,0.5)",
        marginBottom: 8,
      }}
    >
      {text}
    </div>
  );
}

// ---------- Matriz de escala ----------

function ScaleMatrix({ system }: { system: System }) {
  return (
    <section>
      <MiniLabel text={`Matriz de escala + pesos · Opção ${system.id}`} />
      <div
        style={{
          display: "grid",
          gap: 8,
          padding: 16,
          border: "1px solid rgba(26,22,19,0.1)",
          borderRadius: 16,
          background: "#fff",
        }}
      >
        {PESOS.map((w) => (
          <div key={w} style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 11, opacity: 0.6 }}>peso {w}</div>
            {[...HERO_DESKTOP, ...SECAO_SIZES].map((sz) => (
              <div
                key={`${w}-${sz}`}
                style={{
                  fontFamily: system.displayStack,
                  fontWeight: w,
                  fontSize: `${sz / 16}rem`,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                Mesivo · Ação · Ç ã õ â — {sz}px / {w}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Tabela de performance ----------

function PerformanceTable({ systems }: { systems: System[] }) {
  return (
    <section>
      <MiniLabel text="Performance estimada (WOFF2, subset Latin, font-display: swap)" />
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          border: "1px solid rgba(26,22,19,0.1)",
          borderRadius: 12,
          overflow: "hidden",
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ background: "rgba(26,22,19,0.04)", textAlign: "left" }}>
            <th style={cellS}>Opção</th>
            <th style={cellS}>Display</th>
            <th style={cellS}>UI</th>
            <th style={cellS}>Acento</th>
            <th style={cellS}>Pesos</th>
            <th style={cellS}>Formato</th>
            <th style={cellS}>Transferência (Latin)</th>
            <th style={cellS}>LCP impacto</th>
            <th style={cellS}>CLS</th>
          </tr>
        </thead>
        <tbody>
          {systems.map((s) => (
            <tr key={s.id} style={{ borderTop: "1px solid rgba(26,22,19,0.06)" }}>
              <td style={cellS}>
                <strong>{s.id}</strong> {s.label}
              </td>
              <td style={cellS}>{s.display}</td>
              <td style={cellS}>{s.ui}</td>
              <td style={cellS}>{s.accent ?? "—"}</td>
              <td style={cellS}>{[...s.weights.display, ...s.weights.ui].join(", ")}</td>
              <td style={cellS}>WOFF2 variável</td>
              <td style={cellS}>~{s.approxWoff2Kb} kB</td>
              <td style={cellS}>{s.approxWoff2Kb < 80 ? "Baixo" : "Médio"}</td>
              <td style={cellS}>Baixo (swap + size-adjust)</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ---------- Tabela de avaliação ----------

const AVAL = [
  { crit: "Personalidade", A: 9, B: 6, C: 8, D: 6 },
  { crit: "Legibilidade", A: 9, B: 9, C: 8, D: 9 },
  { crit: "Food-tech", A: 9, B: 7, C: 7, D: 6 },
  { crit: "Gastronomia", A: 9, B: 6, C: 8, D: 5 },
  { crit: "Tecnologia", A: 8, B: 9, C: 7, D: 8 },
  { crit: "Confiança", A: 8, B: 8, C: 8, D: 9 },
  { crit: "Conversão", A: 8, B: 8, C: 7, D: 9 },
  { crit: "Painel operacional", A: 8, B: 9, C: 7, D: 9 },
  { crit: "Mobile", A: 8, B: 9, C: 8, D: 9 },
  { crit: "Diferenciação", A: 9, B: 6, C: 8, D: 5 },
  { crit: "Performance", A: 7, B: 9, C: 9, D: 8 },
];

function EvaluationTable() {
  const totals = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of AVAL) {
    totals.A += r.A;
    totals.B += r.B;
    totals.C += r.C;
    totals.D += r.D;
  }
  return (
    <section>
      <MiniLabel text="Avaliação (1–10)" />
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          border: "1px solid rgba(26,22,19,0.1)",
          borderRadius: 12,
          overflow: "hidden",
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ background: "rgba(26,22,19,0.04)", textAlign: "left" }}>
            <th style={cellS}>Critério</th>
            <th style={cellS}>A · Bricolage+Manrope+Instrument</th>
            <th style={cellS}>B · Sora+Manrope</th>
            <th style={cellS}>C · Instrument Sans+Serif</th>
            <th style={cellS}>D · Plus Jakarta+Manrope</th>
          </tr>
        </thead>
        <tbody>
          {AVAL.map((r) => (
            <tr key={r.crit} style={{ borderTop: "1px solid rgba(26,22,19,0.06)" }}>
              <td style={cellS}>{r.crit}</td>
              <td style={cellS}>{r.A}</td>
              <td style={cellS}>{r.B}</td>
              <td style={cellS}>{r.C}</td>
              <td style={cellS}>{r.D}</td>
            </tr>
          ))}
          <tr style={{ borderTop: "1px solid rgba(26,22,19,0.15)", fontWeight: 700 }}>
            <td style={cellS}>Total</td>
            <td style={cellS}>{totals.A}</td>
            <td style={cellS}>{totals.B}</td>
            <td style={cellS}>{totals.C}</td>
            <td style={cellS}>{totals.D}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
        <strong>Recomendação:</strong> Opção A — Bricolage Grotesque (display) + Manrope (UI/corpo)
        + Instrument Serif (acento editorial, aparição única por viewport). É a única combinação que
        entrega personalidade food-tech autoral sem sacrificar legibilidade em português nem
        performance (~96 kB Latin variável, LCP baixo com <code>font-display:swap</code>e{" "}
        <code>size-adjust</code>). Bricolage tem calor gastronômico que Sora e Plus Jakarta não
        alcançam, e Manrope preserva os números tabulares do painel. Instrument Serif, restrita a
        marketing, dá uma nota editorial que reforça “restaurante” sem contaminar dados
        operacionais.
      </p>
    </section>
  );
}
