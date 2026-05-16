import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";

interface ContentLayoutProps {
  children: ReactNode;
  /** Largura tipográfica do conteúdo principal */
  width?: "narrow" | "wide";
}

/**
 * Layout reutilizável para páginas de conteúdo (blog, pilares, landings de SEO,
 * comparativos e páginas de segmento). Mantém Header/Footer consistentes e
 * aplica tipografia legível para artigos longos.
 */
export function ContentLayout({ children, width = "narrow" }: ContentLayoutProps) {
  const maxW = width === "narrow" ? "max-w-3xl" : "max-w-5xl";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-6 py-12 md:py-20">
        <article
          className={`${maxW} mx-auto prose prose-neutral dark:prose-invert prose-headings:tracking-tight prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:font-bold prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-12 prose-h3:text-xl prose-a:text-primary hover:prose-a:underline prose-strong:text-foreground prose-table:text-sm`}
        >
          {children}
        </article>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
