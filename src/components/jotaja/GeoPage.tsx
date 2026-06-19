import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ContentLayout } from "./ContentLayout";

export interface GeoFAQ {
  q: string;
  a: string;
}

export interface GeoSection {
  heading: string;
  body: ReactNode;
}

export interface GeoHowToStep {
  name: string;
  text: string;
}

export interface GeoSource {
  label: string;
  url: string;
  publisher?: string;
}

export interface GeoComparisonTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface GeoPageProps {
  path: string;
  title: string;
  description: string;
  h1: string;
  quickAnswer: string;
  sections: GeoSection[];
  faqs: GeoFAQ[];
  breadcrumbs?: { name: string; path: string }[];
  schemaType?: "SoftwareApplication" | "Article" | "WebPage";
  related?: { label: string; to: string }[];
  /** Renderiza Service schema + bloco visível "Para quem é este serviço". */
  service?: { name: string; serviceType: string; audience?: string };
  /** Passo-a-passo (HowTo schema + lista visível). */
  howTo?: { name: string; description?: string; steps: GeoHowToStep[] };
  /** Tabela comparativa renderizada como <table> + estrutura visual. */
  comparisonTable?: GeoComparisonTable;
  /** Fontes externas (renderizadas como bloco "Fontes consultadas"). */
  sources?: GeoSource[];
  /** Data de criação do conteúdo. */
  datePublished?: string; // YYYY-MM-DD
  /** Data da última revisão (default: hoje). */
  dateModified?: string; // YYYY-MM-DD
}

const BASE = "https://comandahub.online";
const TODAY = new Date().toISOString().split("T")[0];
const DEFAULT_PUBLISHED = "2024-06-01";

const AUTHOR_NODE = {
  "@type": "Organization",
  "@id": `${BASE}/#equipe`,
  name: "Equipe ComandaHub",
  url: BASE,
};
const PUBLISHER_NODE = {
  "@type": "Organization",
  "@id": `${BASE}/#organization`,
  name: "ComandaHub",
  url: BASE,
  logo: { "@type": "ImageObject", url: `${BASE}/apple-touch-icon.png` },
};

