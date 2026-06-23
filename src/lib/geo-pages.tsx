import type { GeoFAQ, GeoPageProps, GeoSection } from "@/components/jotaja/GeoPage";

// Shared FAQs reusable across pages
export const COMMON_FAQS: GeoFAQ[] = [
  { q: "A Comandex cobra comissão por pedido?", a: "Não. Você paga apenas a mensalidade fixa. 100% do valor dos pedidos cai direto na sua conta." },
  { q: "Tem fidelidade ou multa por cancelamento?", a: "Não. Cancele quando quiser pelo painel, sem multa." },
  { q: "Quanto tempo leva para começar a usar?", a: "Em média 30 minutos: cadastro, personalização, cardápio e link no ar." },
  { q: "Funciona no celular?", a: "Sim. Painel e cardápio são 100% responsivos e funcionam como app (PWA)." },
  { q: "Como recebo o pagamento online?", a: "Via Mercado Pago. PIX cai em segundos e cartão em até 2 dias úteis na sua conta." },
  { q: "Quanto custa?", a: "Plano a partir de R$ 99/mês fixo. 14 dias grátis sem cartão." },
];

const baseFAQs = (extras: GeoFAQ[]): GeoFAQ[] => [...extras, ...COMMON_FAQS];

const list = (items: string[]) => (
  <ul>
    {items.map((i, idx) => (
      <li key={idx}>{i}</li>
    ))}
  </ul>
);

const paragraphs = (paras: string[]) => (
  <>
    {paras.map((p, i) => (
      <p key={i}>{p}</p>
    ))}
  </>
);

