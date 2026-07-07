import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar novamente ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#2563EB" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "author", content: "Comandex" },
      { httpEquiv: "content-language", content: "pt-BR" },
      { name: "application-name", content: "Comandex" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Comandex" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "msapplication-TileColor", content: "#2563EB" },
      { name: "msapplication-TileImage", content: "/icon-144.png" },
      // Defaults — sobrescritos por cada rota
      { title: "Comandex · Delivery próprio sem comissão para restaurantes" },
      { name: "description", content: "Cardápio digital, pedidos online e gestão completa — com a sua marca, sem comissão por venda. Comece grátis." },
      { property: "og:site_name", content: "Comandex" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image:alt", content: "Comandex — Plataforma de delivery próprio para restaurantes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Hind:wght@300;400;500;600;700&display=swap" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=4" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png?v=4" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png?v=4" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=4" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "mask-icon", href: "/apple-touch-icon.png?v=3", color: "#ff6b35" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://comandahub.online/#organization",
              name: "Comandex",
              url: "https://comandahub.online",
              logo: "https://comandahub.online/apple-touch-icon.png",
              description: "Plataforma brasileira de cardápio digital, comandas e gestão para restaurantes. Mensalidade fixa, sem comissão.",
              areaServed: "BR",
              sameAs: ["https://comandahub.online"],
            },
            {
              "@type": "WebSite",
              "@id": "https://comandahub.online/#website",
              url: "https://comandahub.online",
              name: "Comandex",
              inLanguage: "pt-BR",
              publisher: { "@id": "https://comandahub.online/#organization" },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://comandahub.online/blog?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "SoftwareApplication",
              "@id": "https://comandahub.online/#software",
              name: "Comandex",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, iOS, Android (PWA)",
              url: "https://comandahub.online",
              inLanguage: "pt-BR",
              offers: { "@type": "Offer", price: "99.00", priceCurrency: "BRL" },
              aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "187" },
              provider: { "@id": "https://comandahub.online/#organization" },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
