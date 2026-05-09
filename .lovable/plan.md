# Jotajá — Portal de Pedidos + Painel Administrativo

Vamos construir uma plataforma completa de delivery próprio para restaurantes, igual ao Jotajá: o restaurante cadastra seu cardápio, o cliente final pede pelo link sem instalar app, e o pedido cai organizado pra cozinha (com opção de envio pro WhatsApp).

---

## Identidade visual (igual ao Jotajá)

- **Vermelho vibrante** (#E30613 aproximado) como cor primária
- Branco como fundo, cinza claro nos cards
- Tipografia moderna sans-serif (tipo Poppins/Inter), bold nos títulos
- Cantos arredondados, sombras suaves, ícones limpos
- Logo "JOTAJÁ" com ícone de caixa de delivery em vermelho

---

## Fase 1 — Landing page comercial + estrutura base

A página de entrada que vende o produto pra novos restaurantes (igual à jotaja.com.br).

- **Header** fixo: logo, menu (Início, Vantagens, Funcionalidades, Clientes, FAQ), botões de telefone/WhatsApp, CTA "Receber ligação"
- **Hero**: foto de restaurante ao fundo, título "Tenha sua própria base de clientes no delivery!", subtítulo, botão "Ver como funciona", e formulário de captura de lead à direita
- **Seção Vantagens** (6 cards): sem app, WhatsApp, transparência, interface fácil, não ocupa atendente, sem comissão
- **Seção Funcionalidades**: cardápio, cupons, multiusuário, impressoras, financeiro, agendamento, pagamento online, módulo mesa (QR code), redes/franquias, integrações
- **Seção "Para o restaurante / Para o cliente"** com benefícios lado a lado
- **Contadores animados**: "+X clientes ativos", "+Y colaboradores"
- **FAQ** em accordion (12 perguntas do site original)
- **Footer** com contatos, redes sociais, política de privacidade
- **Botão flutuante de WhatsApp** + banner de cookies
- **Páginas separadas** (rotas próprias para SEO): `/`, `/vantagens`, `/funcionalidades`, `/clientes`, `/faq`, `/contato`

---

## Fase 2 — Backend + Autenticação (Lovable Cloud)

Ativar Lovable Cloud e criar a estrutura de dados.

**Tabelas:**
- `restaurants` — dados da loja (nome, slug/URL personalizada, logo, endereço, horários, área de entrega, pedido mínimo, taxa de entrega, formas de pagamento, status aberto/fechado, WhatsApp)
- `profiles` — usuários do sistema (vinculado ao auth.users)
- `user_roles` — roles separadas (`admin`, `operador`) por restaurante — segurança correta sem privilégio escalado
- `categories` — categorias do cardápio (Pizzas, Bebidas, Sobremesas...)
- `products` — pratos (nome, descrição, foto, preço, categoria, disponibilidade, dias/horários ativos, status "em falta")
- `product_options` — adicionais e variações (borda, tamanho, sabores)
- `customers` — base de clientes do restaurante (nome, telefone, endereços salvos)
- `orders` — pedidos (cliente, itens, status, total, pagamento, entrega)
- `order_items` — itens do pedido com adicionais
- `coupons` — cupons de desconto (código, valor/percentual, validade, uso máximo)

**Auth:** email/senha + Google sign-in para o painel administrativo. Cliente final NÃO precisa fazer login (igual ao Jotajá original).

---

## Fase 3 — Painel Administrativo do restaurante

Acessível em `/admin` (protegido por login).

**Layout:** sidebar colapsável à esquerda + header com nome do restaurante e botão "Loja aberta/fechada".

**Páginas:**
- **Dashboard** — pedidos do dia, faturamento, ticket médio, gráficos de vendas
- **Pedidos** (em tempo real) — lista com filtros por status (Recebido → Em preparo → Saiu pra entrega → Entregue → Cancelado), notificação sonora ao chegar pedido novo, botão pra imprimir, botão pra enviar status pro WhatsApp do cliente
- **Cardápio** — CRUD de categorias e produtos, upload de foto, configurar disponibilidade por dia/horário, marcar "em falta", arrastar pra reordenar
- **Cupons** — criar/editar (valor fixo ou %, validade, limite de uso)
- **Clientes** — base de clientes do restaurante, histórico de pedidos por cliente
- **Configurações da loja** — dados, logo, URL personalizada, horários, área de entrega (raio em km), pedido mínimo, taxa, formas de pagamento aceitas, design (cor) do portal do cliente
- **Usuários** — convidar admin/operador
- **Financeiro** — extrato de pedidos com filtros de data, exportar CSV

---

## Fase 4 — Portal de Pedidos do cliente final

URL pública: `/pedidos/[slug-do-restaurante]` (ex: `/pedidos/pizzaria-do-zé`).

**SEM necessidade de login** — só pede dados na finalização.

**Telas:**
- **Cardápio** — banner do restaurante, status (aberto/fechado), busca, categorias com scroll horizontal, cards de produtos com foto/preço/descrição
- **Detalhe do produto** (modal/drawer) — escolher adicionais, quantidade, observação
- **Carrinho** (drawer lateral fixo) — itens, subtotal, aplicar cupom
- **Checkout** — nome, telefone, endereço (com salvar pra próxima vez via localStorage + telefone), forma de pagamento, troco, observações
- **Confirmação** — número do pedido, status em tempo real, botão "Enviar pelo WhatsApp" que abre o WhatsApp do restaurante com a mensagem do pedido formatada
- **Acompanhar pedido** — página pública `/pedido/[id]` com status atualizando

**Responsivo mobile-first** (a maioria dos clientes pede pelo celular).

---

## Detalhes técnicos

**Stack:** TanStack Start + React + TypeScript + Tailwind v4 + shadcn/ui + Lovable Cloud (backend gerenciado).

**Roteamento:**
- Públicas: `/`, `/vantagens`, `/funcionalidades`, `/faq`, `/contato`, `/pedidos/$slug`, `/pedido/$id`
- Auth: `/login`, `/cadastro`, `/recuperar-senha`
- Protegidas (`_authenticated/admin/*`): dashboard, pedidos, cardápio, cupons, clientes, config, usuários, financeiro

**Segurança:** RLS em todas as tabelas. Roles em tabela separada (`user_roles`) com função `has_role()` SECURITY DEFINER — nunca no profile. Cada restaurante só vê seus próprios dados.

**Real-time:** Lovable Cloud realtime nos pedidos (admin recebe pedido novo na hora, cliente vê status mudar).

**Imagens:** Storage do Lovable Cloud pra fotos de produtos e logo do restaurante.

**WhatsApp:** integração via `wa.me/{numero}?text={mensagem-formatada}` (sem precisar de API paga; abre o WhatsApp do usuário).

**Pagamento online (Fase 4+):** opcional via Stripe ou Mercado Pago — fica pra depois das fundações estarem prontas.

---

## Por onde começar

Sugiro começar pela **Fase 1 (landing comercial)** porque:
1. É o que o usuário vê primeiro e dá identidade visual ao projeto inteiro
2. Não depende de backend — entrega rápida e visual
3. Define o design system (cores, componentes) que será reutilizado nas outras fases

Depois sigo na ordem: Fase 2 (backend) → Fase 3 (admin) → Fase 4 (portal do cliente).

Se você aprovar, eu começo pela Fase 1.