export const GEO_PAGES: Record<string, Omit<GeoPageProps, "schemaType">> = {
  "sistema-para-restaurantes": {
    path: "/sistema-para-restaurantes",
    title: "Sistema para Restaurantes — Comandas, Mesas e Delivery | Comandex",
    description: "Sistema completo para restaurantes: comandas digitais, controle de mesas via QR Code, delivery próprio, PIX e cartão. Mensalidade fixa, sem comissão.",
    h1: "Sistema para restaurantes",
    quickAnswer:
      "A Comandex é um sistema para restaurantes que reúne cardápio digital, comandas, controle de mesas via QR Code, pedidos delivery e pagamento online (PIX e cartão Mercado Pago) em um único painel em tempo real. Cobra mensalidade fixa a partir de R$ 99, sem comissão por pedido, e mantém o cliente como do restaurante. Funciona em qualquer celular, tablet ou computador, com 14 dias grátis sem cartão.",
    sections: [
      { heading: "O que o restaurante ganha", body: list([
        "Pedidos centralizados (salão, delivery, retirada e mesa) em um painel único.",
        "Som de alerta e impressão térmica automática para cada novo pedido.",
        "Cardápio digital sempre atualizado, com fotos e adicionais ilimitados.",
        "Relatórios diários de vendas, produtos mais pedidos e ticket médio.",
        "Cupons ilimitados para campanhas no Instagram e WhatsApp.",
      ]) },
      { heading: "Como funciona no dia a dia", body: paragraphs([
        "O restaurante cadastra produtos uma única vez. Cliente acessa o link próprio (comandahub.online/seu-restaurante), escolhe entrega, retirada ou consumo no salão, paga online ou na entrega, e o pedido aparece no painel com som de alerta.",
        "Garçom ou caixa confirma, cozinha produz e o cliente acompanha o status em tempo real. Ao final do dia, o sistema fecha o caixa automaticamente.",
      ]) },
      { heading: "Para que tipos de restaurante serve", body: list([
        "Restaurantes a la carte e por quilo",
        "Pizzarias, hamburguerias e cantinas",
        "Restaurantes japoneses e sushi delivery",
        "Marmitarias e dark kitchens",
        "Cozinhas escondidas e operações multi-marca",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Substitui meu sistema atual de PDV?", a: "Sim. Tem PDV embutido para vendas no salão sem QR." },
      { q: "Funciona offline?", a: "Não. Requer internet ativa, mas avisa quando a conexão cai." },
      { q: "Posso usar com várias unidades?", a: "Sim. Cada unidade tem painel e cardápio próprios; planos multi-loja sob consulta." },
    ]),
    breadcrumbs: [{ name: "Soluções", path: "/sistema-para-restaurantes" as const }].slice(0, 0),
    related: [
      { label: "Sistema de comandas digitais", to: "/sistema-de-comandas-digitais" },
      { label: "Controle de mesas com QR Code", to: "/controle-de-mesas" },
      { label: "Sistema para delivery", to: "/sistema-para-delivery" },
    ],
  },

  "sistema-para-pizzarias": {
    path: "/sistema-para-pizzarias",
    title: "Sistema para Pizzaria — Sabores, Bordas e Meio a Meio | Comandex",
    description: "Sistema para pizzaria com pizza meio a meio, bordas recheadas, combos família, delivery por bairro e pagamento PIX. Sem comissão por pedido.",
    h1: "Sistema para pizzarias",
    quickAnswer:
      "A Comandex é o sistema para pizzaria com suporte nativo a pizza meio a meio, bordas recheadas, combos família, bebidas e adicionais. Recebe pedidos por delivery, retirada e mesa (QR Code), aceita PIX e cartão pelo Mercado Pago, cobra taxa por bairro e organiza a fila de produção. Mensalidade fixa a partir de R$ 99, sem comissão por pedido.",
    sections: [
      { heading: "Recursos pensados para pizzaria", body: list([
        "Pizza meio a meio com regra de preço maior",
        "Bordas recheadas como adicional pago",
        "Combos família (pizza + refri + sobremesa)",
        "Cadastro de taxa por bairro / raio",
        "Fila de produção visível para o forneiro",
      ]) },
      { heading: "Pedidos por WhatsApp e Instagram", body: paragraphs([
        "Compartilhe o link comandahub.online/sua-pizzaria na bio do Instagram, no WhatsApp Business e em adesivos de QR Code nas caixas de pizza.",
        "Cada novo pedido toca um alerta no painel da pizzaria, evita anotação em caderno e elimina pizza errada por troca de pedido.",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Faz pizza meio a meio?", a: "Sim, com cálculo automático do sabor mais caro." },
      { q: "Tem borda recheada?", a: "Sim, como adicional configurável por sabor." },
      { q: "Aceita rodízio?", a: "Pelo cardápio digital sim, mas o controle de rodízio é melhor pelo PDV do salão." },
    ]),
    related: [
      { label: "Sistema para delivery", to: "/sistema-para-delivery" },
      { label: "Controle de mesas", to: "/controle-de-mesas" },
    ],
  },

  "sistema-para-lanchonetes": {
    path: "/sistema-para-lanchonetes",
    title: "Sistema para Lanchonete — Pedidos Rápidos e PIX | Comandex",
    description: "Sistema para lanchonete com pedidos por QR Code, delivery próprio, combos, lanches no balcão e PIX integrado. Mensalidade fixa, sem comissão.",
    h1: "Sistema para lanchonetes",
    quickAnswer:
      "A Comandex é um sistema para lanchonete que recebe pedidos por QR Code de mesa, balcão e delivery próprio, com combos, adicionais ilimitados, PIX e cartão. Painel em tempo real elimina pedido escrito em papel, reduz erros e libera o caixa para outras tarefas. Mensalidade fixa a partir de R$ 99, sem comissão por venda.",
    sections: [
      { heading: "Por que lanchonete precisa de sistema digital", body: paragraphs([
        "Em horário de pico, anotação manual gera erro de pedido, troco errado e fila parada. Um sistema digital corta esses pontos cegos.",
      ]) },
      { heading: "Recursos principais", body: list([
        "QR Code por mesa para autoatendimento",
        "Combos prontos (lanche + batata + bebida)",
        "Adicionais com preço (extra bacon, cheddar, molho)",
        "Pedido no balcão com PDV embutido",
        "Impressão térmica automática na cozinha",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Funciona em lanchonete de escola/escritório?", a: "Sim. O modo de pedido antecipado com horário de retirada é ideal para esse caso." },
      { q: "Tem fila de produção?", a: "Sim, organizada por status (recebido, preparando, pronto)." },
    ]),
    related: [
      { label: "Sistema para hamburguerias", to: "/sistema-para-hamburguerias" },
      { label: "Controle de mesas", to: "/controle-de-mesas" },
    ],
  },

  "sistema-para-acaiterias": {
    path: "/sistema-para-acaiterias",
    title: "Sistema para Açaiteria — Tamanhos, Acompanhamentos e PIX | Comandex",
    description: "Sistema para açaiteria com tamanhos (300/500/700ml), acompanhamentos ilimitados, delivery e pagamento PIX. Mensalidade fixa, sem comissão.",
    h1: "Sistema para açaiterias",
    quickAnswer:
      "A Comandex é o sistema para açaiteria com cadastro de tamanhos (300ml, 500ml, 700ml, 1L), acompanhamentos pagos e gratuitos, combos família, delivery por bairro e pagamento PIX. Painel mostra cada pedido em tempo real para o operador montar o copo correto sem erro. Mensalidade fixa a partir de R$ 99/mês.",
    sections: [
      { heading: "Por que açaiteria precisa de cardápio digital", body: paragraphs([
        "Açaí tem muita variação: tamanho, base (açaí puro, com banana, zero), e dezenas de complementos. Anotar isso na mão é fonte garantida de erro.",
        "Com o cardápio digital, o cliente seleciona tudo e o operador só monta.",
      ]) },
      { heading: "Recursos", body: list([
        "Cadastro de tamanhos como variação do mesmo produto",
        "Complementos gratuitos com limite (ex: escolha 3) e pagos extras",
        "Combos família (1L + 4 colheres)",
        "Cupons de fidelidade",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Tem limite de complementos grátis?", a: "Sim, configurável por produto (ex: 3 complementos grátis, R$ 2 cada extra)." },
      { q: "Funciona para sorveteria também?", a: "Sim, com a mesma lógica de tamanhos e sabores." },
    ]),
    related: [
      { label: "Sistema para lanchonetes", to: "/sistema-para-lanchonetes" },
    ],
  },

  "sistema-para-bares": {
    path: "/sistema-para-bares",
    title: "Sistema para Bar — Comanda Digital e Mesas | Comandex",
    description: "Sistema para bar com comanda digital por mesa, controle de garçons, fechamento dividido e PIX. Mensalidade fixa, sem comissão por pedido.",
    h1: "Sistema para bares",
    quickAnswer:
      "A Comandex é o sistema para bar com comanda digital por mesa via QR Code, lançamento por garçom (login individual), divisão de conta por pessoa, fechamento parcial e pagamento por PIX/cartão. Substitui comanda de papel, evita perda de pedido e dá relatório de produto mais vendido por turno. Mensalidade fixa a partir de R$ 99.",
    sections: [
      { heading: "Comanda digital substitui papel", body: paragraphs([
        "Comanda perdida = prejuízo direto. Com comanda digital, cada pedido fica registrado no nome da mesa e do garçom, com horário e valor.",
      ]) },
      { heading: "Recursos para bar", body: list([
        "QR Code por mesa para o próprio cliente pedir",
        "Login por garçom para controle de comissão",
        "Divisão de conta (rachar entre amigos)",
        "Fechamento parcial",
        "Relatório por turno e por garçom",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Tem comissão por garçom?", a: "Sim, calculada automaticamente sobre as vendas atribuídas ao login." },
      { q: "Aceita couvert artístico?", a: "Sim, como item adicional automático ao abrir mesa." },
    ]),
    related: [
      { label: "Controle de mesas", to: "/controle-de-mesas" },
      { label: "Sistema de comandas digitais", to: "/sistema-de-comandas-digitais" },
    ],
  },

  "sistema-para-hamburguerias": {
    path: "/sistema-para-hamburguerias",
    title: "Sistema para Hamburgueria — Combos, Ponto e Adicionais | Comandex",
    description: "Sistema para hamburgueria com combos, ponto da carne, adicionais ilimitados, delivery próprio e PIX. Sem comissão, mensalidade fixa.",
    h1: "Sistema para hamburguerias",
    quickAnswer:
      "A Comandex é o sistema para hamburgueria com combos (burger + batata + bebida), ponto da carne obrigatório, adicionais ilimitados (bacon, cheddar, molhos), upsell automático, delivery por bairro e PIX integrado. Aumenta ticket médio em 20-30% só com sugestão no fluxo. Mensalidade fixa a partir de R$ 99/mês.",
    sections: [
      { heading: "Recursos específicos", body: list([
        "Ponto da carne como campo obrigatório (mal, ao ponto, bem)",
        "Combos com preço de combo",
        "Adicionais ilimitados",
        "Upsell na finalização (\"Quer batata cheddar+bacon?\")",
        "Foto destacada (70% do cliente pede pela imagem)",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Posso ter combo só de fim de semana?", a: "Sim, com horário/dia da semana por categoria." },
    ]),
    related: [
      { label: "Sistema para delivery", to: "/sistema-para-delivery" },
      { label: "Cardápio digital", to: "/cardapio-digital" as const },
    ],
  },

  "sistema-para-delivery": {
    path: "/sistema-para-delivery",
    title: "Sistema para Delivery — Sem Comissão, Cliente Seu | Comandex",
    description: "Sistema de delivery próprio com taxa por bairro, PIX, cartão, link no Instagram e WhatsApp. Sem comissão por pedido. Cliente é seu, não do app.",
    h1: "Sistema para delivery",
    quickAnswer:
      "A Comandex é um sistema de delivery próprio para restaurantes, sem comissão por pedido. Você recebe pelo seu link (comandahub.online/sua-loja), cobra taxa por bairro/CEP/raio, aceita PIX e cartão online, e o cliente fica na sua base — não na do iFood. Mensalidade fixa a partir de R$ 99/mês, com 14 dias grátis.",
    sections: [
      { heading: "Por que delivery próprio é melhor", body: paragraphs([
        "Apps de marketplace cobram 12% a 27% por pedido e tornam o cliente refém da plataforma. Com delivery próprio, você paga mensalidade fixa, fica com 100% da venda e constrói relacionamento direto.",
      ]) },
      { heading: "Recursos de delivery", body: list([
        "Taxa por bairro, CEP ou raio em km",
        "Tempo médio de entrega visível para o cliente",
        "Status em tempo real (recebido → preparando → saiu → entregue)",
        "Notificação por WhatsApp ao cliente",
        "Cadastro de entregadores próprios",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "A Comandex fornece entregadores?", a: "Não. Você usa sua equipe própria ou contrata motoboys/uClub." },
      { q: "Tem rastreamento em tempo real?", a: "O cliente vê o status. GPS do entregador está em desenvolvimento." },
    ]),
    related: [
      { label: "Alternativa ao iFood", to: "/alternativa-ifood" as const },
      { label: "Sistema para pizzarias", to: "/sistema-para-pizzarias" },
    ],
  },

  "sistema-de-comandas-digitais": {
    path: "/sistema-de-comandas-digitais",
    title: "Sistema de Comandas Digitais para Restaurantes | Comandex",
    description: "Sistema de comanda digital com QR Code por mesa, lançamento por garçom, divisão de conta e fechamento por PIX. Substitui comanda de papel.",
    h1: "Sistema de comandas digitais",
    quickAnswer:
      "Um sistema de comandas digitais substitui o papel ou caderno por uma comanda eletrônica acessível por QR Code na mesa, pelo garçom ou pelo caixa. A Comandex registra cada pedido com horário, mesa e responsável, evita perda de comanda, permite fechamento parcial e divisão de conta, e aceita PIX/cartão no fechamento. Mensalidade fixa a partir de R$ 99/mês.",
    sections: [
      { heading: "O que é uma comanda digital", body: paragraphs([
        "Comanda digital é a versão eletrônica da comanda de papel: cada mesa tem uma comanda aberta no sistema, e cada pedido é lançado com timestamp, valor e responsável. Quando o cliente pede a conta, basta fechar com a forma de pagamento escolhida.",
      ]) },
      { heading: "Vantagens sobre comanda de papel", body: list([
        "Não some, não molha, não rasga",
        "Lançamento em segundos pelo celular do garçom",
        "Cliente pode pedir pelo QR sem chamar garçom",
        "Divisão de conta automática",
        "Relatório por garçom e por turno",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Preciso de tablet?", a: "Não. Funciona em qualquer smartphone do garçom." },
      { q: "Comanda digital é a mesma coisa que cardápio digital?", a: "Não. Cardápio digital é o que o cliente vê para pedir; comanda digital é o registro interno dos pedidos por mesa." },
    ]),
    related: [
      { label: "Controle de mesas", to: "/controle-de-mesas" },
      { label: "Comandex vs comanda de papel", to: "/comparativo/comandahub-vs-comanda-de-papel" as const },
    ],
  },

  "controle-de-mesas": {
    path: "/controle-de-mesas",
    title: "Controle de Mesas com QR Code para Restaurantes | Comandex",
    description: "Controle de mesas digital com QR Code, status em tempo real, divisão de conta, fechamento por PIX e relatório por mesa. Sem comissão.",
    h1: "Controle de mesas",
    quickAnswer:
      "O controle de mesas da Comandex atribui um QR Code único a cada mesa do salão. O cliente escaneia, pede direto pelo cardápio digital e os pedidos entram automaticamente na comanda daquela mesa. Garçom acompanha pelo painel, divide a conta ao fechar e recebe pagamento por PIX, cartão ou na maquininha. Mensalidade fixa a partir de R$ 99.",
    sections: [
      { heading: "Como funciona o QR Code na mesa", body: paragraphs([
        "Imprime-se um adesivo de QR para cada mesa. O cliente escaneia com a câmera do celular, abre o cardápio identificado àquela mesa e faz o pedido. Tudo cai no painel do restaurante com o número da mesa.",
      ]) },
      { heading: "Recursos de controle de mesa", body: list([
        "Status visual: livre / ocupada / aguardando conta / em pagamento",
        "Transferência de mesa (cliente mudou de lugar)",
        "União de mesas (grupo maior)",
        "Divisão de conta por pessoa",
        "Fechamento parcial",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Posso ter quantas mesas eu quiser?", a: "Sim, sem limite no plano Pro." },
      { q: "Como gero o QR Code?", a: "O sistema gera automaticamente para cada mesa cadastrada. É só imprimir." },
    ]),
    related: [
      { label: "Sistema de comandas digitais", to: "/sistema-de-comandas-digitais" },
    ],
  },

  "gestao-de-restaurantes": {
    path: "/gestao-de-restaurantes",
    title: "Gestão de Restaurantes — Sistema Completo | Comandex",
    description: "Software de gestão para restaurante: pedidos, mesas, delivery, financeiro, relatórios e cardápio em um único painel. Mensalidade fixa.",
    h1: "Gestão de restaurantes",
    quickAnswer:
      "Software de gestão de restaurantes que centraliza pedidos (salão, delivery, retirada), controle de mesas, financeiro diário, relatórios de vendas, cardápio digital e marketing (cupons) em um painel único. A Comandex elimina a dependência de planilhas Excel e cadernos, integrando todas as operações em tempo real. Mensalidade fixa a partir de R$ 99/mês, sem comissão por pedido.",
    sections: [
      { heading: "O que entra na gestão", body: list([
        "Pedidos (todos os canais)",
        "Cardápio e estoque básico",
        "Mesas e comandas",
        "Caixa e financeiro do dia",
        "Relatórios (vendas, top produtos, ticket médio)",
        "Cupons e clientes recorrentes",
        "Acessos por perfil (garçom, caixa, gerente)",
      ]) },
      { heading: "Substitui quais ferramentas", body: list([
        "Planilha Excel de pedidos",
        "Caderno de comandas",
        "WhatsApp como sistema de pedidos",
        "Cardápio impresso",
        "Anotação manual de fechamento de caixa",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Tem controle de estoque?", a: "Controle básico de produto ativo/inativo e ruptura. Estoque por insumo está no roadmap." },
      { q: "Emite nota fiscal?", a: "Integração com emissor NFC-e está em desenvolvimento; hoje exporta CSV para o contador." },
    ]),
    related: [
      { label: "Sistema para restaurantes", to: "/sistema-para-restaurantes" },
      { label: "Controle de mesas", to: "/controle-de-mesas" },
    ],
  },
};

// Pages de comparativo
export const COMPARISON_PAGES: Record<string, Omit<GeoPageProps, "schemaType">> = {
  "planilha": {
    path: "/comparativo/comandahub-vs-planilha",
    title: "Comandex vs Planilha Excel para Restaurante | Comandex",
    description: "Comparativo: Comandex vs planilha Excel para gestão de restaurante. Veja vantagens, limites e por que migrar de planilha para sistema digital.",
    h1: "Comandex vs planilha Excel",
    quickAnswer:
      "Planilha Excel funciona para um restaurante muito pequeno, mas falha em pedidos simultâneos, controle em tempo real e integração com pagamento. A Comandex substitui a planilha com painel ao vivo, pedidos centralizados, PIX integrado e relatórios automáticos — pelo preço de R$ 99/mês fixo, sem comissão por pedido.",
    sections: [
      { heading: "Onde a planilha falha", body: list([
        "Não atualiza em tempo real entre cozinha e caixa",
        "Erro humano no preenchimento",
        "Não tem alerta de pedido novo",
        "Não integra PIX/cartão",
        "Backup depende de você (perdeu o arquivo, perdeu o dia)",
      ]) },
      { heading: "Onde a Comandex ganha", body: list([
        "Pedidos em tempo real com som de alerta",
        "PIX integrado (cai na sua conta em segundos)",
        "Backup automático em nuvem",
        "Cardápio público que o cliente acessa por link",
        "Relatórios automáticos",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Eu importo minha planilha?", a: "Você pode enviar a planilha e o time da Comandex cadastra o cardápio para você no onboarding." },
    ]),
    breadcrumbs: [{ name: "Comparativos", path: "/comparativo/comandahub-vs-planilha" }].slice(0, 0),
  },

  "caderno": {
    path: "/comparativo/comandahub-vs-caderno",
    title: "Comandex vs Caderno de Pedidos | Comandex",
    description: "Comparativo: Comandex vs caderno de anotação. Veja por que caderno gera erros, perdas e por que migrar para sistema de comandas digitais.",
    h1: "Comandex vs caderno de pedidos",
    quickAnswer:
      "Anotar pedido em caderno é fonte garantida de erro, perda e retrabalho: letra ilegível, página rasgada, fechamento manual demorado. A Comandex substitui o caderno com comanda digital por mesa e por garçom, lançamento em segundos pelo celular e fechamento de caixa automático ao final do dia. R$ 99/mês fixo.",
    sections: [
      { heading: "Problemas do caderno", body: list([
        "Letra ilegível na cozinha = pedido errado",
        "Folha rasgada ou molhada = comanda perdida = prejuízo",
        "Fechamento de caixa manual demora 30-60min/dia",
        "Não dá relatório por garçom nem por produto",
        "Sem backup",
      ]) },
      { heading: "Como a Comandex resolve", body: list([
        "Pedido lançado no celular do garçom em segundos",
        "Cozinha vê o pedido em telão, sem letra ilegível",
        "Comanda digital não some",
        "Fechamento automático ao final do dia",
        "Relatório por garçom e produto",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Meu garçom não é bom de celular. Vai funcionar?", a: "Sim. A interface tem botões grandes, fluxo curto e treinamento em 15 minutos." },
    ]),
  },

  "comanda-de-papel": {
    path: "/comparativo/comandahub-vs-comanda-de-papel",
    title: "Comandex vs Comanda de Papel | Comandex",
    description: "Comparativo: Comandex vs comanda de papel. Veja por que comanda digital evita perdas, agiliza atendimento e reduz erros de fechamento.",
    h1: "Comandex vs comanda de papel",
    quickAnswer:
      "Comanda de papel some, molha, rasga e exige soma manual na hora de fechar. A comanda digital da Comandex é uma comanda eletrônica por mesa, atualizada em tempo real, com divisão automática de conta, fechamento por PIX e relatório por garçom e turno. R$ 99/mês fixo, sem comissão.",
    sections: [
      { heading: "Comparativo direto", body: list([
        "Perda de comanda: papel = comum / digital = impossível",
        "Soma de conta: papel = manual / digital = automática",
        "Divisão de conta: papel = manual / digital = automática",
        "Fechamento de caixa: papel = manual / digital = automático",
        "Relatório por garçom: papel = não / digital = sim",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Preciso comprar maquininha?", a: "Não. PIX e cartão online via Mercado Pago não exigem maquininha." },
    ]),
  },

  "controle-manual": {
    path: "/comparativo/comandahub-vs-controle-manual",
    title: "Comandex vs Controle Manual de Restaurante | Comandex",
    description: "Comparativo: Comandex vs controle manual (papel, caderno, planilha). Veja quanto tempo e dinheiro você perde com controle analógico.",
    h1: "Comandex vs controle manual",
    quickAnswer:
      "Controle manual (caderno + planilha + comanda de papel + WhatsApp solto) custa horas por dia e gera erro silencioso de caixa. A Comandex unifica pedidos, mesas, delivery e pagamento em um painel, com fechamento automático e relatório de vendas. Mensalidade fixa de R$ 99/mês, 14 dias grátis.",
    sections: [
      { heading: "Quanto tempo o controle manual consome", body: paragraphs([
        "Anotar pedido, soma de conta, troco, fechamento de caixa, conferência de PIX no celular do dono — em média 2 a 3 horas por dia em um restaurante pequeno.",
        "Com a Comandex esse trabalho cai para minutos: fechamento de caixa é automático, PIX bate sozinho e relatório sai pronto.",
      ]) },
    ],
    faqs: baseFAQs([
      { q: "Vale a pena para um restaurante muito pequeno?", a: "Sim. O ganho de tempo e a redução de erro pagam a mensalidade no primeiro mês." },
    ]),
  },
};

// =====================================================================
// Enriquecimento GEO: sources, datas, HowTo, Service, comparison tables
// Aplicado em runtime sobre os objetos exportados.
// =====================================================================

const COMMON_SOURCES = [
  { label: "Pesquisa Anual ABRASEL sobre custos operacionais em restaurantes", url: "https://abrasel.com.br/", publisher: "ABRASEL" },
  { label: "Pesquisa SEBRAE — Mercado de food service no Brasil", url: "https://sebrae.com.br/", publisher: "SEBRAE" },
  { label: "Banco Central do Brasil — Estatísticas do Pix", url: "https://www.bcb.gov.br/estabilidadefinanceira/estatisticaspix", publisher: "Banco Central do Brasil" },
];

const SEGMENT_SERVICE: Record<string, { name: string; serviceType: string; audience: string }> = {
  "sistema-para-restaurantes": { name: "Sistema para Restaurantes", serviceType: "Restaurant Management Software", audience: "Restaurantes" },
  "sistema-para-pizzarias": { name: "Sistema para Pizzarias", serviceType: "Pizzeria Management Software", audience: "Pizzarias" },
  "sistema-para-lanchonetes": { name: "Sistema para Lanchonetes", serviceType: "Snack Bar POS", audience: "Lanchonetes e cafeterias" },
  "sistema-para-acaiterias": { name: "Sistema para Açaiterias", serviceType: "Açaí Shop POS", audience: "Açaiterias e sorveterias" },
  "sistema-para-bares": { name: "Sistema para Bares", serviceType: "Bar Management Software", audience: "Bares, choperias e pubs" },
  "sistema-para-hamburguerias": { name: "Sistema para Hamburguerias", serviceType: "Burger Shop POS", audience: "Hamburguerias" },
  "sistema-para-delivery": { name: "Sistema de Delivery Próprio", serviceType: "Online Food Ordering", audience: "Restaurantes que fazem delivery" },
  "sistema-de-comandas-digitais": { name: "Sistema de Comandas Digitais", serviceType: "Digital Tab System", audience: "Bares e restaurantes" },
  "controle-de-mesas": { name: "Controle de Mesas com QR Code", serviceType: "Table Management", audience: "Restaurantes com salão" },
  "gestao-de-restaurantes": { name: "Gestão de Restaurantes", serviceType: "Restaurant ERP", audience: "Restaurantes de todos os portes" },
};

const HOWTO_STANDARD = {
  name: "Como começar a usar a Comandex em 4 passos",
  description: "Setup completo do cardápio digital ao primeiro pedido em até 30 minutos.",
  steps: [
    { name: "Cadastro gratuito", text: "Crie sua conta em comandahub.online/auth com email. Sem cartão de crédito, 14 dias grátis." },
    { name: "Personalize a loja", text: "Defina nome, cores, logo, horários de funcionamento e bairros atendidos." },
    { name: "Cadastre o cardápio", text: "Adicione categorias, produtos, fotos, preços, combos e adicionais. Importação assistida sob demanda." },
    { name: "Compartilhe o link", text: "Use comandahub.online/seu-restaurante na bio do Instagram, WhatsApp e QR Code da mesa. Os pedidos chegam no painel em tempo real." },
  ],
};

const SEGMENT_HOWTO_KEYS = [
  "sistema-para-restaurantes",
  "sistema-para-pizzarias",
  "sistema-para-delivery",
  "sistema-de-comandas-digitais",
  "controle-de-mesas",
  "gestao-de-restaurantes",
];

for (const key of Object.keys(GEO_PAGES)) {
  const entry = GEO_PAGES[key] as GeoPageProps;
  entry.datePublished = entry.datePublished ?? "2024-06-01";
  entry.dateModified = entry.dateModified ?? new Date().toISOString().split("T")[0];
  entry.sources = entry.sources ?? COMMON_SOURCES;
  if (SEGMENT_SERVICE[key]) entry.service = entry.service ?? SEGMENT_SERVICE[key];
  if (SEGMENT_HOWTO_KEYS.includes(key)) entry.howTo = entry.howTo ?? HOWTO_STANDARD;
}

// Tabelas comparativas reais (<table>) por comparativo.
const COMPARISON_TABLES: Record<string, GeoPageProps["comparisonTable"]> = {
  "planilha": {
    caption: "Comandex vs Planilha Excel",
    headers: ["Critério", "Planilha Excel", "Comandex"],
    rows: [
      ["Atualização em tempo real", "Não (manual)", "Sim, instantânea"],
      ["Alerta sonoro de pedido novo", "Não", "Sim"],
      ["Pagamento PIX / cartão integrado", "Não", "Sim (Mercado Pago)"],
      ["Backup automático em nuvem", "Não", "Sim, contínuo"],
      ["Cardápio público para o cliente", "Não", "Sim, link próprio"],
      ["Relatório de vendas automatizado", "Manual", "Automático"],
      ["Custo mensal", "R$ 0 (e horas de trabalho)", "R$ 99 fixo, sem comissão"],
    ],
  },
  "caderno": {
    caption: "Comandex vs Caderno de pedidos",
    headers: ["Critério", "Caderno", "Comandex"],
    rows: [
      ["Risco de pedido errado por letra ruim", "Alto", "Zero (registro digital)"],
      ["Perda de comanda", "Comum", "Impossível"],
      ["Tempo de fechamento de caixa", "30-60 min/dia", "Automático"],
      ["Relatório por garçom", "Não", "Sim"],
      ["Backup", "Inexistente", "Nuvem contínua"],
      ["Pagamento integrado", "Não", "PIX / cartão Mercado Pago"],
    ],
  },
  "comanda-de-papel": {
    caption: "Comandex vs Comanda de papel",
    headers: ["Critério", "Comanda de papel", "Comandex"],
    rows: [
      ["Perda de comanda", "Comum", "Impossível"],
      ["Soma da conta", "Manual", "Automática"],
      ["Divisão de conta entre clientes", "Manual", "Automática"],
      ["Fechamento de caixa", "Manual", "Automático"],
      ["Relatório por garçom / turno", "Não", "Sim"],
      ["Pagamento online", "Maquininha à parte", "PIX e cartão integrados"],
    ],
  },
  "controle-manual": {
    caption: "Comandex vs Controle manual (caderno + planilha + WhatsApp)",
    headers: ["Critério", "Controle manual", "Comandex"],
    rows: [
      ["Horas/dia consumidas", "2 a 3 horas", "Minutos"],
      ["Erro silencioso de caixa", "Frequente", "Zerado"],
      ["Pedidos centralizados", "Não (vários canais)", "Sim (painel único)"],
      ["Fechamento financeiro", "Manual", "Automático"],
      ["Relatórios de produto mais vendido", "Não", "Sim"],
      ["Backup de dados", "Você é responsável", "Nuvem contínua"],
    ],
  },
};

for (const key of Object.keys(COMPARISON_PAGES)) {
  const entry = COMPARISON_PAGES[key] as GeoPageProps;
  entry.datePublished = entry.datePublished ?? "2024-06-01";
  entry.dateModified = entry.dateModified ?? new Date().toISOString().split("T")[0];
  entry.sources = entry.sources ?? COMMON_SOURCES;
  if (COMPARISON_TABLES[key]) entry.comparisonTable = entry.comparisonTable ?? COMPARISON_TABLES[key];
}

