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
          {/* MESIVO — MIGRAÇÃO OFICIAL PARA DOMÍNIO CANÔNICO

OBJETIVO

O domínio oficial do Mesivo foi alterado para:

https://mesivo.com.br

Este será o DOMÍNIO CANÔNICO OFICIAL DE PRODUÇÃO.

O domínio:

https://www.mesivo.com.br

deve funcionar apenas como alias e redirecionar para:

https://mesivo.com.br

O domínio antigo:

https://comandahub.online

não deve mais ser utilizado como domínio de produção.

REGRA CRÍTICA

Esta execução é exclusivamente para migração de domínio e configuração de produção.

NÃO reconstruir pagamentos.

NÃO alterar adapters.

NÃO alterar a lógica do Mercado Pago.

NÃO alterar o núcleo financeiro.

NÃO alterar as Fases 5–18.

NÃO alterar Home, Landing, Checkout ou Orders.

NÃO criar novas tabelas.

NÃO executar migrations desnecessárias.

NÃO alterar RLS.

NÃO criar mocks.

NÃO utilizar Sandbox como substituto de Production.

1. DOMÍNIOS OFICIAIS

CANÔNICO

https://mesivo.com.br


WWW

https://www.mesivo.com.br


Deve redirecionar para:

https://mesivo.com.br


DOMÍNIO ANTIGO

https://comandahub.online


Deve deixar de ser utilizado em produção.

Não remover referências históricas legítimas.

2. AUDITORIA GLOBAL

Antes de alterar qualquer coisa, pesquisar globalmente por:

comandahub.online


www.comandahub.online


https://comandahub.online


Também pesquisar:

mesivo.com.br


www.mesivo.com.br


Classificar todas as ocorrências.

3. CLASSIFICAÇÃO

Cada ocorrência deve ser classificada como:

A — PRODUÇÃO

Atualizar para:

https://mesivo.com.br


B — WWW

Normalizar para o domínio canônico ou manter apenas quando necessário para o redirect.

C — HISTÓRICA

Não modificar.

D — SANDBOX/TESTE

Avaliar individualmente.

E — LEGADA

Atualizar ou remover somente quando comprovadamente obsoleta.

NÃO fazer substituição cega.

4. MERCADO PAGO — OAUTH

O callback oficial de produção deve ser:

https://mesivo.com.br/api/public/mercadopago/callback


Confirmar:

mercadopagoConnectInit
↓
MercadoPagoAdapter
↓
OAuth Production
↓
callback mesivo.com.br
↓
verify_and_consume_oauth_state
↓
restaurant_payment_accounts


Não alterar:

state;

segurança;

restaurant_id;

OAuth validation;

persistência;

secrets.

Somente corrigir o domínio.

5. MERCADO PAGO — WEBHOOK

O webhook oficial deve ser:

https://mesivo.com.br/api/public/mercadopago-webhook


Confirmar:

endpoint público;

HTTPS;

assinatura;

idempotência;

processamento;

integração com Fases 5–7.

NÃO alterar a lógica do webhook.

6. SUPABASE

Auditar:

Site URL;

Redirect URLs;

OAuth;

callbacks;

CORS;

configurações públicas;

Edge Functions;

integrações.

Domínio canônico:

https://mesivo.com.br


Se www.mesivo.com.br estiver cadastrado como URL adicional, avaliar se deve permanecer apenas como alias.

NÃO alterar:

RLS;

policies;

schema;

migrations.

7. WWW → DOMÍNIO CANÔNICO

Garantir:

www.mesivo.com.br
        ↓
301
        ↓
mesivo.com.br


O objetivo é evitar duas versões independentes do aplicativo.

Confirmar que:

https://www.mesivo.com.br


não cria uma segunda sessão ou uma segunda origem lógica.

8. FRONTEND

Auditar URLs absolutas.

Se houver:

https://comandahub.online


em produção, atualizar para:

https://mesivo.com.br


Não remodelar nenhuma interface.

Não alterar:

Home;

Landing;

Checkout;

Orders;

Cardápio;

componentes visuais.

9. SEO

Atualizar referências oficiais:

canonical;

sitemap;

robots;

Open Graph;

JSON-LD;

llms.txt;

llms-full.txt;

URLs absolutas.

Canonical oficial:

https://mesivo.com.br


Nunca usar:

https://www.mesivo.com.br


como canonical se o domínio sem www for o oficial.

10. CONFIGURAÇÕES DE PRODUÇÃO

Pesquisar variáveis como:

SITE_URL
APP_URL
PUBLIC_URL
BASE_URL
VITE_SITE_URL
VITE_APP_URL
MERCADOPAGO_REDIRECT_URI
MERCADOPAGO_WEBHOOK_URL


ou equivalentes.

Quando forem referências de produção, utilizar:

https://mesivo.com.br


OAuth:

https://mesivo.com.br/api/public/mercadopago/callback


Webhook:

https://mesivo.com.br/api/public/mercadopago-webhook


11. MERCADO PAGO — CONFIGURAÇÃO EXTERNA

Não assumir que o painel do Mercado Pago foi atualizado.

Verificar se for possível.

Caso não seja possível acessar o painel, informar claramente que precisa ser configurado manualmente:

Redirect URI

https://mesivo.com.br/api/public/mercadopago/callback


Webhook

https://mesivo.com.br/api/public/mercadopago-webhook


Evento

payment


NÃO manter o domínio antigo como callback principal.

12. HTTPS

Confirmar:

https://mesivo.com.br


e:

https://www.mesivo.com.br


com certificado válido.

Confirmar que:

http://mesivo.com.br


redireciona para HTTPS.

Idealmente:

http://www.mesivo.com.br
        ↓
https://mesivo.com.br


13. REDIRECTS

Esperado:

http://mesivo.com.br
        ↓
https://mesivo.com.br


http://www.mesivo.com.br
        ↓
https://mesivo.com.br


https://www.mesivo.com.br
        ↓
https://mesivo.com.br


O domínio canônico final deve ser sempre:

https://mesivo.com.br


14. DOCUMENTAÇÃO HISTÓRICA

NÃO alterar relatórios históricos apenas para substituir URLs.

Por exemplo, se uma auditoria anterior registra:

https://comandahub.online/api/public/mercadopago-webhook


e isso representa a realidade daquele momento, preservar.

Apenas atualizar documentação operacional atual quando necessário.

15. TESTES

Executar:

Build

PASS / FAIL


Type Check

PASS / FAIL


Busca residual

Pesquisar:

comandahub.online


Classificar todas as ocorrências restantes.

Canonical

Confirmar:

https://mesivo.com.br


WWW

Confirmar redirect:

www.mesivo.com.br
→
mesivo.com.br


Mercado Pago OAuth

Confirmar:

mesivo.com.br/api/public/mercadopago/callback


Mercado Pago Webhook

Confirmar:

mesivo.com.br/api/public/mercadopago-webhook


16. INTEGRIDADE DAS FASES

Confirmar explicitamente:

Fases 5–9   → INTACTAS
Fase 10     → INTACTA
Fase 11     → INTACTA
Fase 12     → INTACTA
Fase 13     → INTACTA
Fase 14     → INTACTA
Fase 15     → INTACTA
Fase 16     → INTACTA
Fase 17     → INTACTA
Fase 18     → INTACTA


Também:

Financial Core     → INTACTO
Payment Framework  → INTACTO
PIX                → INTACTO
Card               → INTACTO
RLS                → INTACTO
Database Schema    → INTACTO


17. CHECKPOINT FINAL

Gerar:

MESIVO — DOMAIN MIGRATION CHECKPOINT

Canonical Domain

https://mesivo.com.br

WWW Redirect

https://www.mesivo.com.br → https://mesivo.com.br

Old Domain

https://comandahub.online

Production References

PASS / FAIL

Mercado Pago OAuth

PASS / FAIL

Mercado Pago Webhook

PASS / FAIL

Supabase

PASS / FAIL / PENDING

HTTPS

PASS / FAIL

WWW Redirect

PASS / FAIL

SEO / Canonical

PASS / FAIL

Build

PASS / FAIL

Type Check

PASS / FAIL

Residual Old-Domain References

LISTAR

Fases 5–18

INTACTAS

RESULTADO FINAL

Se tudo estiver corretamente migrado:

🟢 MESIVO DOMAIN MIGRATION COMPLETE

Se houver configuração externa pendente:

🟡 MESIVO DOMAIN MIGRATION — EXTERNAL CONFIGURATION PENDING

Listar exatamente o que falta.

NÃO declarar Mercado Pago Production Ready somente porque o domínio foi migrado.

Depois da migração concluída, o próximo passo será:

MERCADO PAGO PRODUCTION
↓
OAUTH
↓
CONECTAR PRIMEIRO RESTAURANTE
↓
VERIFICAR PRODUCTION ACCOUNT
↓
PIX REAL
↓
AUDITORIA E2E
↓
CARTÃO PRODUCTION


A prioridade agora é estabelecer https://mesivo.com.br como única origem canônica de produção e eliminar dependências operacionais do domínio antigo. */}
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
