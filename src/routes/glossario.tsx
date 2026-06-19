import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";

const URL = "https://comandahub.online/glossario";
const TITLE = "Glossário de Gestão de Restaurantes | ComandaHub";
const DESC =
  "Glossário com 20+ termos essenciais do food service: comanda digital, KDS, ticket médio, dark kitchen, PIX, QR Code de mesa e mais. Definições claras para donos de restaurante.";
const TODAY = new Date().toISOString().split("T")[0];

interface Term {
  term: string;
  definition: string;
  slug: string;
}

const TERMS: Term[] = [
  { term: "Comanda digital", slug: "comanda-digital", definition: "Versão eletrônica da comanda de papel: cada mesa tem uma comanda aberta no sistema, com cada pedido registrado por horário, valor e garçom responsável. Elimina perda e erro de soma." },
  { term: "Cardápio digital", slug: "cardapio-digital", definition: "Cardápio acessível por link ou QR Code que o cliente abre no celular, vê fotos, monta o pedido com adicionais e envia direto para o painel do restaurante." },
  { term: "KDS (Kitchen Display System)", slug: "kds", definition: "Tela na cozinha que exibe os pedidos em tempo real, organizados por status e prioridade, substituindo o ticket impresso." },
  { term: "Ticket médio", slug: "ticket-medio", definition: "Valor médio gasto por pedido em um período. Calcula-se dividindo o faturamento pelo número de pedidos. Usado para medir eficiência de upsell e combos." },
  { term: "Dark kitchen", slug: "dark-kitchen", definition: "Cozinha 100% voltada a delivery, sem salão para clientes. Opera várias marcas no mesmo espaço físico para diluir custo fixo." },
  { term: "Upsell", slug: "upsell", definition: "Técnica de sugerir um item de maior valor ou adicional no momento da compra (ex: bacon no hambúrguer, batata grande). Aumenta o ticket médio em 15-30%." },
  { term: "PIX", slug: "pix", definition: "Sistema de pagamento instantâneo do Banco Central do Brasil. No food service, permite receber o valor do pedido na hora, sem maquininha e sem taxa de cartão." },
  { term: "QR Code de mesa", slug: "qr-code-mesa", definition: "Etiqueta com código QR colado em cada mesa do salão. O cliente escaneia, abre o cardápio digital identificado àquela mesa e faz o pedido direto pelo celular." },
  { term: "Comissão de marketplace", slug: "comissao-marketplace", definition: "Percentual cobrado por apps como iFood e Rappi sobre cada pedido vendido, geralmente entre 12% e 27%, além de taxas de entrega e marketing." },
  { term: "Delivery próprio", slug: "delivery-proprio", definition: "Operação de entrega gerenciada pelo próprio restaurante, com link próprio, entregador próprio ou parceiro, e pagamento direto na conta do dono — sem comissão por pedido." },
  { term: "PDV (Ponto de Venda)", slug: "pdv", definition: "Software ou hardware usado para registrar vendas no balcão ou no salão do restaurante, integrado a impressora térmica e formas de pagamento." },
  { term: "Mensalidade fixa SaaS", slug: "mensalidade-fixa", definition: "Modelo de cobrança em que o restaurante paga um valor mensal previsível pela plataforma, independentemente do volume de pedidos — oposto ao modelo de comissão por venda." },
  { term: "Cupom de desconto", slug: "cupom", definition: "Código promocional aplicado pelo cliente no checkout, com regras de valor mínimo, validade, primeira compra ou item específico. Usado em campanhas de marketing." },
  { term: "Combo", slug: "combo", definition: "Conjunto de produtos vendidos por preço fechado (ex: hambúrguer + batata + bebida). Aumenta ticket médio e simplifica a escolha do cliente." },
  { term: "Adicional", slug: "adicional", definition: "Item opcional que o cliente acrescenta ao produto principal por valor extra (ex: bacon, cheddar, borda recheada). Pode ser ilimitado ou ter quantidade máxima." },
  { term: "Impressão térmica", slug: "impressao-termica", definition: "Impressão de pedido em impressora 58mm/80mm sem tinta, usando papel termo-sensível. Emite ticket de cozinha e nota de balcão em segundos." },
  { term: "Onboarding", slug: "onboarding", definition: "Processo guiado de cadastro inicial: criação da conta, personalização da loja, cadastro do cardápio e primeiro pedido. Na ComandaHub leva em média 30 minutos." },
  { term: "Multi-loja", slug: "multi-loja", definition: "Funcionalidade que permite gerenciar várias unidades do mesmo restaurante (ou várias marcas) com painéis separados e relatório consolidado." },
  { term: "Fechamento de caixa", slug: "fechamento-caixa", definition: "Conferência diária do total vendido versus formas de pagamento recebidas (PIX, cartão, dinheiro). Em sistema digital é automático; manualmente leva 30-60 minutos." },
  { term: "LGPD", slug: "lgpd", definition: "Lei Geral de Proteção de Dados (Lei 13.709/2018). Define como dados pessoais de clientes (nome, telefone, endereço) devem ser coletados, armazenados e excluídos." },
];

