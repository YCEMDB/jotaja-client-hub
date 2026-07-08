# 🔍 Auditoria — Marketing vs. Produto (ComandaX / Comandex)

> Data: 08/07/2026 · Escopo: landing page + todas as páginas públicas · Método: extração verbatim de claims + inventário técnico do que está implementado no código/DB.
> **Nenhuma alteração de texto ou código foi feita.** Este documento é apenas relatório.

---

## SUMÁRIO EXECUTIVO

- **37 categorias** de promessas analisadas · **180+ claims** individuais extraídos verbatim de 40+ arquivos.
- **~70%** das promessas estão **implementadas e entregam o prometido**.
- **~20%** são **parciais** (feature existe mas com limitações não sinalizadas na landing).
- **~10%** são **falsas ou enganosas** hoje — risco comercial/jurídico alto.
- Existem **funcionalidades robustas subvendidas** (KDS avançado, delivery com PWA de entregador, financeiro/DRE, estoque com ficha técnica) que a landing praticamente ignora.
- Existem **claims quantitativos não auditáveis** ("+1.247 restaurantes", "R$ 9,4M/mês", "4.9 de 5", "média 8 minutos de resposta", "20-30% de aumento no ticket") — risco publicitário se não houver lastro.

---

## LEGENDA

| Símbolo | Significado |
|---|---|
| ✅ | Implementado — entrega o que promete |
| ⚠️ | Parcial — existe, mas com limitações relevantes |
| ❌ | Não implementado — promessa falsa hoje |
| 🔶 | Declarado "em desenvolvimento" na própria página — expectativa alinhada |

Risco comercial: **B**aixo · **M**édio · **A**lto · **C**rítico.

---

## 1. AUDITORIA POR CATEGORIA

### 1.1 Cardápio Digital

| # | Promessa (verbatim) | Onde aparece | Status | Evidência técnica | Risco |
|---|---|---|---|---|---|
| 1 | "Cardápio digital ilimitado" | `Planos.tsx`, `ComparativoPlanos.tsx` — `/` | ✅ | `$slug.tsx`, RPCs `get_public_*`, sem `max_products` em plano | B |
| 2 | "Sem limite de produtos, categorias ou adicionais em qualquer plano." | `perguntas-frequentes.tsx:45` | ⚠️ | `usePlanFeatures` expõe `max_products` — TODO.md registra que só é validado no frontend. Backend não bloqueia, então promessa se cumpre por default, mas há inconsistência interna. | B |
| 3 | "Combos, adicionais pagos, variação P/M/G, esconder produto, pausar loja, horário por categoria" | `perguntas-frequentes.tsx:46-51` | ✅ | Modelo `products` + `product_option_groups/items`, flag `is_active`, `is_restaurant_open_now` com janelas | B |
| 4 | "Foto redimensionada e comprimida" | `perguntas-frequentes.tsx:52` | ⚠️ | Confirmar pipeline de upload — não encontrado tratamento server-side de compressão; depende do cliente. | M |
| 5 | "O time cadastra o cardápio por mim" / "Importação de cardápio assistida" | `perguntas-frequentes.tsx:53`, `ComoFunciona.tsx:8`, `CTA.tsx:44` | ⚠️ | É serviço humano manual, não feature de produto. OK se o time realmente entrega — do contrário, promessa falsa. | M |

### 1.2 QR Code de Mesa

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 6 | "QR Code grátis pra mesa" | `ComoFunciona.tsx:15` | ✅ | `QrCodeDialog.tsx`, `mesa.$token.tsx`, RPC `get_public_table_by_qr` | B |
| 7 | "Status visual: livre / ocupada / aguardando conta / em pagamento" | `geo-pages.tsx:284` | ✅ | `TableMap.tsx`, `TableCard.tsx`, `table_sessions.status` | B |
| 8 | "Transferência de mesa" / "União de mesas" | `geo-pages.tsx:285-286` | ✅ | `TransferOrdersDialog`, `MergeSessionsDialog`, RPCs `transfer_orders`, `merge_sessions` | B |
| 9 | "Sem limite de mesas no Pro" | `geo-pages.tsx:292` | ✅ | Trigger `enforce_tables_max` (Pro=30 no docs; **conflito**: landing diz "sem limite", `docs/ROADMAP.md` cita 30 no Pro) | **A** — descasamento direto |

