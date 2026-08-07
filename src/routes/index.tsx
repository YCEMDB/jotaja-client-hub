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
      <div className="min-h-screen bg-ink text-white p-10 font-mono whitespace-pre-wrap">
        FASE 10 — ARCHITECTURE & IMPLEMENTATION PLAN

FINANCIAL CONTROL CENTER & ADMIN GOVERNANCE

==================================================

IMPORTANTE:

As seguintes fases estão concluídas e congeladas:

FASE 5
Webhook Gateway
STATUS: STABLE

FASE 6
Payment Processing
STATUS: STABLE

FASE 7
Financial Settlement
STATUS: STABLE

FASE 8
Financial Operations
STATUS: STABLE

FASE 9
Financial Analytics
STATUS: STABLE

FASE 0.5
Cleanup & Governance Hardening
STATUS: COMPLETE

Esta fase NÃO altera o núcleo financeiro.
Esta fase cria somente a camada administrativa de controle, observabilidade e governança.

==================================================

1. OBJETIVO

Criar o Financial Control Center do Mesivo.

O objetivo é fornecer ao SuperAdmin uma visão centralizada da saúde financeira da plataforma, sem interferir no processamento dos pagamentos.

Responsabilidades:
- Monitoramento financeiro global.
- Auditoria operacional.
- Saúde dos provedores de pagamento.
- Controle de contas financeiras.
- Acompanhamento de eventos.
- Indicadores administrativos.
- Gestão de incidentes financeiros.

==================================================

2. PRINCÍPIO ARQUITETURAL

O Control Center é uma camada de leitura e governança.

Fluxo permitido:
WEBHOOK → PROCESSING → SETTLEMENT → FINANCIAL DATA → CONTROL CENTER

O Control Center NÃO escreve diretamente em:
- pagamentos;
- pedidos;
- liquidações;
- eventos financeiros.

==================================================

3. ESCOPO AUTORIZADO

Implementar:
✓ Serviços administrativos de consulta.
✓ Dashboard administrativo financeiro.
✓ Indicadores globais.
✓ Auditoria de eventos.
✓ Monitoramento de provedores.
✓ Alertas operacionais.
✓ Histórico de ações administrativas.

==================================================

4. ESCOPO PROIBIDO

NÃO implementar:
❌ Alteração manual de pagamentos.
❌ Cancelamento financeiro direto.
❌ Criação manual de transações.
❌ Bypass de settlement.
❌ Alteração do webhook.
❌ Alteração do processor.
❌ Alteração das regras financeiras existentes.
❌ Acesso sem auditoria.

==================================================

5. ARQUIVOS A CRIAR

Criar:
src/lib/admin/financial-control.service.ts
Responsabilidade:
- Consultas globais financeiras.
- Agregações administrativas.
- Métricas da plataforma.

--------------------------------------------------

Criar:
src/lib/admin/provider-health.service.ts
Responsabilidade:
Monitorar:
- Eventos recebidos.
- Falhas.
- Latência.
- Retries.
- Status dos providers.

--------------------------------------------------

Criar:
src/lib/admin/audit-control.service.ts
Responsabilidade:
- Consultar ações administrativas.
- Histórico.
- Rastreamento.

--------------------------------------------------

Criar:
src/routes/api/admin/financial/*
APIs internas do SuperAdmin.

==================================================

6. MODELOS INTERNOS

Criar:
PlatformFinancialOverview
Formato:
{"{"}
 total_restaurants,
 total_transactions,
 total_volume,
 success_rate,
 failure_rate,
 pending_events
{"}"}

--------------------------------------------------

ProviderHealthStatus
Formato:
{"{"}
 provider,
 events_received,
 failed_events,
 average_processing_time,
 status
{"}"}

--------------------------------------------------

FinancialIncident
Formato:
{"{"}
 type,
 severity,
 restaurant_id,
 event_id,
 created_at,
 status
{"}"}

==================================================

7. NOVAS ROTAS ADMINISTRATIVAS

Criar:
GET /api/admin/financial/overview
Retorna:
- Volume global.
- Restaurantes ativos.
- Pagamentos.

--------------------------------------------------

GET /api/admin/financial/providers
Retorna:
- Saúde dos provedores.

--------------------------------------------------

GET /api/admin/financial/incidents
Retorna:
- Falhas.
- Divergências.
- Eventos críticos.

--------------------------------------------------

GET /api/admin/financial/audit
Retorna:
- Histórico administrativo.

==================================================

8. BANCO DE DADOS

Antes de criar migrations:
AUDITAR estrutura existente.
Priorizar:
Views.
Consultas agregadas.
Índices.
Evitar duplicar:
financial_transactions
payment_logs
reconciliation_logs

==================================================

9. SEGURANÇA ADMINISTRATIVA

Obrigatório:
Toda ação administrativa deve possuir:
- usuário.
- timestamp.
- ação.
- IP/session quando disponível.

Nenhum dado financeiro deve ser acessível sem:
- autenticação.
- autorização.
- permissão SuperAdmin.

==================================================

10. MULTI-TENANT

Mesmo sendo SuperAdmin:
Aplicar:
- Rastreamento de tenant.
- Filtros explícitos.
- Logs de acesso.

Nunca permitir:
Consulta sem contexto.

==================================================

11. OBSERVABILIDADE

Implementar métricas:
Webhook:
- volume recebido.
- falhas.
Processing:
- tempo médio.
- retries.
Settlement:
- divergências.
- pendências.
Analytics:
- consultas.

==================================================

12. ALERTAS OPERACIONAIS

Criar estrutura para detectar:
Alta taxa de falha.
↓
Muitos retries.
↓
Divergência financeira.
↓
Provider instável.

Somente gerar alertas.
Não executar ações automáticas.

==================================================

13. TESTES OBRIGATÓRIOS

TESTE 1
SuperAdmin consulta visão global.
Esperado:
Dados corretos.

------------------------------

TESTE 2
Usuário comum tenta acessar.
Esperado:
Bloqueado.

------------------------------

TESTE 3
Consulta de provider.
Esperado:
Status correto.

------------------------------

TESTE 4
Incidente financeiro criado.
Esperado:
Aparece no monitoramento.

------------------------------

TESTE 5
Auditoria administrativa.
Esperado:
Registro completo.

------------------------------

TESTE 6
Isolamento multi-tenant.
Esperado:
Sem vazamento.

------------------------------

TESTE 7
Grande volume de dados.
Esperado:
Consulta performática.

==================================================

14. ARQUIVOS INTOCÁVEIS

Manter congelados:
src/routes/api/public/payments/webhook.ts
src/lib/payments/*
src/lib/finance/payment-settlement.server.ts
src/lib/analytics/*
src/lib/orders/*
src/routes/checkout/*

==================================================

15. CRITÉRIOS DE CONCLUSÃO

✅ Control Center funcionando.
✅ SuperAdmin com visão financeira global.
✅ Auditoria administrativa ativa.
✅ Monitoramento de providers funcionando.
✅ Alertas estruturados.
✅ Multi-tenant validado.
✅ Nenhuma alteração no núcleo financeiro.
✅ Fases 5-9 permanecem intactas.

==================================================

FASE 10 — FINANCIAL CONTROL CENTER & ADMIN GOVERNANCE

PLANO CONCLUÍDO.

STATUS:
🟡 AGUARDANDO APROVAÇÃO PARA INICIAR IMPLEMENTAÇÃO.

NÃO IMPLEMENTAR NADA ATÉ APROVAÇÃO DO PLANO.
      </div>
  );
}
