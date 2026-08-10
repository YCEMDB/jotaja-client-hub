import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveHostToSlug } from "@/lib/custom-domain.functions";
import { Header } from "@/components/jotaja/Header";
import { Hero } from "@/components/jotaja/Hero";
import { Stats } from "@/components/jotaja/Stats";
import { Bento } from "@/components/jotaja/Bento";
import { ComoFunciona } from "@/components/jotaja/ComoFunciona";
import { ComparativoIfood } from "@/components/jotaja/ComparativoIfood";
import { Depoimentos } from "@/components/jotaja/Depoimentos";
import { Planos } from "@/components/jotaja/Planos";
import { FAQ } from "@/components/jotaja/FAQ";
import { CTA } from "@/components/jotaja/CTA";
import { Footer } from "@/components/jotaja/Footer";
import { WhatsAppFloat } from "@/components/jotaja/WhatsAppFloat";
import { ScrollProgress } from "@/components/motion";
import { MotionConfig } from "motion/react";

const SITE_URL = "https://comandahub.online";
const TITLE = "Mesivo | Gestão completa para restaurantes";
const DESCRIPTION =
  "Centralize pedidos, mesas, comandas, cardápio digital, delivery, retirada, caixa e cozinha em uma plataforma criada para a rotina real do seu restaurante.";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      const { slug } = await resolveHostToSlug();
      if (slug) {
        throw redirect({ to: "/$slug", params: { slug } });
      }
    } catch (e: unknown) {
      // Re-throw router redirects; swallow lookup errors so landing still renders.
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
    }
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "gestão de restaurante, cardápio digital, pedidos online, comandas digitais, controle de mesas, sistema para restaurante, delivery próprio, PDV, caixa, cozinha, KDS",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Mesivo",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
          url: SITE_URL,
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    // reducedMotion="never" impede que a Motion library remova estilos
    // iniciais (opacity/transform) no cliente quando o usuário tem
    // Reduced Motion ativo — o que causaria hydration mismatch contra o
    // HTML do SSR. A preferência do usuário continua sendo respeitada
    // pelos nossos componentes via useReducedMotionSafe, que trocam para
    // uma variante de fade curto após a hidratação.
    <MotionConfig reducedMotion="never">
      <div className="min-h-screen bg-background text-foreground">
        <ScrollProgress />
        <Header />
        <main>
          {/* # MESIVO — SECURITY REMEDIATION SPRINT

## OBJETIVO

Corrigir todas as vulnerabilidades reais identificadas pela auditoria do Lovable, priorizando P0/P1, sem alterar a arquitetura financeira existente.

Esta execução é exclusivamente de **hardening de segurança**.

---

# REGRA ABSOLUTA

NÃO alterar:

* Home
* Landing
* Checkout visual
* Orders UI
* Cardápio público
* Payment Framework
* Mercado Pago Adapter
* PIX
* Cartão
* Webhooks
* Fases 5–18
* regras financeiras existentes
* schema financeiro sem necessidade comprovada

NÃO criar mocks.

NÃO desabilitar RLS para contornar problemas.

NÃO ignorar vulnerabilidades reais apenas para obter PASS no scanner.

Toda alteração deve ser mínima, localizada e auditável.

---

# PRIORIDADE P0 — CRÍTICO

## 1. ORDERS — PUBLIC INSERT

Auditar a policy:

`Allow public order insertion`

Eliminar qualquer:

```sql
WITH CHECK (true)
```

para criação de pedidos.

O fluxo público deve continuar permitindo criação legítima de pedidos, mas somente com valores seguros.

Validar:

* `restaurant_id`
* restaurante ativo
* status inicial permitido
* payment_status inicial permitido
* valores financeiros
* itens pertencentes ao restaurante
* descontos válidos
* total calculado pelo servidor

Nunca permitir que o cliente escolha diretamente:

```text
status = paid
status = delivered
payment_status = paid
financial totals arbitrários
```

O pedido deve nascer em estado seguro, por exemplo:

```text
status = pending
payment_status = pending
```

Os estados financeiros posteriores devem depender exclusivamente dos fluxos autorizados existentes.

NÃO quebrar a criação normal de pedidos.

---

# 2. markOrderPaid

Auditar integralmente:

`markOrderPaid`

A função NÃO pode permitir que uma chamada pública marque um pedido como pago.

Implementar:

* autenticação;
* autorização;
* ownership/restaurant access;
* validação do pedido;
* validação do estado atual;
* validação da origem do pagamento;
* impossibilidade de declarar pagamento confirmado apenas pelo frontend.

Quando o pagamento for Mercado Pago/PagBank, a confirmação deve continuar vindo pelo fluxo oficial de pagamento/webhook já existente.

NÃO criar um novo caminho paralelo de confirmação financeira.

---

# 3. ORDERS — PUBLIC SELECT

Remover a policy equivalente a:

```sql
USING (true)
```

que permita leitura pública da tabela `orders`.

A tabela `orders` não deve ser diretamente enumerável por:

```text
anon
authenticated
```

O acesso público deve ocorrer exclusivamente pelo mecanismo seguro já existente:

```text
get_public_order(order_id)
```

A RPC deve:

* exigir identificador específico;
* retornar somente campos públicos;
* não permitir enumeração;
* não retornar tokens;
* não retornar secrets;
* não expor dados de outros pedidos;
* não expor dados internos financeiros.

Validar especialmente:

* customer_name
* customer_phone
* delivery_address
* PIX data
* payment IDs
* restaurant_id
* totals

---

# 4. ADMIN APIs / SERVER FUNCTIONS

Auditar:

```text
/api/admin/monitoring/*
/api/admin/governance/events
```

e todas as Server Functions correspondentes.

Qualquer função que utilize:

```text
service-role
admin client
```

deve validar autenticação e autorização ANTES da consulta.

Implementar o padrão:

```text
request
 ↓
authenticate
 ↓
authorize
 ↓
validate input
 ↓
service-role operation
 ↓
response
```

Para dados globais financeiros, exigir:

```text
super_admin
```

Para dados tenant-scoped:

```text
restaurant access
```

Nunca confiar em:

```text
restaurant_id
```

fornecido pelo frontend sem validação server-side.

---

# PRIORIDADE P1

## 5. MERCADOPAGO_OAUTH_STATES

Corrigir a policy:

`Users can manage their own states`

A autorização deve verificar o vínculo do usuário com o:

```text
restaurant_id
```

Não basta verificar:

```sql
user_roles.user_id = auth.uid()
```

Usar o padrão de autorização existente, preferencialmente:

```text
private.has_restaurant_access(...)
```

ou:

```text
is_team_owner(...)
```

conforme a arquitetura já utilizada pelo projeto.

Garantir:

```text
Restaurant A
   ↓
OAuth State A

Restaurant B
   ↓
OAuth State B
```

Um usuário de A jamais poderá:

```text
SELECT state B
UPDATE state B
DELETE state B
```

---

# 6. SECURITY DEFINER

Auditar todas as funções:

```text
SECURITY DEFINER
```

especialmente as detectadas pelo Supabase.

Classificar cada função como:

### Pública intencional

Exemplo:

```text
get_public_order
get_public_restaurant
validate_public_coupon
```

### Privada

Deve ter:

```text
REVOKE EXECUTE FROM anon
REVOKE EXECUTE FROM authenticated
```

quando aplicável.

Para funções públicas, verificar:

* argumentos;
* retorno;
* enumeração;
* autorização;
* exposição de dados;
* `search_path`.

Não simplesmente ignorar o alerta.

---

# 7. SEARCH_PATH

Localizar funções com:

```text
search_path
```

mutável/não definido.

Corrigir funções privilegiadas para utilizar um `search_path` explícito conforme o padrão seguro do Supabase.

Exemplo:

```sql
SET search_path = public
```

ou padrão equivalente adotado no projeto.

Priorizar:

```text
SECURITY DEFINER
```

e funções administrativas.

---

# 8. DEPENDÊNCIAS VULNERÁVEIS

Auditar:

```text
@tanstack/react-router
@tanstack/react-start
@tanstack/router-plugin
seroval
```

Identificar versões corrigidas compatíveis com a aplicação.

Atualizar somente para versões estáveis e compatíveis.

Depois executar:

```text
npm audit
```

e:

```text
npm run build
```

e:

```text
typecheck
```

Não realizar upgrade amplo do ecossistema.

---

# TESTES OBRIGATÓRIOS

## Teste 1 — Tenant Isolation

Usuário do Restaurante A tentando acessar dados do Restaurante B.

Resultado esperado:

```text
DENIED
```

---

## Teste 2 — Anonymous Order Enumeration

Anon tentando:

```text
SELECT orders
```

Resultado:

```text
DENIED
```

---

## Teste 3 — Fraudulent Order

Anon tentando criar:

```text
payment_status = paid
status = delivered
```

Resultado:

```text
DENIED
```

---

## Teste 4 — markOrderPaid

Usuário não autorizado tentando marcar pedido como pago.

Resultado:

```text
DENIED
```

---

## Teste 5 — Admin Endpoint

Anon acessando:

```text
/api/admin/monitoring/*
```

Resultado:

```text
401 / 403
```

---

## Teste 6 — Governance

Usuário comum tentando acessar auditoria global.

Resultado:

```text
DENIED
```

---

## Teste 7 — OAuth State

Restaurant A tentando manipular OAuth State do Restaurant B.

Resultado:

```text
DENIED
```

---

## Teste 8 — Public RPC

Testar:

```text
get_public_order
```

com:

* ID válido;
* ID inexistente;
* ID de outro restaurante;
* tentativa de enumeração.

---

# REGRESSÃO

Depois das correções, validar:

```text
Criar pedido → PASS
Pedido pendente → PASS
PIX → PASS
Mercado Pago webhook → PASS
Settlement → PASS
Reconciliation → PASS
Admin monitoring → PASS para super_admin
Governance → PASS para super_admin
OAuth Mercado Pago → PASS
```

---

# INTEGRIDADE DAS FASES

Confirmar:

```text
Fases 5–9  → INTACTAS
Fase 10    → INTACTA
Fase 11    → INTACTA
Fase 12    → INTACTA
Fase 13    → INTACTA
Fase 14    → INTACTA
Fase 15    → INTACTA
Fase 16    → INTACTA
Fase 17    → INTACTA
Fase 18    → INTACTA
```

Nenhuma lógica financeira deve ser reescrita.

---

# CHECKPOINT FINAL

Gerar:

## MESIVO — SECURITY REMEDIATION CHECKPOINT

### P0

* Public Order Insert: PASS
* markOrderPaid Protection: PASS
* Public Orders Select: PASS
* Admin API Authentication: PASS

### P1

* OAuth State Isolation: PASS
* SECURITY DEFINER Audit: PASS
* Dependency Security: PASS

### P2

* search_path Hardening: PASS

### Regression

* Order Creation: PASS
* PIX: PASS
* Webhooks: PASS
* Financial Core: PASS
* Mercado Pago OAuth: PASS

### Build

PASS / FAIL

### Type Check

PASS / FAIL

### Security Audit

PASS / FAIL

---

## RESULTADO

Somente declarar:

**🟢 SECURITY REMEDIATION COMPLETE**

quando os P0 estiverem comprovadamente corrigidos e os testes de regressão passarem.

Se qualquer P0 continuar aberto:

**🔴 SECURITY BLOCKED**

e listar exatamente o problema restante.

Depois de concluir esta sprint, retornar para:

**FASE 19 — MERCADO PAGO PRODUCTION ACTIVATION**

sem reconstruir nenhuma parte já existente. */}
          <Hero />
          <Stats />
          <Bento />
          <ComoFunciona />
          <ComparativoIfood />
          <Depoimentos />
          <Planos />
          <FAQ />
          <CTA />
        </main>
        <Footer />
        <WhatsAppFloat />
      </div>
    </MotionConfig>
  );
}