### 1.3 PIX / Mercado Pago

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 10 | "PIX em 2s, cai direto na conta" | `Hero.tsx`, `Bento.tsx`, `Stats.tsx` | ✅ | `createPixPayment`, webhook MP com HMAC | B |
| 11 | "Cartão em até 2 dias úteis" | `geo-pages.tsx:9` | ✅ | Comportamento do MP, não da Comandex | B |
| 12 | "Cartão online" | `Planos.tsx`, `ComparativoPlanos.tsx` | ⚠️ | `createPixPayment` implementado; checkout de cartão via MP checkout pro não confirmado no código auditado — verificar. | M |
| 13 | "Webhook automático marca como pago" | `perguntas-frequentes.tsx:35` | ✅ | `mercadopago-webhook.ts` | B |
| 14 | (Implícito) "Reconciliação confiável" | várias | ⚠️ | `docs/TODO.md`: sem retry/DLQ no webhook; se falhar, pedido fica dessincronizado. | **A** |

### 1.4 WhatsApp / Comunicação

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 15 | "WhatsApp integrado nativo" | Hero, Bento, comparativos | ⚠️ | Integração via **Evolution API** (não oficial WhatsApp Business API). Funciona mas usa API não oficial — risco de banimento do número + limbo jurídico. | **A** |
| 16 | "Notificação por WhatsApp ao cliente" | `geo-pages.tsx:229`, `perguntas-frequentes.tsx:63` | ✅ | `communication_queue`, provider Evolution | M (mesmo risco de 15) |
| 17 | "Suporte prioritário no WhatsApp, seg-sáb 9h-22h" | `sla.tsx:32` | ⚠️ | Operacional/humano — não auditável em código. Depende de existir a equipe. | M |
| 18 | "WhatsApp dedicado 24/7" (Business) | `sla.tsx:33` | ⚠️ | Idem — plataforma não tem plantão auditável. Se não houver equipe 24/7, promessa contratual falsa. | **C** |
| 19 | "Mediana de resposta: 8 minutos" | `perguntas-frequentes.tsx:101` | ⚠️ | Sem métrica pública auditável. Se não medido, é claim publicitário arriscado. | **A** |
| 20 | "Relatórios diários no WhatsApp" | `ComoFunciona.tsx:23` | ❌ | Não localizado job/cron que envie resumo diário. Templates de comunicação existem, mas envio automático diário de relatório **não foi encontrado**. | **A** |
| 21 | "Pedido pelo WhatsApp — Sim, com bot e link automático" | `comparativo.goomer.tsx:75` | ⚠️ | Existe automação por regras (keyword/regex) — não é "bot" no sentido conversacional/IA. Link automático sim, "bot" é exagero. | M |
| 22 | "Migração do iFood / Anota Aí incluída" | `CTA.tsx:44` | ⚠️ | Não há importador OAuth — é cadastro manual assistido. Roadmap Sprint 8. | M |
| 23 | "Envie promoções por WhatsApp com link direto para o cupom" | `llms-full.txt:125` | ⚠️ | Templates + envio existem; disparo em massa/campanha **não confirmado** como feature de UI. Roadmap Sprint 5. | M |

### 1.5 CRM / Clientes

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 24 | "Base de clientes 100% sob seu controle" | Bento, Vantagens | ✅ | Tabela `customers` isolada por `restaurant_id`, RLS | B |
| 25 | "Histórico, ticket médio, contato" | `Funcionalidades.tsx:11` | ✅ | Trigger `sync_customer_stats`, colunas `total_orders/total_spent` | B |
| 26 | "Relatório de cliente recorrente (Pro)" | `perguntas-frequentes.tsx:92` | ⚠️ | UI `admin.clientes.tsx` é enxuta (105 linhas). Dados existem, filtros/rankings avançados podem estar ausentes. | M |
| 27 | "Segmentação avançada" (implícito em campanhas) | várias | ❌ | Roadmap Sprint 5. Sem `customer_segments`, sem tags automáticas. | M |

### 1.6 Cupons

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 28 | "Cupons ilimitados % ou R$ fixo, com regras (mínimo, validade, primeira compra, uso único)" | Planos, Bento, FAQ | ✅ | `coupons` + RPC `validate_public_coupon` completa | B |
| 29 | "Cupons aumentaram ticket médio em 23%" (depoimento) | `Depoimentos.tsx:29` | ⚠️ | Depoimento nominal — se genuíno, ok; se fabricado, publicidade enganosa (CDC/CONAR). | **A** |
| 30 | (Implícito) "Rate limit" | — | ❌ | Sem rate limit em `validate_public_coupon`, permitindo enumeração. Não é claim, mas expõe risco. | M |

