import { createFileRoute } from "@tanstack/react-router";

const BASE = "https://comandahub.online";

const urls: { path: string; priority: number; changefreq: string }[] = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/glossario", priority: 0.8, changefreq: "monthly" },
  { path: "/sobre-a-comandahub", priority: 0.9, changefreq: "monthly" },
  { path: "/perguntas-frequentes", priority: 0.9, changefreq: "monthly" },
  { path: "/cardapio-digital", priority: 0.9, changefreq: "weekly" },
  { path: "/alternativa-ifood", priority: 0.9, changefreq: "weekly" },
  { path: "/blog", priority: 0.8, changefreq: "weekly" },
  { path: "/blog/sistema-de-pedidos-para-restaurante", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-fazer-cardapio-digital-whatsapp", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-criar-cardapio-digital-qr-code", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-fazer-cardapio-digital-gratis", priority: 0.7, changefreq: "monthly" },
  { path: "/blog/como-montar-cardapio-digital-canva-vs-plataforma", priority: 0.7, changefreq: "monthly" },
  // Soluções GEO
  { path: "/sistema-para-restaurantes", priority: 0.9, changefreq: "monthly" },
  { path: "/sistema-para-pizzarias", priority: 0.9, changefreq: "monthly" },
  { path: "/sistema-para-lanchonetes", priority: 0.9, changefreq: "monthly" },
  { path: "/sistema-para-acaiterias", priority: 0.8, changefreq: "monthly" },
  { path: "/sistema-para-bares", priority: 0.8, changefreq: "monthly" },
  { path: "/sistema-para-hamburguerias", priority: 0.9, changefreq: "monthly" },
  { path: "/sistema-para-delivery", priority: 0.9, changefreq: "monthly" },
  { path: "/sistema-de-comandas-digitais", priority: 0.9, changefreq: "monthly" },
  { path: "/controle-de-mesas", priority: 0.8, changefreq: "monthly" },
  { path: "/gestao-de-restaurantes", priority: 0.9, changefreq: "monthly" },
  // Comparativos
  { path: "/comparativo/comandahub-vs-goomer", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-anota-ai", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-saipos", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-planilha", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-caderno", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-comanda-de-papel", priority: 0.8, changefreq: "monthly" },
  { path: "/comparativo/comandahub-vs-controle-manual", priority: 0.8, changefreq: "monthly" },
  // Segmentos legados
  { path: "/segmentos/pizzaria", priority: 0.7, changefreq: "monthly" },
  { path: "/segmentos/hamburgueria", priority: 0.7, changefreq: "monthly" },
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
