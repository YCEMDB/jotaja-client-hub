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
          {/* FASE 19 — ONDA 1
MERCADO PAGO PIX — AUDITORIA E2E DE PRODUÇÃO

A Onda 1 da Fase 19 foi implementada e declarada como:
MERCADO PAGO PIX — PRODUCTION READY

Antes de implementar cartão, PagBank ou qualquer nova funcionalidade, realizar uma AUDITORIA FORENSE E2E da implementação atual.

OBJETIVO
Comprovar, através do código, banco, configuração e testes, que um restaurante consegue:
conectar sua conta Mercado Pago;
criar um PIX real;
receber o pagamento;
receber o webhook;
processar o evento;
atualizar o pedido;
registrar a liquidação financeira;
reconciliar os valores;
manter isolamento multi-tenant;
impedir duplicidade financeira.

NÃO implementar novas funcionalidades nesta etapa.
NÃO alterar a Home.
NÃO alterar Landing.
NÃO implementar cartão.
NÃO implementar PagBank.
NÃO criar novos engines.
NÃO modificar as Fases 5–18 sem evidência de falha.

1. CONEXÃO DO RESTAURANTE — OAUTH
Verificar diretamente no código se o fluxo realmente permite:
Restaurante → Configurações → Pagamentos → Conectar Mercado Pago → OAuth Mercado Pago → Autorização → Callback → Tokens armazenados com segurança → restaurant_id vinculado → Mercado Pago = CONNECTED

Confirmar:
OAuth realmente implementado; client ID; redirect URI; callback; authorization code; access token; refresh token, se aplicável; expiração; renovação; armazenamento seguro; vínculo com restaurant_id; desconexão; reconexão.

TESTE MULTI-TENANT
Criar/verificar: Restaurante A → Conta MP A | Restaurante B → Conta MP B
Confirmar que A jamais consegue utilizar credenciais de B.

2. CREDENCIAIS
Auditar: onde são armazenadas; como são criptografadas; como são recuperadas; quem pode recuperá-las; se aparecem no frontend; se aparecem nos logs; se aparecem em erros; se aparecem nas respostas das APIs.
Procurar especificamente por: access_token; refresh_token; client_secret; api_key; webhook_secret.
Nenhum segredo pode ser retornado ao browser.

3. CRIAÇÃO DO PIX
Auditar: mercadopagoCreateRealPix
Verificar: autenticação; autorização; restaurant_id; order_id; valor; moeda; referência externa; idempotência; provider; credencial correta; endpoint de produção; tratamento de erros.
O valor enviado ao Mercado Pago deve ser derivado do pedido canônico do Mesivo. Nunca confiar no valor enviado diretamente pelo frontend.

4. BANCO
Verificar o fluxo: order → order_payment → payment_create_pending → Mercado Pago → provider_payment_id
Confirmar consistência entre: order_id; restaurant_id; amount; currency; provider; provider_payment_id; status.
Verificar se existe possibilidade de: pagamento órfão; pedido sem pagamento; pagamento duplicado; payment_id duplicado; tenant incorreto.

5. WEBHOOK REAL
Auditar o webhook existente. Confirmar: endpoint correto; ambiente production; assinatura; HMAC; timestamp; replay protection; event ID; payment ID; provider; identificação do restaurante; persistência do payload; idempotência.
Confirmar que: Webhook duplicado → NÃO cria segundo evento financeiro.

6. PROCESSAMENTO
Validar: Webhook → Fase 5 → VALIDATED → Fase 6 → PROCESSING → PROCESSED
Confirmar: lock; concorrência; eventos fora de ordem; watermark; retries; falhas; recuperação.

7. SETTLEMENT
Validar: PROCESSED → Settlement → financial_transactions
Confirmar: payment_event_id; restaurant_id; provider payment ID; amount; currency; unicidade; idempotência.
Executar cenário: Mesmo evento recebido 2x | Resultado obrigatório: 1 evento processado, 1 settlement, 0 duplicidades.

8. RECONCILIATION
Comparar: Mercado Pago VS Mesivo
Verificar: amount; payment status; provider payment ID; settlement; fees; net amount.
Resultado esperado: MATCHED. Caso haja divergência: DIVERGENT (Nunca mascarar).

9. STATUS DO PEDIDO
Validar a máquina: PENDING → PIX CREATED → CUSTOMER PAID → WEBHOOK → PROCESSED → PAID
Verificar também: pagamento recusado; pagamento expirado; cancelamento; webhook atrasado; webhook fora de ordem; duplicação.
Confirmar que um evento antigo não consegue alterar: PAID → PENDING.

10. POLLING
Auditar se polling existe. Confirmar: acionamento; frequência; limite; idempotência; concorrência.
Webhook e polling nunca podem produzir duplicidade financeira.

11. TESTE E2E SANDBOX
Executar: Conectar MP, Criar PIX, Pagamento aprovado, Webhook válido, Webhook duplicado, Webhook inválido, Evento fora de ordem, Falha no processamento, Retry, Settlement, Reconciliation, Multi-tenant.

12. TESTE REAL DE PRODUÇÃO
Executar teste controlado se disponível. Fluxo: Conectar → Pedido → PIX → Pagamento → Webhook → Processing → Settlement → Reconciliation → Pedido PAID.
Registrar somente metadados seguros. NUNCA registrar tokens ou secrets.

13. SEGURANÇA
Auditar: RLS; server-side authorization; tenant isolation; OAuth; webhook signature; secrets; logs; rate limiting; replay; idempotência.
Identificar/Bloquear: Tenant Escape, Replay, Duplicate, Amount Tampering.

14. REGRESSÃO
Confirmar que a Onda 1 NÃO quebrou: pedidos, checkout, cardápio, Fases 5–18, financeiro, monitoramento, governança, segurança.

15. NÃO CORRIGIR AUTOMATICAMENTE
Se falha: PARAR, Registrar problema, Evidência, Severidade. Apenas correções mínimas necessárias. Não refatorar.

16. RELATÓRIO FINAL OBRIGATÓRIO
Gerar: FASE 19 — ONDA 1: MERCADO PAGO PIX — FORENSIC E2E AUDIT.
Classificar como: 🟢 PRODUCTION VERIFIED, 🟡 PRODUCTION READY — VALIDATION PENDING, ou 🔴 NOT READY.

REGRA FINAL
NÃO iniciar Cartão, Refund, PagBank ou Fase 20 até resultado claro.
Pergunta única: "Um restaurante consegue conectar seu MP e receber um PIX real no Mesivo com fluxo correto?"
Resposta: SIM — PRODUCTION VERIFIED. */}
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
