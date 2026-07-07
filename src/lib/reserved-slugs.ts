// Slugs that conflict with system routes and cannot be used as restaurant slugs.
// IMPORTANT: When you add a new top-level route under src/routes/, also add it here
// so customers cannot pick a slug that collides with it.
export const RESERVED_SLUGS = new Set<string>([
  "admin",
  "auth",
  "login",
  "logout",
  "signup",
  "register",
  "api",
  "pedido",
  "loja",
  "mesa",
  "dashboard",
  "_authenticated",
  "assets",
  "static",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "og-comanda.jpg",
  "sobre",
  "precos",
  "planos",
  "contato",
  "termos",
  "privacidade",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}