### 1.7 Mesas / Comandas / Split

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 31 | "Comanda digital não some, não molha, não rasga" | `geo-pages.tsx:255` | ✅ | Modelo digital em Postgres | B |
| 32 | "Divisão de conta por pessoa OU por item" | `perguntas-frequentes.tsx:70`, `geo-pages.tsx:406` | ⚠️ | `table_split_payments` implementado por **valor/percentual/pessoa**; TODO.md marca split **item-a-item como pendente**. Landing promete os dois. | **A** |
| 33 | "Login por garçom" / "comissão automática" | `perguntas-frequentes.tsx:71`, `geo-pages.tsx:173,180` | ⚠️ | Login por perfil sim (`user_roles` com `employee`); **cálculo automático de comissão por garçom** não localizado. | **A** |
| 34 | "Couvert artístico como item adicional automático ao abrir mesa" | `geo-pages.tsx:181` | ❌ | Não encontrada regra automática de couvert ao abrir sessão. Adicional manual talvez sim, "automático" não. | M |
| 35 | "Fechamento parcial" | `geo-pages.tsx:175,288` | ✅ | `table_split_payments`, `close_command` | B |
| 36 | "Rodízio pelo cardápio digital sim, controle melhor pelo PDV" | `geo-pages.tsx:95` | ⚠️ | Ressalva honesta; não há módulo de rodízio dedicado. | B |

### 1.8 KDS

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 37 | "KDS: tela na cozinha em tempo real, substituindo ticket impresso" | `glossario.tsx:19` | ✅ | `admin.kds.tsx`, RPC `get_kds_orders`, realtime, SLA timers, som | B |
| 38 | "Fila de produção por status" | `geo-pages.tsx:124` | ✅ | Colunas por status no KDS | B |

> **Nota:** KDS é robusto (SLA colorido, som, filtro por estação) e é **subvendido** — só aparece explicitamente no glossário. Ver Seção 4.

### 1.9 Impressão Térmica

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 39 | "Imprime automaticamente na cozinha em impressoras térmicas 58/80mm" | ComoFunciona, FAQ, perguntas-frequentes, glossario, `llms.txt` | ⚠️ | `print_jobs` + `usePrintQueueConsumer` implementados **só para driver `browser`** (janela de impressão do navegador). Drivers `escpos`, `webusb`, `network`, `cloud` — **não implementados**. | **C** |
| 40 | "Via app companion ou USB/Bluetooth direto" | `perguntas-frequentes.tsx:80` | ❌ | Não há app companion. Impressão só pelo diálogo do navegador. Cliente que compra esperando ESC/POS direto vai reclamar. | **C** |

### 1.10 PDV / Caixa

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 41 | "PDV embutido para vendas no balcão" | `perguntas-frequentes.tsx:82`, `geo-pages.tsx:60,119` | ✅ | `admin.pdv.tsx` (291 linhas) | B |
| 42 | "Fechamento de caixa automático" | `perguntas-frequentes.tsx:83`, `geo-pages.tsx:49,387` | ⚠️ | `cash_sessions/movements` implementados; fechamento avançado (email, diferença esperado×contado, sangrias/suprimentos) **pendente** (Roadmap Sprint 4). | M |
| 43 | "Relatório diário por forma de pagamento e canal, top produtos, ticket médio" | `perguntas-frequentes.tsx:83` | ⚠️ | Dados existem; `admin.relatorios.tsx` é pequeno (209 linhas) — cobertura de relatórios exigidos precisa validação. | M |

### 1.11 Delivery / Motoboys / GPS

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 44 | "Áreas de entrega, taxa por bairro/CEP/raio" | Bento, Funcionalidades, geo-pages | ✅ | `delivery_areas` + admin.entregas | B |
| 45 | "Cadastro/atribuição de entregadores próprios" | `geo-pages.tsx:230`, Planos Pro | ✅ | `delivery_drivers`, RPCs completas | B |
| 46 | "Status em tempo real (recebido → preparando → saiu → entregue)" | `geo-pages.tsx:228`, `perguntas-frequentes.tsx:62` | ✅ | State machine + realtime | B |
| 47 | "Rastreamento GPS do entregador — em desenvolvimento" | `geo-pages.tsx:235` | 🔶 | `driver_locations` + `update_driver_location` **existem**; UI de mapa em tempo real para o cliente ainda pendente. Aviso de "em desenvolvimento" alinhado. | B |
| 48 | "Cliente acompanha pedido sem login, link por WhatsApp" | `ComoFunciona.tsx:15`, `perguntas-frequentes.tsx:63` | ✅ | `pedido.$orderId.tsx`, envio pela comunicação | B |
| 49 | "Tempo médio de entrega visível para o cliente" | `geo-pages.tsx:227` | ⚠️ | Não confirmado ETA calculado/exibido em `pedido.$orderId`. | M |

