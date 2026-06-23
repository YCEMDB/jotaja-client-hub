import { createFileRoute } from "@tanstack/react-router";
import { ContentLayout } from "@/components/jotaja/ContentLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const URL = "https://comandahub.online/perguntas-frequentes";
const TITLE = "Perguntas Frequentes — Comandex";
const DESC = "50+ perguntas reais sobre a Comandex: planos, pagamento, cardápio, delivery, mesas, suporte e técnico. Tudo o que você precisa antes de começar.";

type FAQ = { q: string; aShort: string; aLong: string };
type Group = { title: string; items: FAQ[] };

const groups: Group[] = [
  {
    title: "Geral",
    items: [
      { q: "O que é a Comandex?", aShort: "Plataforma brasileira de cardápio digital, comandas e gestão de restaurantes.", aLong: "A Comandex centraliza pedidos (salão, delivery, retirada), mesas, comandas digitais, pagamento online e relatórios em um painel único, sem comissão por pedido." },
      { q: "Para quem a Comandex serve?", aShort: "Restaurantes, pizzarias, hamburguerias, lanchonetes, açaiterias, bares e dark kitchens.", aLong: "Qualquer operação que vende comida ou bebida por delivery, retirada ou consumo no salão. Funciona tanto para 1 unidade quanto para múltiplas lojas." },
      { q: "A Comandex é gratuita?", aShort: "Tem 14 dias grátis, depois R$ 99/mês fixo.", aLong: "Os 14 dias liberam todos os recursos do plano Pro sem precisar cadastrar cartão. Depois, planos a partir de R$ 99/mês, sem comissão por pedido." },
      { q: "Preciso instalar algum programa?", aShort: "Não. Funciona 100% no navegador.", aLong: "Painel e cardápio rodam direto no Chrome, Safari, Edge ou Firefox, no celular, tablet ou computador. Pode ser instalado como PWA na tela inicial." },
      { q: "Funciona no celular do garçom?", aShort: "Sim, totalmente.", aLong: "A interface é otimizada para celular, com botões grandes, fluxo curto e funciona em Android e iPhone." },
      { q: "Em quanto tempo começo a vender?", aShort: "Em média 30 minutos.", aLong: "Cadastro, personalização da loja (nome, cores, logo), cadastro do cardápio e o link já está pronto para compartilhar." },
      { q: "Tem fidelidade?", aShort: "Não. Cancele quando quiser.", aLong: "Sem multa, sem carência. Cancela direto no painel em Configurações > Plano." },
    ],
  },
  {
    title: "Pagamentos",
    items: [
      { q: "Quais formas de pagamento o cliente pode usar?", aShort: "PIX, cartão online (Mercado Pago) e pagamento na entrega.", aLong: "O dono escolhe no painel quais aceitar: PIX/cartão online via Mercado Pago, dinheiro, cartão na maquininha ou todos combinados." },
      { q: "A Comandex fica com parte do pagamento?", aShort: "Não. 100% do valor cai na sua conta.", aLong: "A Comandex cobra somente a mensalidade fixa. Tarifas do Mercado Pago (PIX e cartão) são as do próprio MP, sem markup nosso." },
      { q: "Em quanto tempo o PIX cai na conta?", aShort: "Em segundos.", aLong: "O Mercado Pago credita o PIX em segundos. O painel da Comandex mostra o pedido como pago automaticamente via webhook." },
      { q: "Como integro o Mercado Pago?", aShort: "Colando o Access Token no painel.", aLong: "Em Configurações > Pagamentos, cole o Access Token gerado na sua conta Mercado Pago. Tutorial em vídeo no onboarding." },
      { q: "Posso aceitar só pagamento na entrega?", aShort: "Sim.", aLong: "Você liga e desliga cada método (PIX online, cartão online, dinheiro na entrega, cartão na maquininha) independentemente no painel." },
      { q: "Tem taxa para o cliente final?", aShort: "Não pela Comandex.", aLong: "O cliente final não paga taxa para nossa plataforma. As tarifas de cartão/PIX são do Mercado Pago e ficam por sua conta." },
      { q: "Como pago a mensalidade da Comandex?", aShort: "Cartão de crédito ou PIX recorrente.", aLong: "Cobrança automática mensal pelo cartão cadastrado ou PIX recorrente. Você recebe boleto/NF por email." },
    ],
  },
  {
    title: "Cardápio",
    items: [
      { q: "Quantos produtos posso cadastrar?", aShort: "Ilimitado.", aLong: "Sem limite de produtos, categorias ou adicionais em qualquer plano." },
      { q: "Posso ter combos?", aShort: "Sim.", aLong: "Combos têm preço próprio (ex: burger + batata + bebida por R$ X), independente da soma dos itens." },
      { q: "Posso ter adicionais pagos?", aShort: "Sim, ilimitados.", aLong: "Por produto, você cadastra adicionais com preço (bacon, cheddar, borda recheada) e adicionais gratuitos com limite (escolha 3 acompanhamentos)." },
      { q: "Posso ter variação de tamanho (P/M/G)?", aShort: "Sim.", aLong: "Variações de tamanho com preço diferente, sem precisar duplicar o produto." },
      { q: "Posso esconder um produto sem deletar?", aShort: "Sim, basta desativar.", aLong: "Produto fica invisível para o cliente mas mantém o histórico de vendas no relatório." },
      { q: "Posso pausar a loja inteira?", aShort: "Sim, em 1 clique.", aLong: "Botão 'Loja fechada' no painel deixa o cardápio visível mas bloqueia novos pedidos com mensagem personalizável." },
      { q: "Tem horário por categoria?", aShort: "Sim.", aLong: "Cada categoria pode ter horário/dias de funcionamento (ex: café da manhã 7h-11h, jantar 18h-23h)." },
      { q: "Quantas fotos por produto?", aShort: "Uma, otimizada automaticamente.", aLong: "Foto é redimensionada e comprimida para carregar rápido no celular do cliente." },
      { q: "O time pode cadastrar o cardápio por mim?", aShort: "Sim, no onboarding.", aLong: "Envie PDF/foto do cardápio atual e o time da Comandex cadastra para você gratuitamente no plano Pro." },
    ],
  },
  {
    title: "Delivery e retirada",
    items: [
      { q: "A Comandex fornece entregadores?", aShort: "Não.", aLong: "Você usa sua própria equipe ou contrata terceiros (motoboys, uClub, Lalamove). A plataforma só gerencia o pedido." },
      { q: "Posso cobrar taxa por bairro?", aShort: "Sim.", aLong: "Cadastra-se a taxa por bairro, CEP ou raio em km. Cliente vê a taxa antes de confirmar o pedido." },
      { q: "Tem retirada no balcão?", aShort: "Sim.", aLong: "Cliente escolhe retirada e horário sugerido. O pedido entra na fila com flag de retirada." },
      { q: "O cliente acompanha o status?", aShort: "Sim, em tempo real.", aLong: "Status: recebido → preparando → saiu para entrega / pronto para retirada → entregue. Atualizado pelo painel a cada mudança." },
      { q: "Tem notificação por WhatsApp?", aShort: "Sim, no plano Pro.", aLong: "Cliente recebe link de acompanhamento por WhatsApp e atualizações de status." },
    ],
  },
  {
    title: "Mesas e comandas",
    items: [
      { q: "Como funciona o QR Code na mesa?", aShort: "Cada mesa tem um QR único.", aLong: "O sistema gera QR Code por mesa cadastrada. Cliente escaneia, pede pelo cardápio identificado àquela mesa, e o pedido entra na comanda dela." },
      { q: "Posso dividir a conta?", aShort: "Sim, na finalização.", aLong: "Divisão por número de pessoas (rachar igual) ou por item (cada um paga o que pediu)." },
      { q: "Tem login por garçom?", aShort: "Sim.", aLong: "Cada garçom tem login. Pedidos lançados ficam atribuídos a ele para relatório de comissão." },
      { q: "Posso transferir mesa?", aShort: "Sim.", aLong: "Cliente mudou de lugar? Em um clique transfere a comanda inteira para outra mesa, com histórico." },
      { q: "Posso unir mesas?", aShort: "Sim.", aLong: "Grupo grande? Une duas ou mais mesas em uma única comanda compartilhada." },
    ],
  },
  {
    title: "Painel e operação",
    items: [
      { q: "Como sei que chegou pedido novo?", aShort: "Som de alerta + notificação visual.", aLong: "Toque sonoro alto + flash visual no painel + (opcional) impressão térmica automática + notificação push se PWA instalado." },
      { q: "Posso imprimir pedido automaticamente?", aShort: "Sim, em impressoras térmicas.", aLong: "Compatível com impressoras térmicas 58mm e 80mm via app companion ou conexão direta USB/Bluetooth." },
      { q: "Posso recusar um pedido?", aShort: "Sim, com motivo.", aLong: "Recusa com motivo registrado (produto em falta, fora do horário, fora da área). Cliente é notificado." },
      { q: "Tem PDV para o salão?", aShort: "Sim, embutido.", aLong: "PDV para vendas no balcão sem QR, com pagamento na hora e impressão de comprovante." },
      { q: "Tem fechamento de caixa?", aShort: "Sim, automático.", aLong: "Relatório diário com total vendido, por forma de pagamento, por canal (salão/delivery/retirada), top produtos e ticket médio." },
      { q: "Quantos usuários posso ter?", aShort: "Ilimitados no Pro.", aLong: "Cadastra-se quantos garçons, caixas e gerentes precisar, com perfis de acesso diferentes." },
    ],
  },
  {
    title: "Marketing",
    items: [
      { q: "Posso criar cupons de desconto?", aShort: "Sim, ilimitados.", aLong: "Cupons com regras: valor mínimo de pedido, validade, uso único por cliente, primeira compra, percentual ou valor fixo." },
      { q: "Tem cashback?", aShort: "Em desenvolvimento.", aLong: "Cashback nativo entra no roadmap 2026. Hoje você pode simular com cupons recorrentes por cliente." },
      { q: "Tenho relatório de cliente recorrente?", aShort: "Sim, no plano Pro.", aLong: "Lista de top clientes (por valor, por frequência) com contato para campanhas direcionadas." },
      { q: "Integra com Google Analytics?", aShort: "Sim.", aLong: "Insere GA4 ID e/ou Meta Pixel no painel; eventos de pedido e checkout são enviados automaticamente." },
    ],
  },
  {
    title: "Suporte",
    items: [
      { q: "O suporte é humano?", aShort: "Sim, por WhatsApp.", aLong: "Atendimento humano em horário comercial estendido (8h-22h). Não usamos chatbot." },
      { q: "Tem treinamento?", aShort: "Sim.", aLong: "Vídeos curtos no onboarding e sessão 1:1 por videochamada na primeira semana." },
      { q: "Em quanto tempo o suporte responde?", aShort: "Em até 30 minutos no horário comercial.", aLong: "Mediana de resposta: 8 minutos. Casos urgentes (loja fora do ar) têm fila prioritária." },
    ],
  },
  {
    title: "Planos e cancelamento",
    items: [
      { q: "Quanto custa cada plano?", aShort: "A partir de R$ 99/mês.", aLong: "Plano Essencial (cardápio + painel + suporte) e Plano Pro (tudo + pagamento online + cupons + relatórios). Preços atualizados em /#planos." },
      { q: "Posso trocar de plano?", aShort: "Sim, a qualquer momento.", aLong: "Upgrade vale imediatamente. Downgrade entra no próximo ciclo de cobrança." },
      { q: "Como cancelo?", aShort: "Pelo painel.", aLong: "Configurações > Plano > Cancelar. Acesso fica ativo até o fim do ciclo pago." },
      { q: "Tem multa por cancelamento?", aShort: "Não.", aLong: "Sem fidelidade, sem multa, sem taxa de saída." },
    ],
  },
  {
    title: "Técnico e segurança",
    items: [
      { q: "Meus dados ficam seguros?", aShort: "Sim, conforme LGPD.", aLong: "Criptografia em trânsito (HTTPS) e em repouso. Backup diário automatizado. Conformidade LGPD documentada na política de privacidade." },
      { q: "A Comandex usa meus dados de clientes?", aShort: "Não.", aLong: "Os dados de clientes pertencem ao restaurante. Não vendemos, não compartilhamos com terceiros, não usamos para campanhas próprias." },
      { q: "Tem API?", aShort: "Webhooks sim, REST em desenvolvimento.", aLong: "Webhooks de pedido (novo, status alterado, pago) disponíveis no plano Pro sob demanda. API REST pública entra no roadmap 2026." },
      { q: "Tem app mobile?", aShort: "É PWA.", aLong: "O painel é Progressive Web App: adiciona à tela inicial do celular e funciona como app nativo, com notificação push." },
      { q: "Funciona offline?", aShort: "Não.", aLong: "Requer internet ativa. Quando a conexão cai, o painel avisa em tela e retoma sozinho ao reconectar." },
      { q: "Tem domínio próprio?", aShort: "URL personalizada inclusa.", aLong: "Cada restaurante tem comandahub.online/seu-slug. Domínio próprio (ex: pedido.suapizzaria.com.br) disponível no plano Pro." },
    ],
  },
];

const allFAQs = groups.flatMap((g) => g.items);

export const Route = createFileRoute("/perguntas-frequentes")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://comandahub.online/og-comandahub.jpg" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: allFAQs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: `${f.aShort} ${f.aLong}` },
          })),
        }),
      },
    ],
  }),
  component: FAQsPage,
});

function FAQsPage() {
  return (
    <ContentLayout width="wide">
      <header>
        <h1>Perguntas frequentes</h1>
        <p className="lead">
          {allFAQs.length} respostas reais sobre a Comandex — planos, pagamento, cardápio, delivery, mesas, suporte e técnico.
        </p>
      </header>

      <main>
        {groups.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h2>{g.title}</h2>
            <Accordion type="multiple" className="not-prose">
              {g.items.map((f, i) => (
                <AccordionItem key={i} value={`${g.title}-${i}`} className="border-b border-border">
                  <AccordionTrigger className="text-left text-base font-semibold py-4 hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <p className="font-semibold text-foreground mb-2">{f.aShort}</p>
                    <p className="text-muted-foreground leading-relaxed">{f.aLong}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </main>
    </ContentLayout>
  );
}
