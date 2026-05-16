import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://comandahub.online";

const urls: { path: string; priority: number; changefreq: string }[] = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/cardapio-digital", priority: 0.9, changefreq: "weekly" },
  { path: "/alternativa-ifood", priority: 0.9, changefreq: "weekly" },
  { path: "/blog", priority: 0.8, changefreq: "weekly" },
  { path: "/blog/sistema-de-pedidos-para-restaurante", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-fazer-cardapio-digital-whatsapp", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-criar-cardapio-digital-qr-code", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-fazer-cardapio-digital-gratis", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-montar-cardapio-digital-canva-vs-plataforma", priority: 0.7, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-goomer", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-anota-ai", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-saipos", priority: 0.8, changefreq: "monthly" },
  { path: "/segmentos/pizzaria", priority: 0.8, changefreq: "monthly" },
  { path: "/segmentos/hamburgueria", priority: 0.8, changefreq: "monthly" },
  { path: "/auth", priority: 0.5, changefreq: "yearly" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const today = new Date().toISOString().split("T")[0];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${BASE}${u.path}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority.toFixed(1)}</priority></url>`,
  )
  .join("\n")}
</urlset>`;
        return new Response(body, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