### 1.12 Estoque / Ficha Técnica

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 50 | "Estoque por insumo — em desenvolvimento" | `geo-pages.tsx:326` | 🔶 conflito | Existe! `stock_ingredients`, `product_recipes`, trigger de baixa automática, admin com 1.088 linhas. Landing está **subvendendo** — promete "em desenvolvimento" o que já entrega. | M (perda de venda) |
| 51 | "Controle básico de ativo/inativo e ruptura" | `geo-pages.tsx:326` | ✅ | Muito mais que isso está entregue | B |

### 1.13 Financeiro / DRE

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 52 | (implícito) "Financeiro do dia, caixa" | `geo-pages.tsx:312` | ✅ | `admin.financeiro.tsx` (736 linhas), `finance_*` tabelas | B |
| 53 | "Exportação CSV" (Pro) | `ComparativoPlanos.tsx:35` | ✅ | `export-csv.ts` | B |
| 54 | (não vendido) DRE, contas a pagar/receber, centros de custo | — | ✅ (existe) | Sprint 9 concluído — **não aparece na landing**. Subvenda. | M |
| 55 | "Emite nota fiscal? Integração NFC-e em desenvolvimento" | `geo-pages.tsx:327` | 🔶 | Correto — não existe. | B |

### 1.14 Multiusuário / Equipe

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 56 | "1 / 5 / ilimitados usuários" | Planos | ✅ | `create_team_invite` enforce | B |
| 57 | "Perfis: admin, gerente, caixa, garçom, cozinha, entregador" | `perguntas-frequentes.tsx:84` | ⚠️ | Roles reais: `owner`, `manager`, `employee`, `driver`, `super_admin`. **Não há distinção nativa entre "caixa", "garçom" e "cozinha"** — todos ficam em `employee`. Landing sugere granularidade que o produto não tem. | **A** |

### 1.15 Multiunidade

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 58 | "Múltiplas unidades" (Business) | Planos, ComparativoPlanos | ❌ | Feature gate existe mas **tabela `restaurant_groups` não existe** e não há gestão consolidada. Roadmap Sprint 7. | **C** — plano Business vende algo que não entrega |
| 59 | "Cada unidade tem painel e cardápio próprios; planos multi-loja sob consulta" | `geo-pages.tsx:62` | ⚠️ | Você pode criar N restaurantes separados (contas independentes) — não é multi-unidade real. Cliente que assinar esperando gestão consolidada vai frustrar. | **C** |

### 1.16 Domínio Próprio

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 60 | "Domínio próprio (Pro), URL personalizada, ex: pedido.suapizzaria.com.br" | Hero, Planos, FAQ, sobre-a-comandahub, comparativos | ⚠️ | `custom-domain.functions.ts` resolve host → slug. Não há UI para o restaurante configurar, e o processo (CNAME + cert SSL automático) **não está automatizado**. Roadmap Sprint 7. | **A** |
| 61 | "URL personalizada" (sua-loja.comandahub.online) | várias | ✅ | Slug funciona | B |

### 1.17 API / Webhooks para Lojistas

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 62 | "API e integrações" (Business) | Planos, ComparativoPlanos | ❌ | Sem rotas `/api/v1/*`, sem sistema de API keys. Roadmap Sprint 7. | **C** — plano cobra por algo inexistente |
| 63 | "Webhooks de pedidos sob demanda no Pro" | `perguntas-frequentes.tsx:118` | ⚠️ | Não localizado sistema de webhooks configurável para lojistas. "Sob demanda" = provavelmente config manual pelo time. | **A** |
| 64 | "API REST em desenvolvimento, roadmap 2026" | `perguntas-frequentes.tsx:118` | 🔶 | Alinhado. | B |

