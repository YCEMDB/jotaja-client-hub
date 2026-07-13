import { createFileRoute } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

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
    <ContentLayout>
      <h1>Empresa</h1>
      <p className="lead">
        Mesivo é uma plataforma de tecnologia para restaurantes
        brasileiros, focada em delivery próprio, cardápio digital e gestão
        de pedidos.
      </p>

      <h2>Quem somos</h2>
      <p>
        Um time pequeno e focado, formado por desenvolvedores, designers e
        gente que já trabalhou em operação de restaurante. Construímos a
        plataforma que gostaríamos de ter usado.
      </p>

      <h2>Para imprensa e parcerias</h2>
      <p>
        Para entrevistas, conteúdos colaborativos, integrações ou parcerias
        comerciais, fale com a gente pela página de{" "}
        <a href="/contato">contato</a>.
      </p>

      <h2>Trabalhe conosco</h2>
      <p>
        Estamos sempre abertos a conversar com gente boa. Mande um e-mail
        com seu currículo e um parágrafo contando por que faz sentido —
        respondemos todo mundo.
      </p>

      <h2>Endereço</h2>
      <p>
        Operamos de forma remota, com atendimento em todo o território
        nacional. O contato oficial é feito pelos canais digitais listados
        na página de <a href="/contato">contato</a>.
      </p>
    </ContentLayout>
  );
}
