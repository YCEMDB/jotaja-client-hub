import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar novamente ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FF6534" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "author", content: "Mesivo" },
      { httpEquiv: "content-language", content: "pt-BR" },
      { name: "application-name", content: "Mesivo" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Mesivo" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "msapplication-TileColor", content: "#FF6534" },
      // Defaults — sobrescritos por cada rota
      { title: "Mesivo | Gestão completa para restaurantes" },
      { name: "description", content: "Centralize pedidos, mesas, comandas, cardápio digital, delivery, caixa e gestão do seu restaurante com a Mesivo." },
      { property: "og:site_name", content: "Mesivo" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image:alt", content: "Mesivo — Gestão completa para restaurantes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=Caveat:wght@600;700&display=swap" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=2" },
      { rel: "alternate icon", type: "image/png", sizes: "32x32", href: "/favicon.svg?v=2" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon.svg?v=2" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "mask-icon", href: "/favicon.svg?v=2", color: "#FF6534" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://mesivo.com.br/#organization",
              name: "Mesivo",
              url: "https://mesivo.com.br",
              logo: "https://mesivo.com.br/apple-touch-icon.png",
              description: "Plataforma brasileira para gestão completa de restaurantes: pedidos, mesas, comandas, cardápio digital, delivery, caixa e cozinha em um único lugar.",
              areaServed: "BR",
              sameAs: ["https://mesivo.com.br"],
            },
            {
              "@type": "WebSite",
              "@id": "https://mesivo.com.br/#website",
              url: "https://mesivo.com.br",
              name: "Mesivo",
              inLanguage: "pt-BR",
              publisher: { "@id": "https://mesivo.com.br/#organization" },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://mesivo.com.br/blog?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "SoftwareApplication",
              "@id": "https://mesivo.com.br/#software",
              name: "Mesivo",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, iOS, Android (PWA)",
              url: "https://mesivo.com.br",
              inLanguage: "pt-BR",
              provider: { "@id": "https://mesivo.com.br/#organization" },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body data-optimized-for="# MESIVO — SECURITY REMEDIATION SPRINT

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

sem reconstruir nenhuma parte já existente.">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
