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

export interface GeoPageProps {
  /** URL path, ex: "/sistema-para-restaurantes" */
  path: string;
  title: string;
  description: string;
  h1: string;
  /** Resposta direta entre 50-100 palavras, formato extraível por IA */
  quickAnswer: string;
  sections: GeoSection[];
  faqs: GeoFAQ[];
  /** Breadcrumbs além de Home → atual */
  breadcrumbs?: { name: string; path: string }[];
  /** Tipo do schema principal (default: SoftwareApplication) */
  schemaType?: "SoftwareApplication" | "Article" | "WebPage";
  /** Links relacionados no rodapé */
  related?: { label: string; to: string }[];
}

const BASE = "https://comandahub.online";

export function buildGeoHead({
  path,
  title,
  description,
  h1,
  quickAnswer,
  faqs,
  breadcrumbs = [],
  schemaType = "SoftwareApplication",
}: GeoPageProps) {
  const url = `${BASE}${path}`;

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
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "187",
          },
          provider: {
            "@type": "Organization",
            name: "ComandaHub",
            url: BASE,
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": schemaType,
          headline: h1,
          description,
          url,
          inLanguage: "pt-BR",
        };

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
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${BASE}/og-comandahub.jpg` },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(primary) },
      { type: "application/ld+json", children: JSON.stringify(faqPage) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbList) },
    ],
  };
}

export function GeoPage(props: GeoPageProps) {
  const { h1, quickAnswer, sections, faqs, related, breadcrumbs = [] } = props;

  return (
    <ContentLayout width="wide">
      <nav aria-label="Trilha de navegação" className="not-prose mb-6 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/" className="hover:text-foreground">
              Início
            </Link>
          </li>
          {breadcrumbs.map((b) => (
            <li key={b.path} className="flex items-center gap-2">
              <span>/</span>
              <Link to={b.path} className="hover:text-foreground">
                {b.name}
              </Link>
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
      </header>

      <aside
        aria-label="Resposta rápida"
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

        {related && related.length > 0 && (
          <section aria-label="Conteúdo relacionado">
            <h2>Veja também</h2>
            <ul>
              {related.map((r) => (
                <li key={r.to}>
                  <a href={r.to}>{r.label}</a>
                </li>
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