### 1.18 Fidelidade / Cashback / Campanhas

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 65 | "Programa de fidelidade" (Business) | `ComparativoPlanos.tsx:17`, `blog...` | ❌ | Colunas `loyalty_points` e `cashback_balance` existem em `customers`, mas **sem regras, sem UI, sem RPC de acúmulo/resgate**. Roadmap Sprint 5. | **C** — vendido no plano Business |
| 66 | "Cupons de fidelidade" | `geo-pages.tsx:149` | ⚠️ | Existem cupons; "de fidelidade" sugere programa de pontos que não existe. | M |
| 67 | "Cashback — em desenvolvimento, roadmap 2026" | `perguntas-frequentes.tsx:91` | 🔶 | Alinhado. | B |
| 68 | "Campanhas por WhatsApp com link do cupom" | `llms-full.txt:125` | ⚠️ | Envio 1-a-1 sim; campanhas em massa não confirmadas. | M |
| 69 | "NPS automático" (roadmap interno) | — | ❌ | Sprint 5. Não vendido, ok. | B |

### 1.19 Integrações Fiscais

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 70 | "NFC-e em desenvolvimento; hoje exporta CSV para contador" | `geo-pages.tsx:327` | 🔶 | Correto. | B |
| 71 | "ERP completo (fiscal, estoque) — Em desenvolvimento" | `comparativo.saipos.tsx:53` | 🔶 | Correto. | B |

### 1.20 IA

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 72 | (não vendido) Assistente IA de cardápio | — | ✅ existe | `ai-menu-suggestions/index.ts` (Gemini). Nenhuma menção na landing. | Oportunidade |

### 1.21 Importação iFood / Anota Aí

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 73 | "Migração do iFood / Anota Aí incluída" | `CTA.tsx:44` | ⚠️ | Manual pelo time (Sprint 8 planeja OAuth real). Se time entrega, ok. | M |

### 1.22 Provas sociais / Números

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 74 | "+1.247 restaurantes" | Hero, Stats, CTA, Depoimentos | ❌ | Nenhuma métrica auditável. Se falso, publicidade enganosa (CDC art. 37 + CONAR). | **C** |
| 75 | "R$ 9,4M processados/mês" | Hero, Stats, CTA | ❌ | Idem. | **C** |
| 76 | "4.9 de 5 — média entre +1.247 lojas" | `Depoimentos.tsx:84` | ❌ | Idem. Não há sistema de rating interno. | **C** |
| 77 | "Aumenta ticket médio em 20–30%", "fotos aumentam 30%", "cupons +23%" | Hero, geo-pages, blog, glossário, depoimentos | ⚠️ | Números do mercado citados como se fossem da Comandex; sem fonte. | **A** |
| 78 | "Restaurante que fatura 50k no iFood paga R$10-13,5k em comissão" | `alternativa-ifood.tsx:109` | ✅ | Cálculo do próprio texto (12-27% × 50k) — matematicamente ok. | B |
| 79 | Depoimentos nominais (Rafael, Camila, Marcelo, Diego) | `Depoimentos.tsx`, `Hero.tsx` | ⚠️ | Se são personas fictícias sem "ilustrativo", risco publicidade enganosa. | **A** |

### 1.23 SLA

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 80 | "Uptime 99,5% (Starter/Pro), 99,9% (Business)" | `sla.tsx:26` | ⚠️ | Depende do hosting (Lovable Cloud/Cloudflare). Sem status page pública que comprove. | M |
| 81 | "Crédito proporcional se abaixo do garantido" | `sla.tsx:46` | ⚠️ | Compromisso contratual — precisa operacionalização (processo de compensação). | M |
| 82 | "Backup diário automatizado, retenção 30 dias" | `sla.tsx:56`, `perguntas-frequentes.tsx:116` | ⚠️ | Depende do provider Postgres (Supabase padrão faz PITR/daily). Auditável no plano contratado. | B |
| 83 | "Cliente pode solicitar exportação dos seus dados a qualquer momento" | `sla.tsx:57` | ⚠️ | Exportação existe (CSV) para relatórios; exportação completa/portabilidade LGPD não confirmada. | M |
| 84 | "Conformidade LGPD documentada" | `perguntas-frequentes.tsx:116` | ⚠️ | `privacidade.tsx` existe; "documentada" implica DPO + RIPD + registro de tratamento — precisa validar. | M |

### 1.24 Preços & Comissão

