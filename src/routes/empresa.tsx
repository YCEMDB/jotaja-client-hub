import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/mesivo-shell";
import { Container } from "@/components/mesivo-ui";

const URL = "https://comandahub.online/empresa";
const TITLE = "Empresa — Mesivo";
const DESC =
  "Informações institucionais do Mesivo: razão social, propósito, equipe e como falar com o time comercial e de imprensa.";

export const Route = createFileRoute("/empresa")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Empresa,
});

function Empresa() {
  return (
    <PublicShell>
      <Container size="md" style={{ paddingBlock: "clamp(40px, 8vw, 80px)" }}>
        <article className="prose prose-neutral prose-headings:tracking-tight prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:font-bold prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-12 prose-a:text-primary hover:prose-a:underline">
          <h1>Empresa</h1>
          <p className="lead">
            Mesivo é uma plataforma de tecnologia para restaurantes brasileiros, focada em delivery
            próprio, cardápio digital e gestão de pedidos.
          </p>

          <h2>Quem somos</h2>
          <p>
            Um time pequeno e focado, formado por desenvolvedores, designers e gente que já
            trabalhou em operação de restaurante. Construímos a plataforma que gostaríamos de ter
            usado.
          </p>

          <h2>Para imprensa e parcerias</h2>
          <p>
            Para entrevistas, conteúdos colaborativos, integrações ou parcerias comerciais, fale com
            a gente pela página de <a href="/contato">contato</a>.
          </p>

          <h2>Trabalhe conosco</h2>
          <p>
            Estamos sempre abertos a conversar com gente boa. Mande um e-mail com seu currículo e um
            parágrafo contando por que faz sentido — respondemos todo mundo.
          </p>

          <h2>Endereço</h2>
          <p>
            Operamos de forma remota, com atendimento em todo o território nacional. O contato
            oficial é feito pelos canais digitais listados na página de{" "}
            <a href="/contato">contato</a>.
          </p>
        </article>
      </Container>
    </PublicShell>
  );
}
