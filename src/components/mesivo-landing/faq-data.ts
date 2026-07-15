// Fonte única de verdade do FAQ da landing.
// Consumido pelo componente visual FAQMesivo e pelo JSON-LD FAQPage
// emitido em src/routes/index.tsx para garantir paridade 1:1.

export type FaqItem = { q: string; a: string };

export const mesivoFaq: readonly FaqItem[] = [
  {
    q: "Preciso pagar comissão por pedido?",
    a: "Não. Diferente de marketplaces, você paga uma mensalidade fixa. 100% do valor de cada pedido vai direto para o seu caixa.",
  },
  {
    q: "Quanto tempo leva para começar a receber pedidos?",
    a: "Você cadastra os produtos, define a área de entrega e já pode compartilhar o link do seu cardápio. Ferramentas de importação ajudam a acelerar o setup.",
  },
  {
    q: "Posso testar antes de pagar?",
    a: "Sim. Você tem 14 dias grátis com acesso completo, em qualquer plano, sem precisar cadastrar cartão de crédito.",
  },
  {
    q: "Os pedidos chegam por onde?",
    a: "Pelo painel Mesivo em tempo real, com aviso sonoro. Também é possível imprimir automaticamente em impressoras térmicas.",
  },
  {
    q: "Como funciona o pagamento online?",
    a: "Você integra sua conta Mercado Pago em poucos cliques. O cliente paga por Pix ou cartão e o valor cai direto na sua conta.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Não há fidelidade. Você cancela pelo painel a qualquer momento, sem multa.",
  },
] as const;