export function buildGeoHead(props: GeoPageProps) {
  const {
    path,
    title,
    description,
    h1,
    quickAnswer,
    faqs,
    breadcrumbs = [],
    schemaType = "SoftwareApplication",
    service,
    howTo,
    datePublished = DEFAULT_PUBLISHED,
    dateModified = TODAY,
  } = props;

  const url = `${BASE}${path}`;
  const speakableCssSelector = ["#quick-answer", "#faq dt", "#faq dd"];

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${BASE}/` },
      ...breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: 2 + i,
        name: b.name,
        item: `${BASE}${b.path}`,
      })),
      {
        "@type": "ListItem",
        position: 2 + breadcrumbs.length,
        name: h1,
        item: url,
      },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-BR",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: "pt-BR",
    isPartOf: { "@id": `${BASE}/#website` },
    author: AUTHOR_NODE,
    publisher: PUBLISHER_NODE,
    reviewedBy: PUBLISHER_NODE,
    datePublished,
    dateModified,
    primaryImageOfPage: `${BASE}/og-comandahub.jpg`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: speakableCssSelector,
    },
  };

  const primary =
    schemaType === "SoftwareApplication"
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ComandaHub",
          applicationCategory: "BusinessApplication",
          applicationSubCategory: "Restaurant Management Software",
          operatingSystem: "Web, iOS, Android (PWA)",
          url,
          description: quickAnswer,
          inLanguage: "pt-BR",
          author: AUTHOR_NODE,
          publisher: PUBLISHER_NODE,
          datePublished,
          dateModified,
          offers: {
            "@type": "Offer",
            price: "99.00",
            priceCurrency: "BRL",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "99.00",
              priceCurrency: "BRL",
              referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
            },
          },
          provider: { "@id": `${BASE}/#organization` },
        }
      : {
          "@context": "https://schema.org",
          "@type": schemaType,
          headline: h1,
          description,
          url,
          inLanguage: "pt-BR",
          author: AUTHOR_NODE,
          publisher: PUBLISHER_NODE,
          datePublished,
          dateModified,
        };

  const scripts: { type: string; children: string }[] = [
    { type: "application/ld+json", children: JSON.stringify(webPage) },
    { type: "application/ld+json", children: JSON.stringify(primary) },
    { type: "application/ld+json", children: JSON.stringify(faqPage) },
    { type: "application/ld+json", children: JSON.stringify(breadcrumbList) },
  ];

  if (service) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.name,
        serviceType: service.serviceType,
        provider: { "@id": `${BASE}/#organization` },
        areaServed: { "@type": "Country", name: "Brazil" },
        audience: service.audience
          ? { "@type": "BusinessAudience", audienceType: service.audience }
          : undefined,
        url,
        offers: {
          "@type": "Offer",
          price: "99.00",
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          url: `${BASE}/auth`,
        },
      }),
    });
  }

  if (howTo) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: howTo.name,
        description: howTo.description ?? quickAnswer,
        inLanguage: "pt-BR",
        totalTime: "PT30M",
        step: howTo.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      }),
    });
  }

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: `${BASE}/og-comandahub.jpg` },
      { property: "article:published_time", content: datePublished },
      { property: "article:modified_time", content: dateModified },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${BASE}/og-comandahub.jpg` },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts,
  };
}

function ptDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function GeoPage(props: GeoPageProps) {
  const {
    h1,
    quickAnswer,
    sections,
    faqs,
    related,
    breadcrumbs = [],
    howTo,
    service,
    comparisonTable,
    sources,
    datePublished = DEFAULT_PUBLISHED,
    dateModified = TODAY,
  } = props;

  return (
    <ContentLayout width="wide">
      <nav aria-label="Trilha de navegação" className="not-prose mb-6 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link to="/" className="hover:text-foreground">Início</Link></li>
          {breadcrumbs.map((b) => (
            <li key={b.path} className="flex items-center gap-2">
              <span>/</span>
              <Link to={b.path} className="hover:text-foreground">{b.name}</Link>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span>/</span>
            <span className="text-foreground font-medium">{h1}</span>
          </li>
        </ol>
      </nav>

      <header>
        <h1>{h1}</h1>
        <p className="not-prose mt-2 text-xs text-muted-foreground" aria-label="Autoria e revisão">
          Por <strong>Equipe ComandaHub</strong> · Revisado pela ComandaHub ·{" "}
          <span>
            Publicado em <time dateTime={datePublished}>{ptDate(datePublished)}</time> ·
            Atualizado em <time dateTime={dateModified}>{ptDate(dateModified)}</time>
          </span>
        </p>
      </header>

      <aside
        id="quick-answer"
        aria-label="Resposta rápida"
        data-speakable="true"
        className="not-prose my-8 rounded-2xl border-2 border-ink bg-brand-amber/20 p-6 shadow-brutal"
      >
        <p className="text-xs font-display uppercase tracking-widest text-ink mb-2">
          Resposta rápida
        </p>
        <p className="text-base md:text-lg leading-relaxed text-ink">{quickAnswer}</p>
      </aside>

      <main>
        {sections.map((s, i) => (
          <section key={i}>
            <h2>{s.heading}</h2>
            {s.body}
          </section>
        ))}

        {howTo && (
          <section aria-label="Como funciona em passos">
            <h2>{howTo.name}</h2>
            {howTo.description && <p>{howTo.description}</p>}
            <ol>
              {howTo.steps.map((s, i) => (
                <li key={i}>
                  <strong>{s.name}.</strong> {s.text}
                </li>
              ))}
            </ol>
          </section>
        )}

        {service && (
          <section aria-label="Serviço">
            <h2>Para quem é este serviço</h2>
            <p>
              <strong>{service.name}</strong> — categoria{" "}
              <em>{service.serviceType}</em>
              {service.audience ? `. Público-alvo: ${service.audience}.` : "."} Disponível
              em todo o território nacional, com mensalidade fixa a partir de R$ 99/mês.
            </p>
          </section>
        )}

        {comparisonTable && (
          <section aria-label="Comparativo" className="not-prose my-8">
            <h2 className="font-display text-2xl md:text-3xl mb-4">Tabela comparativa</h2>
            <div className="overflow-x-auto rounded-2xl border-2 border-ink shadow-brutal">
              <table className="w-full text-sm">
                {comparisonTable.caption && (
                  <caption className="sr-only">{comparisonTable.caption}</caption>
                )}
                <thead className="bg-ink text-white">
                  <tr>
                    {comparisonTable.headers.map((h, i) => (
                      <th key={i} scope="col" className="text-left p-3 font-display uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.rows.map((row, ri) => (
                    <tr key={ri} className="border-t-2 border-ink/20 even:bg-brand-amber/10">
                      {row.map((cell, ci) => (
                        <td key={ci} className={`p-3 align-top ${ci === 0 ? "font-semibold" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section id="faq" aria-label="Perguntas frequentes">
          <h2>Perguntas frequentes</h2>
          <dl>
            {faqs.map((f, i) => (
              <article key={i} className="mb-6">
                <dt className="font-bold text-foreground text-lg">{f.q}</dt>
                <dd className="mt-1 text-muted-foreground">{f.a}</dd>
              </article>
            ))}
          </dl>
        </section>

        {sources && sources.length > 0 && (
          <section aria-label="Fontes consultadas">
            <h2>Fontes consultadas</h2>
            <ul>
              {sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer nofollow">
                    {s.label}
                  </a>
                  {s.publisher ? ` — ${s.publisher}` : null}
                </li>
              ))}
            </ul>
          </section>
        )}

        {related && related.length > 0 && (
          <section aria-label="Conteúdo relacionado">
            <h2>Veja também</h2>
            <ul>
              {related.map((r) => (
                <li key={r.to}><a href={r.to}>{r.label}</a></li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="Próximos passos" className="not-prose mt-12 rounded-2xl border-2 border-ink bg-gradient-sunset p-8 text-white shadow-brutal">
          <h2 className="font-display text-2xl md:text-3xl mb-3">Teste a ComandaHub grátis por 14 dias</h2>
          <p className="mb-6 text-white/90">Sem cartão de crédito. Sem comissão por pedido. Sem fidelidade.</p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-xl border-2 border-ink bg-white px-6 py-3 font-display text-ink shadow-brutal hover:translate-y-[2px] hover:shadow-none transition"
          >
            Começar agora
          </Link>
        </section>
      </main>
    </ContentLayout>
  );
}