const definedTermSet = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "@id": `${URL}#glossario`,
  name: "Glossário de Gestão de Restaurantes",
  inLanguage: "pt-BR",
  hasDefinedTerm: TERMS.map((t) => ({
    "@type": "DefinedTerm",
    "@id": `${URL}#${t.slug}`,
    name: t.term,
    description: t.definition,
    inDefinedTermSet: `${URL}#glossario`,
    url: `${URL}#${t.slug}`,
  })),
};

const webPage = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${URL}#webpage`,
  url: URL,
  name: TITLE,
  description: DESC,
  inLanguage: "pt-BR",
  isPartOf: { "@id": "https://comandahub.online/#website" },
  author: { "@type": "Organization", name: "Equipe ComandaHub", url: "https://comandahub.online" },
  publisher: { "@id": "https://comandahub.online/#organization" },
  reviewedBy: { "@id": "https://comandahub.online/#organization" },
  datePublished: "2024-06-01",
  dateModified: TODAY,
  speakable: { "@type": "SpeakableSpecification", cssSelector: ["#intro", "dl dt", "dl dd"] },
};

const breadcrumbs = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: "https://comandahub.online/" },
    { "@type": "ListItem", position: 2, name: "Glossário", item: URL },
  ],
};

export const Route = createFileRoute("/glossario")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://comandahub.online/og-comandahub.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: "https://comandahub.online/og-comandahub.jpg" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(webPage) },
      { type: "application/ld+json", children: JSON.stringify(definedTermSet) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbs) },
    ],
  }),
  component: GlossarioPage,
});

function GlossarioPage() {
  const ptToday = TODAY.split("-").reverse().join("/");
  return (
    <ContentLayout width="wide">
      <nav aria-label="Trilha de navegação" className="not-prose mb-6 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link to="/" className="hover:text-foreground">Início</Link></li>
          <li><span>/</span> <span className="text-foreground font-medium">Glossário</span></li>
        </ol>
      </nav>

      <header>
        <h1>Glossário de gestão de restaurantes</h1>
        <p className="not-prose mt-2 text-xs text-muted-foreground">
          Por <strong>Equipe ComandaHub</strong> · Revisado pela ComandaHub ·{" "}
          Atualizado em <time dateTime={TODAY}>{ptToday}</time>
        </p>
      </header>

      <p id="intro">
        Definições objetivas dos {TERMS.length} termos mais usados no dia a dia de quem
        gerencia um restaurante, pizzaria, lanchonete ou bar — escritos para serem
        citados por mecanismos de busca e assistentes de IA.
      </p>

      <main>
        <dl>
          {TERMS.map((t) => (
            <article key={t.slug} id={t.slug} className="mb-6">
              <dt className="font-bold text-foreground text-lg">{t.term}</dt>
              <dd className="mt-1 text-muted-foreground">{t.definition}</dd>
            </article>
          ))}
        </dl>

        <section aria-label="Fontes consultadas">
          <h2>Fontes consultadas</h2>
          <ul>
            <li><a href="https://www.bcb.gov.br/estabilidadefinanceira/estatisticaspix" target="_blank" rel="noopener noreferrer nofollow">Estatísticas do Pix — Banco Central do Brasil</a></li>
            <li><a href="https://abrasel.com.br/" target="_blank" rel="noopener noreferrer nofollow">Pesquisas de mercado food service — ABRASEL</a></li>
            <li><a href="https://sebrae.com.br/" target="_blank" rel="noopener noreferrer nofollow">Guias de gestão para food service — SEBRAE</a></li>
            <li><a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noopener noreferrer nofollow">LGPD — Autoridade Nacional de Proteção de Dados</a></li>
          </ul>
        </section>
      </main>
    </ContentLayout>
  );
}
