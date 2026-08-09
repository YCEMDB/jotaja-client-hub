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
          {/* FASE 19 — ONDA 2

MERCADO PAGO CARTÃO — PRODUÇÃO E VALIDAÇÃO FINAL

A Onda 2 foi previamente implementada e auditada.

STATUS ATUAL:

🟡 SANDBOX VERIFIED / PRODUCTION PENDING

A Onda 1 — Mercado Pago PIX permanece:

🟢 PRODUCTION VERIFIED

OBJETIVO

Ativar o Mercado Pago Cartão em produção e comprovar o fluxo financeiro completo com uma transação real e controlada.

Esta execução NÃO deve implementar novas funcionalidades.

REGRAS ABSOLUTAS

NÃO alterar o PIX.

NÃO implementar Refund.

NÃO implementar PagBank.

NÃO iniciar Fase 20.

NÃO refatorar o framework de pagamentos.

NÃO recriar webhook, processing, settlement ou reconciliation.

Reutilizar integralmente as estruturas existentes.

1. PRÉ-CHECK DE PRODUÇÃO

Antes de alterar qualquer configuração, verificar:

credenciais Production do Mercado Pago;

OAuth Production;

Redirect URI;

Webhook Production;

URL pública do webhook;

ambiente utilizado pelo adapter;

secrets;

configuração do restaurante;

conta Mercado Pago conectada.

Não expor ou registrar secrets.

Se qualquer configuração obrigatória estiver ausente:

PARAR e informar exatamente o bloqueador.

Não criar mock para contornar o problema.

2. CONEXÃO DO RESTAURANTE

Validar o fluxo real:

Restaurante
↓
Configurações
↓
Pagamentos
↓
Conectar Mercado Pago
↓
OAuth Production
↓
Autorização
↓
Callback
↓
restaurant_payment_accounts
↓
CONNECTED


Confirmar que a conta Mercado Pago pertence ao restaurante correto.

3. TESTE CONTROLADO DE CARTÃO

Executar uma transação de teste controlada no ambiente de produção, respeitando as condições e mecanismos oficiais do Mercado Pago.

O teste deve comprovar:

Checkout
↓
Tokenização
↓
Server Function
↓
Mercado Pago Production
↓
Autorização
↓
Provider Payment ID


Nunca armazenar:

PAN;

CVV;

dados completos do cartão;

tokens sensíveis em logs.

4. WEBHOOK REAL

Após a transação, verificar o recebimento do webhook real.

Confirmar:

endpoint correto;

assinatura válida;

evento persistido;

provider payment ID;

normalização;

idempotência;

processamento.

Fluxo esperado:

Mercado Pago
↓
Webhook
↓
payment_provider_webhook_logs
↓
PaymentNormalizer
↓
Event Processor


5. PROCESSAMENTO

Confirmar que o evento percorreu corretamente as Fases 5 e 6.

Verificar:

lock;

estado;

watermark;

processamento;

ausência de duplicidade;

tratamento de eventos fora de ordem.

6. SETTLEMENT

Confirmar a passagem pela Fase 7.

Validar:

Pagamento aprovado
↓
Settlement
↓
financial_transactions


Confirmar:

payment_event_id;

restaurant_id;

provider_payment_id;

amount;

currency;

unicidade.

Resultado esperado:

1 pagamento → 1 settlement

7. RECONCILIATION

Comparar os dados do Mercado Pago com os registros do Mesivo.

Validar:

valor;

moeda;

payment ID;

status;

settlement;

taxas, quando disponíveis.

Resultado esperado:

MATCHED

Se houver divergência:

DIVERGENT

Nunca mascarar a divergência.

8. PEDIDO

Confirmar que o pedido correspondente terminou no estado financeiro correto.

Fluxo esperado:

PENDING
↓
PAYMENT PROCESSING
↓
APPROVED
↓
PAID


Confirmar que:

pedido não ficou pendente;

pedido não foi pago duas vezes;

nenhuma transação financeira duplicada foi criada.

9. TESTE DE IDEMPOTÊNCIA

Após o pagamento, verificar o comportamento diante de:

webhook duplicado;

retry;

processamento repetido.

Resultado obrigatório:

1 provider payment
1 payment event
1 settlement
1 financial transaction


10. SEGURANÇA MULTI-TENANT

Validar novamente:

Restaurante A
↓
Conta Mercado Pago A
↓
Pedido A
↓
Transação A


Confirmar que nenhum dado ou credencial de outro restaurante pode ser utilizado.

11. REGRESSÃO DO PIX

Depois da ativação do cartão, executar uma verificação do fluxo PIX.

Confirmar:

criação;

webhook;

processamento;

settlement;

reconciliation.

Resultado obrigatório:

🟢 PIX REGRESSION PASS

Se o PIX quebrar:

PARAR imediatamente e reverter somente a alteração responsável.

12. NÃO DECLARAR PRODUCTION VERIFIED SEM EVIDÊNCIA

Não utilizar como prova:

build PASS;

type check PASS;

sandbox PASS;

documentação atualizada;

código implementado;

padrão request criada.

A única classificação definitiva exige evidência do fluxo de produção.

13. CHECKPOINT FINAL

Gerar:

FASE 19 — ONDA 2

MERCADO PAGO CARTÃO — PRODUCTION VALIDATION CHECKPOINT

Production Configuration

🟢 / 🟡 / 🔴

OAuth

🟢 / 🟡 / 🔴

Card Payment

🟢 / 🟡 / 🔴

Tokenization

🟢 / 🟡 / 🔴

Webhook

🟢 / 🟡 / 🔴

Processing

🟢 / 🟡 / 🔴

Settlement

🟢 / 🟡 / 🔴

Reconciliation

🟢 / 🟡 / 🔴

Idempotency

🟢 / 🟡 / 🔴

Multi-Tenant

🟢 / 🟡 / 🔴

Security

🟢 / 🟡 / 🔴

PIX Regression

🟢 / 🟡 / 🔴

Production E2E

🟢 / 🟡 / 🔴

RESULTADO FINAL

Classificar obrigatoriamente como uma destas três opções:

🟢 PRODUCTION VERIFIED

Fluxo real completo comprovado.

🟡 PRODUCTION PENDING

Produção configurada, mas ainda sem evidência suficiente de transação real completa.

🔴 NOT READY

Existe bloqueador técnico.

REGRA DE ENCERRAMENTO

Se o resultado for:

🟢 PRODUCTION VERIFIED

marcar:

FASE 19 — ONDA 2 — COMPLETE

e NÃO implementar mais nada nesta execução.

O próximo trabalho será planejado separadamente:

REFUND / ESTORNO DO MERCADO PAGO

Se não houver possibilidade de realizar uma transação real neste momento, NÃO inventar evidência e NÃO declarar Production Verified. Registrar exatamente o que falta. */}
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
