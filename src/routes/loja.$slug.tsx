import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect dos links antigos /loja/{slug} para a nova URL limpa /{slug}.
// Mantido apenas para que QR codes e links já compartilhados pelos
// restaurantes continuem funcionando.
export const Route = createFileRoute("/loja/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$slug", params: { slug: params.slug }, replace: true });
  },
});