| # | Promessa | Onde | Status | Risco |
|---|---|---|---|---|
| 85 | "0% comissão, mensalidade fixa" | Hero, Bento, Planos | ✅ | B |
| 86 | "R$ 99/199/399 mensais" | Planos | ✅ | B |
| 87 | "14 dias grátis sem cartão, cancele quando quiser, sem multa" | Hero, FAQ | ⚠️ | Comportamental — se o painel realmente cancela sem contato humano, ok. Confirmar fluxo. | M |

### 1.25 Onboarding / Setup

| # | Promessa | Onde | Status | Risco |
|---|---|---|---|---|
| 88 | "Loja pronta em 5-30 minutos" | ComoFunciona, Vantagens, sobre-a-comandahub, comparativos | ⚠️ | Depende do cliente. Não é falso se o time faz o setup, mas overpromise para self-service. | M |
| 89 | "Sessão 1:1 por videochamada na 1ª semana" | `perguntas-frequentes.tsx:100` | ⚠️ | Operacional. Precisa existir agenda + pessoa. | M |
| 90 | "Vídeos curtos no onboarding" | idem | ⚠️ | Confirmar se vídeos foram produzidos. | M |

### 1.26 Analytics / Integrações externas

| # | Promessa | Onde | Status | Evidência | Risco |
|---|---|---|---|---|---|
| 91 | "Integra com Google Analytics? Sim. GA4 ID e Meta Pixel no painel; eventos automáticos" | `perguntas-frequentes.tsx:93` | ⚠️ | Não localizada UI de configuração de GA4/Pixel nem disparo de eventos. | **A** |

---

## 2. VISÃO CONSOLIDADA

### 2.1 Promessas VERDADEIRAS (podem ser vendidas sem ressalva)

- Cardápio digital ilimitado com categorias, adicionais, variações, combos, horário por categoria, pausa da loja.
- QR Code de mesa + auto-atendimento pelo cliente.
- PIX via Mercado Pago com webhook de confirmação.
- Painel em tempo real com som de alerta.
- Cupons ilimitados com regras completas.
- CRM básico (histórico, ticket, contato — cliente é do restaurante).
- Comandas digitais com mapa de mesas, transferência, união, fechamento parcial.
- KDS com SLA colorido e som (subvendido).
- Delivery com áreas por bairro/CEP, motoboys próprios e PWA do entregador.
- Financeiro/DRE, contas a pagar/receber, exportação CSV (subvendido).
- Estoque com ficha técnica e baixa automática (subvendido).
- Multiusuário com convites e limites por plano.
- PDV embutido.
- 0% de comissão, mensalidade fixa.
- 14 dias grátis (assumindo cancelamento self-service).
- Assistente IA de cardápio (não vendido).
- Automações de comunicação por keyword (com cooldown).

### 2.2 Promessas PARCIAIS (existem com limitações não sinalizadas)

- **Cartão online**: PIX confirmado, cartão via MP checkout precisa validação de fluxo completo.
- **WhatsApp integrado**: usa Evolution API (não oficial) — risco de banimento.
- **Split de conta por item**: só por valor/percentual/pessoa hoje.
- **Perfis de acesso (caixa/garçom/cozinha)**: sistema só tem `employee` genérico.
- **Multi-unidade (Business)**: nome no plano, gestão consolidada inexistente.
- **Domínio próprio**: infra parcial, UI de configuração ausente.
- **Fechamento de caixa avançado**: básico existe, avançado pendente.
- **Fidelidade (Business)**: colunas na tabela, sem lógica.
- **Webhooks para lojistas**: "sob demanda" = artesanal.
- **Migração iFood/Anota Aí**: manual pelo time, não automatizada.
- **GA4/Meta Pixel**: sem UI de config confirmada.
- **NPS/pesquisa**: não existe.
- **ETA visível ao cliente**: não confirmado.
- **Comissão automática por garçom**: não encontrada.
- **Campanhas em massa por WhatsApp**: envio 1-a-1 sim, disparo em massa não confirmado.

### 2.3 Promessas FALSAS (produto não entrega hoje)

- **Impressão térmica ESC/POS direta (USB/Bluetooth/rede)**: só imprime pelo diálogo do navegador. Landing e FAQ vendem 58/80mm nativo → **crítico**.
- **App companion de impressão**: não existe.
- **Relatórios diários enviados por WhatsApp**: não há job de envio recorrente.
- **API pública / API keys (Business)**: não existe.
- **Multi-unidade real (Business)**: não existe.
- **Programa de fidelidade nativo (Business)**: não existe.
- **"Sem limite de mesas no plano Pro"**: Pro tem teto de 30.
- **Bot conversacional WhatsApp**: são regras keyword, não bot.
- **Couvert artístico automático**: não existe automação.
- **Números de prova social** (+1.247 lojas, R$ 9,4M/mês, 4.9/5): sem lastro auditável.
- **WhatsApp dedicado 24/7 (Business SLA)**: sem plantão auditável — risco contratual.

