# Comanda — Plataforma de delivery próprio para restaurantes

Refazendo a plataforma com **identidade própria** (não copiando o nome Jotajá), mas replicando todas as 18 funcionalidades que você listou. Nome sugerido: **Comanda** (trocável por Pratto ou Sirva).

---

## 🎨 Nova identidade visual

**Paleta:**
- **Azul-noite profundo** (#0A1628 aprox.) — confiança, tecnologia, profissionalismo
- **Amarelo mostarda vibrante** (#FFC627 aprox.) — apetite, energia, calor humano (gatilho de fome 🟡)
- **Off-white cremoso** como fundo neutro (não branco puro — mais aconchegante)
- **Acentos em laranja queimado** pra CTAs secundários

**Tipografia:**
- **Plus Jakarta Sans** nos títulos (bold, moderna, redondinha — passa carinho)
- **Inter** no corpo (legibilidade impecável)

**Linguagem visual:**
- Cantos bem arredondados (16-24px) — sensação amigável
- Ilustrações + emojis sutis pra humanizar
- Sombras suaves coloridas (azul/amarelo) em vez de cinza
- Microanimações nos hovers (escala leve, brilho do amarelo)

**Gatilhos psicológicos** (estilo "quero pra mim agora"):
- **Prova social** logo no hero ("+2.500 restaurantes já usam")
- **Urgência leve** ("Mais de 80 restaurantes começaram esta semana")
- **Antes/depois visual** (caos sem Comanda → organização com Comanda)
- **Demonstração de valor** ("Zero comissão = +30% de margem")
- **Mockup do produto** visível desde o hero (screenshot do painel funcionando)
- **Depoimentos com fotos reais** de donos de restaurante
- **Garantia** ("Cancele quando quiser, sem fidelidade")

---

## Etapa A — Refatorar a landing page atual

A landing já está montada, mas em vermelho/Jotajá. Vou:

1. **Atualizar `src/styles.css`** — trocar paleta toda pra azul-noite + amarelo mostarda, novas fontes
2. **Substituir nome "Jotajá" por "Comanda"** em Header, Footer, meta tags
3. **Trocar logo** — gerar nova logo (ícone de ticket de comanda + raio amarelo)
4. **Hero reformulado** com:
   - Headline: "Seu delivery, sem comissão. Sua marca, seus clientes."
   - Mockup do painel administrativo ao lado (em vez de só formulário)
   - Badge de prova social ("+2.500 restaurantes")
   - 2 CTAs: "Testar grátis 14 dias" (primário amarelo) + "Ver demonstração" (vídeo)
5. **Nova seção "Como funciona"** em 3 passos visuais (cadastra → divulga link → recebe pedidos no WhatsApp)
6. **Vantagens** — manter as 6 mas com novos ícones/copy persuasivos
7. **Funcionalidades** — expandir pras 18 que você listou, agrupadas em 6 blocos visuais:
   - Cardápio digital + URL própria
   - Pedidos via WhatsApp
   - Gestão completa (cardápio, pedidos, cupons, agendamento, impressão)
   - Entregadores + áreas de entrega + pagamentos
   - CRM + relatórios + multiusuário + redes/franquias
   - Suporte humanizado + nuvem + zero comissão
8. **Nova seção "Segmentos"** com cards: hamburguerias, pizzarias, padarias, açaiterias, etc.
9. **Comparativo "Comanda vs iFood"** — tabela visual mostrando economia
10. **Calculadora de economia** simples ("Quanto você paga de comissão hoje? → Economia anual com Comanda: R$ X")
11. **Depoimentos** em carrossel com foto + nome + restaurante
12. **Pricing** em cards (3 planos: Essencial, Profissional, Rede/Franquia)
13. **FAQ** + **CTA final** + **Footer** atualizados

---

## Etapa B — Backend (Lovable Cloud)

Ativar Lovable Cloud + criar estrutura completa.

**Tabelas:**
- `restaurants` — loja (nome, slug, logo, banner, cores customizadas, endereço, horários por dia, área de entrega, status aberto/fechado, WhatsApp, integrações)
- `profiles` + `user_roles` (admin/operador/entregador, em tabela separada com `has_role()` SECURITY DEFINER)
- `categories` — categorias do cardápio (com ordem)
- `products` — pratos (foto, descrição, preço, categoria, disponibilidade por dia/horário, status "em falta", preço dinâmico)
- `product_options` — adicionais, variações, combos (ex: borda da pizza, tamanho, sabores)
- `delivery_areas` — bairros/regiões com taxa fixa ou percentual
- `delivery_drivers` — entregadores da equipe própria
- `customers` — base de clientes (CRM: nome, telefone, endereços salvos, histórico)
- `orders` — pedidos (status, itens, pagamento, entregador atribuído, agendamento)
- `order_items` — itens com adicionais selecionados
- `coupons` — cupons (valor/percentual, validade, valor mínimo, limite de uso, link automático)
- `printers` — impressoras configuradas (caixa/cozinha)

**Auth:** Email/senha + Google sign-in pra donos de restaurante. Cliente final NÃO faz login (só na finalização).

**Storage:** fotos de produtos, logos, banners.

**Real-time:** pedidos novos chegam ao admin instantaneamente, cliente vê status atualizando.

**RLS:** cada restaurante só acessa seus próprios dados.

---

## Etapa C — Painel Administrativo (`/admin`)

Layout: sidebar azul-noite à esquerda + header com toggle "Loja aberta/fechada" e nome do restaurante.

**Páginas:**
- **Dashboard** — pedidos do dia, faturamento, ticket médio, gráficos (vendas por dia/hora), mapa de calor de pedidos por bairro, clientes recorrentes
- **Pedidos** (real-time) — kanban com colunas (Novo → Em preparo → Saiu pra entrega → Entregue), notificação sonora + visual em pedido novo, botão imprimir, botão atualizar status no WhatsApp do cliente
- **Cardápio** — CRUD de categorias e produtos, upload de foto, configurar adicionais/variações/combos, disponibilidade por dia/horário, marcar "em falta", preço dinâmico, drag-and-drop pra reordenar
- **Cupons** — criar/listar cupons (valor/%, validade, valor mínimo, link com cupom auto-aplicado)
- **Agendamentos** — pedidos agendados pra data/hora futura
- **Clientes (CRM)** — base completa, filtros, histórico por cliente, exportar CSV
- **Entregadores** — cadastrar motoboys, atribuir pedidos, relatórios por entregador
- **Áreas de entrega** — desenhar bairros, definir taxas (fixa ou %), pedido mínimo por área
- **Pagamentos** — configurar formas aceitas (cartão, PIX, vale-refeição, dinheiro, online)
- **Impressoras** — configurar impressão automática no caixa/cozinha
- **Relatórios** — vendas totais, por produto, por entregador, exportar Excel/CSV
- **Configurações da loja** — dados, logo, banner, cores do portal do cliente, URL personalizada (slug), horários, redes sociais, integrações
- **Usuários** — convidar admin/operador/entregador
- **Plano e cobrança** — plano atual, faturamento, sem comissão (mensalidade fixa)

---

## Etapa D — Portal do Cliente (`/loja/[slug]`)

URL pública mobile-first (ex: `comanda.app/loja/pizzaria-do-ze`).

- **Cardápio** — banner do restaurante, status (aberto/fechado), busca, categorias com scroll horizontal sticky, cards de produtos
- **Detalhe do produto** (drawer) — foto grande, escolher adicionais/variações/combos, quantidade, observação
- **Carrinho** (sheet lateral) — itens, subtotal, aplicar cupom, taxa de entrega calculada por endereço
- **Checkout** — nome, telefone (com lookup no CRM pra auto-preencher), endereço (CEP via ViaCEP), forma de pagamento, troco, observações, opção "agendar pedido"
- **Confirmação** — número do pedido, ETA, botão "Acompanhar via WhatsApp" abre conversa do restaurante com pedido formatado
- **Acompanhar** (`/pedido/[id]`) — status em tempo real (Novo → Em preparo → Saiu → Entregue) com timeline visual

---

## Detalhes técnicos

**Stack:** TanStack Start + React + TypeScript + Tailwind v4 + shadcn/ui + Lovable Cloud (Supabase gerenciado).

**Roteamento:**
- Públicas: `/`, `/funcionalidades`, `/precos`, `/contato`, `/loja/$slug`, `/pedido/$id`
- Auth: `/login`, `/cadastro`, `/recuperar-senha`
- Protegidas (`_authenticated/admin/*`): todas as páginas do painel

**Pagamento online:** Stripe integrado (Lovable built-in payments) pra cobrar a mensalidade dos restaurantes E pra processar pagamentos online dos clientes finais.

**WhatsApp:** integração via `wa.me` (sem API paga). Pra envio automático de status pelo Comanda, opção futura via WhatsApp Business API.

**CEP:** ViaCEP (gratuito) pra auto-completar endereços.

**Mapas:** Leaflet (gratuito) pra desenhar áreas de entrega e mostrar localização.

---

## Por onde começar

Sugiro esta ordem de execução:

1. **Etapa A — Refatorar landing pra Comanda** (azul + amarelo, novo nome, novas seções persuasivas) — entrega rápida e visível
2. **Etapa B — Backend** (ativar Cloud + criar tabelas + login)
3. **Etapa C — Painel admin** (começando por dashboard + pedidos + cardápio, que é o coração)
4. **Etapa D — Portal do cliente** (cardápio + carrinho + checkout)

Cada etapa entrega valor sozinha. Se você aprovar, começo agora pela Etapa A pra você ver a nova marca rodando ainda hoje.

**Confirma o nome "Comanda"** ou prefere **Pratto** / **Sirva**?
