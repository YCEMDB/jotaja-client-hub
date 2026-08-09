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

MERCADO PAGO CARTÃO — PRODUCTION ACTIVATION

A auditoria forense E2E da Onda 2 foi concluída.

STATUS ATUAL:

🟡 SANDBOX VERIFIED / PRODUCTION PENDING

A Onda 1 — Mercado Pago PIX permanece:

🟢 PRODUCTION VERIFIED

O objetivo desta etapa é exclusivamente ativar e validar o Mercado Pago Cartão em produção.

REGRA ABSOLUTA

NÃO implementar novas funcionalidades.

NÃO implementar Refund.

NÃO implementar PagBank.

NÃO iniciar Fase 20.

NÃO alterar a arquitetura de pagamentos.

NÃO alterar o fluxo PIX.

NÃO modificar as Fases 5–18 salvo se uma falha comprovada impedir a ativação.

1. CONFIGURAÇÃO DE PRODUÇÃO

Auditar e configurar somente o necessário para produção:

Mercado Pago Production credentials;

OAuth Production;

redirect URI de produção;

webhook de produção;

secrets;

ambiente;

URLs;

configuração do adapter.

Nunca colocar credenciais diretamente no código.

Nunca expor secrets no frontend.

Nunca registrar tokens nos logs.

2. OAUTH

Validar o fluxo real:

Restaurante
↓
Conectar Mercado Pago
↓
OAuth Production
↓
Autorização
↓
Callback
↓
Conta vinculada ao restaurant_id
↓
CONNECTED


Confirmar que cada restaurante utiliza sua própria conta Mercado Pago.

3. CARTÃO REAL

Realizar um teste controlado de produção.

Fluxo:

Cliente
↓
Checkout
↓
Tokenização oficial Mercado Pago
↓
Mesivo Server Function
↓
Mercado Pago Production
↓
Autorização
↓
Webhook
↓
Processing
↓
Settlement
↓
Reconciliation
↓
Pedido PAID


O teste deve utilizar uma operação autorizada e controlada.

Não armazenar dados sensíveis do cartão.

4. VALIDAR APROVAÇÃO

Confirmar que o pagamento real:

recebeu provider payment ID;

foi aprovado;

recebeu webhook;

foi processado;

atualizou o pedido;

criou settlement;

apareceu em financial_transactions;

passou pela reconciliação.

5. VALIDAR WEBHOOK

Confirmar que o webhook de produção:

chegou;

teve assinatura validada;

foi persistido;

foi normalizado;

foi processado;

não gerou duplicidade.

6. VALIDAR IDEMPOTÊNCIA

Após o teste aprovado, verificar:

1 pagamento
1 evento financeiro
1 settlement


Confirmar que retries ou eventos duplicados não criaram novas transações.

7. VALIDAR MULTI-TENANT

Confirmar que:

Restaurante A
→ Mercado Pago A
→ Pedido A
→ Transação A


Não pode acessar ou utilizar:

Mercado Pago B
Pedido B
Transação B


8. VALIDAR PIX APÓS ATIVAÇÃO

Executar uma regressão mínima do PIX.

Confirmar:

criação;

webhook;

processing;

settlement;

reconciliation.

O resultado obrigatório é:

🟢 PIX REGRESSION PASS

Se houver qualquer regressão:

PARAR E REVERTER A ALTERAÇÃO.

9. OBSERVABILIDADE

Confirmar integração com:

Monitoring;

Security;

Governance;

Incident Management;

Reliability;

Integrity.

Qualquer erro crítico deve gerar evidência adequada nos mecanismos já existentes.

10. NÃO DECLARAR SUCESSO PREMATURAMENTE

Não considerar:

build PASS;

type check PASS;

sandbox PASS;

payment request criada;

como prova de produção.

A classificação PRODUCTION VERIFIED exige evidência do fluxo real:

Checkout
→ Mercado Pago Production
→ pagamento aprovado
→ webhook real
→ processamento
→ settlement
→ reconciliation


11. CHECKPOINT FINAL

Gerar:

FASE 19 — ONDA 2

MERCADO PAGO CARTÃO — PRODUCTION ACTIVATION CHECKPOINT

OAuth Production

Status.

Card Payment Production

Status.

Tokenization

Status.

Webhook

Status.

Processing

Status.

Settlement

Status.

Reconciliation

Status.

Multi-Tenant

Status.

Idempotency

Status.

Security

Status.

PIX Regression

Status.

Production E2E

Status.

CLASSIFICAÇÃO

🟢 PRODUCTION VERIFIED

Somente se o fluxo real completo tiver sido comprovado.

🟡 PRODUCTION CONFIGURED / VALIDATION PENDING

Se produção estiver configurada, mas ainda não houver transação real validada.

🔴 NOT READY

Se houver bloqueador.

REGRA FINAL

Se o resultado for:

🟢 PRODUCTION VERIFIED

então a Fase 19 — Onda 2 estará oficialmente concluída.

Somente depois disso será permitido planejar a próxima etapa:

REFUND / ESTORNO

Não implementar Refund nesta execução. */}
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