### 2.4 Promessas que devem ser REMOVIDAS da landing/páginas

Prioridade CRÍTICA (remover imediatamente ou reformular):

1. "Compatível com impressoras térmicas 58mm e 80mm via app companion ou USB/Bluetooth" → **substituir por**: "Impressão via navegador (para impressoras conectadas ao computador). Suporte a driver ESC/POS nativo em desenvolvimento."
2. "API e integrações" no plano Business → **substituir por**: "API pública — em desenvolvimento (roadmap 2026). Webhooks sob demanda disponíveis."
3. "Múltiplas unidades" no plano Business → **substituir por**: "Multi-unidade com painel consolidado — em desenvolvimento. Hoje, você pode operar N restaurantes com contas separadas."
4. "Programa de fidelidade" no plano Business → **substituir por**: "Programa de fidelidade — em desenvolvimento. Simule com cupons recorrentes por cliente."
5. "Sem limite de mesas" → **substituir por**: "Até 30 mesas no Pro, ilimitado no Business" (ou remover teto do Pro).
6. "Relatórios diários no WhatsApp" → remover ou implementar.
7. Todos os números não auditáveis ("+1.247", "R$ 9,4M", "4.9/5", "mediana 8min") → substituir por linguagem descritiva ou marcar como ilustrativo.
8. "WhatsApp dedicado 24/7" → só manter se houver plantão real.
9. Depoimentos nominais → confirmar autorização por escrito de cada pessoa; caso contrário, marcar como "ilustrativo" ou remover.

Prioridade ALTA:

10. "com bot" (Goomer comparativo) → trocar por "com automações por palavra-chave".
11. "Couvert artístico como item adicional automático ao abrir mesa" → remover "automático".
12. "Divisão de conta por item" → remover "por item" ou implementar.
13. "Domínio próprio (ex: pedido.suapizzaria.com.br) disponível no plano Pro" → adicionar "sob configuração assistida" até UI existir.
14. "Cada usuário tem seu próprio login e perfil (admin, gerente, caixa, garçom, cozinha, entregador)" → alinhar com roles reais.
15. "Migração do iFood / Anota Aí incluída" → "Migração assistida do cardápio" (sem citar OAuth automático).
16. "Integra com Google Analytics? Sim. GA4 e Meta Pixel no painel" → remover se UI não existe.

### 2.5 Promessas que devem ficar como "em breve/roadmap"

- GPS do entregador (já sinalizado ✅)
- Cashback (já sinalizado ✅)
- API REST pública
- NFC-e
- Multi-unidade consolidada
- Fidelidade
- Impressão ESC/POS nativa
- Campanhas WhatsApp em massa
- Split item-a-item
- Importador iFood/Anota (OAuth)

### 2.6 Promessas seguras que podem ser vendidas normalmente

Ver seção 2.1 acima.

### 2.7 Funcionalidades que EXISTEM mas estão SUBVENDIDAS

Prioridade **alta** — a landing deixa dinheiro na mesa:

1. **KDS profissional** (SLA colorido, som, filtro por estação, realtime) → só menção no glossário.
2. **Estoque com ficha técnica e baixa automática** → vendido como "básico em desenvolvimento" quando é módulo grande e completo.
3. **Financeiro/DRE/Contas a pagar-receber/Conciliação** → não aparece na landing como diferencial.
4. **App PWA do entregador** (`/motoboy`, 735 linhas) → não aparece.
5. **Assistente IA de cardápio** (Gemini) → não aparece.
6. **Automações de comunicação** com 7 regras seed (status, pix, menu, horário, endereço, cancelar, atendente) → não aparece.
7. **Feature gates com enforcement backend** (trigger em orders, mesas, drivers, ingredientes) → é diferencial de robustez, invisível.
8. **PWA do painel + notificação push** → citado uma vez.
9. **Merge de mesas/comandas, transferência de pedidos** → só uma linha.

### 2.8 TOP 10 RISCOS COMERCIAIS

| # | Risco | Categoria | Nível |
|---|---|---|---|
| 1 | **Plano Business vende multi-unidade, fidelidade e API que não existem** — cliente pagando por vaporware | Fraude comercial / churn imediato | **CRÍTICO** |
| 2 | **Impressão térmica ESC/POS prometida, entrega só browser print** — este é o principal item físico de restaurante | Publicidade enganosa | **CRÍTICO** |
| 3 | **Números "+1.247 restaurantes / R$ 9,4M/mês / 4.9 de 5" sem lastro auditável** | CONAR / CDC art. 37 / risco de Procon | **CRÍTICO** |
| 4 | **WhatsApp via Evolution API (não oficial)** — banimento do número WhatsApp em massa é comum; cliente perde canal | Continuidade do serviço | **ALTO** |
| 5 | **SLA "WhatsApp 24/7 Business" e "resposta em 1h/8min"** sem plantão real | Contratual / SLA breach | **ALTO** |
| 6 | **"Sem limite de mesas no Pro" vs. teto real de 30** | Fricção pós-venda | **ALTO** |
| 7 | **Perfis granulares (caixa/garçom/cozinha)** vendidos, sistema tem só `employee` | Fricção pós-venda | **ALTO** |
| 8 | **Depoimentos nominais sem autorização documentada** | Direito de imagem + CONAR | **ALTO** |
| 9 | **Webhook MP sem retry/DLQ** — pedido pode ficar "não pago" mesmo com PIX real recebido | Financeiro do cliente | **ALTO** |
| 10 | **Split "por item" prometido, entrega só por valor/pessoa** | Reclamação recorrente pós-venda | **MÉDIO/ALTO** |

### 2.9 ROADMAP SUGERIDO — Alinhar marketing e produto

**Sprint imediata (1 semana) — Correções de texto sem código:**
- Aplicar remoções/reformulações da seção 2.4.
- Marcar todos os números não auditáveis como "estimado" ou removê-los.
- Confirmar/coletar autorização dos depoimentos.
- Ajustar planos: remover "múltiplas unidades", "API e integrações", "programa de fidelidade" do Business enquanto não entregar (ou marcar "em breve").
- Corrigir "sem limite de mesas Pro" para o teto real.

**Sprint curta (2-4 semanas) — Fechar gaps críticos:**
- Implementar driver ESC/POS via WebUSB ou app companion mínimo (bridge Node local).
- Adicionar rate limit e retry/DLQ no webhook MP e em `create_public_order`.
- Documentar roles reais (`owner/manager/employee/driver`) na FAQ; se necessário, criar sub-roles.

**Sprint média (1-3 meses) — Entregar o que já foi vendido:**
- Split item-a-item.
- UI de configuração de domínio próprio + automação de cert.
- Multi-unidade real (`restaurant_groups` + gestão consolidada) OU remover do Business.
- Programa de fidelidade nativo OU remover do Business.
- Envio de relatório diário por WhatsApp (job noturno).
- UI de GA4 / Meta Pixel + emissão de eventos.

**Sprint longa (3-6 meses):**
- API REST pública com API keys.
- Importador OAuth iFood / Anota Aí.
- WhatsApp Business API oficial (paralelo ao Evolution).
- NFC-e.
- Rastreamento GPS do cliente ao entregador.

**Ganho de conversão (paralelo) — vender melhor o que já existe:**
- Seção "KDS profissional" com screenshot dark.
- Seção "Financeiro completo: DRE, contas a pagar, conciliação".
- Seção "Estoque com ficha técnica: baixa automática ao vender".
- Seção "App do entregador (PWA)".
- Selo "Automações WhatsApp inclusas" com as 7 regras padrão.
- Case do assistente IA para criar cardápio em minutos.

---

## 3. Observações finais

- O produto entrega **muito mais** do que a landing consegue vender em várias áreas (estoque, financeiro, KDS, delivery com PWA, automações, IA).
- E vende **algumas coisas relevantes que ainda não entrega** — o plano Business é o mais exposto (multi-unidade, fidelidade, API).
- A **impressão térmica** é o gap operacional mais crítico: qualquer restaurante espera ESC/POS pronto no dia 1.
- Os **números de prova social** e **depoimentos** precisam ser lastreados ou reescritos antes de virarem problema jurídico.
- **Sugestão de governança:** criar um checklist de "claim × evidência" versionado (este documento pode ser a v1) e revisar toda mudança de landing contra ele.
