import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

const askSchema = z.object({
  restaurantId: z.string().uuid().nullable().optional(),
  messages: z.array(messageSchema).min(1).max(24),
});

const SYSTEM_PROMPT = `Você é o Assistente Mesivo, a IA de suporte dentro do painel administrativo do Mesivo (plataforma brasileira de gestão para restaurantes: pedidos, mesas/comandas, KDS, PDV, caixa, cardápio digital, delivery, estoque, financeiro, cupons, clientes, comunicação e relatórios).

Como responder:
- Sempre em português do Brasil, direto, prático e amigável.
- Foque em resolver o problema do dono/gerente: explique o passo a passo dentro do painel, citando o caminho exato do menu (ex.: "Admin → Configurações → Horários").
- Use os dados de contexto do restaurante quando forem úteis para o diagnóstico.
- Se faltar informação, faça no máximo 1 pergunta objetiva antes de sugerir a solução.
- Nunca invente funcionalidades que não existem. Se algo exigir suporte humano ou acesso de super admin, diga isso claramente.
- Nunca peça nem exiba senhas, tokens ou chaves.
- Use markdown curto (listas numeradas e negrito), sem textos longos demais.

Mapa rápido do painel:
- Painel: visão geral do dia.
- Pedidos: acompanhar/alterar status dos pedidos.
- Mesas: mesas, comandas, sessões e QR Code.
- KDS: tela da cozinha.
- PDV Manual: lançar pedido no balcão.
- Caixa: abertura, sangria, reforço e fechamento.
- Entregas / Entregadores: despacho e motoboys.
- Estoque: ingredientes, movimentações e receitas.
- Cardápio: categorias, produtos, adicionais e preços.
- Cupons: descontos.
- Clientes: base de clientes.
- Equipe: usuários e convites.
- Financeiro / Relatórios: DRE, fluxo de caixa, conciliação e indicadores.
- Comunicação: WhatsApp, automações e conversas.
- Configurações: dados da loja, horários (aberto/fechado/automático), entrega, pagamentos e integrações.`;

export const askAdminAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => askSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      throw new Response("Assistente indisponível: chave de IA não configurada.", { status: 500 });
    }

    let contextBlock = "Nenhum restaurante selecionado.";

    if (data.restaurantId) {
      const { data: restaurant } = await context.supabase
        .from("restaurants")
        .select(
          "id, name, slug, plan, is_active, open_mode, trial_ends_at, subscription_ends_at, active_payment_provider, delivery_enabled, pickup_enabled, dine_in_enabled",
        )
        .eq("id", data.restaurantId)
        .maybeSingle();

      if (restaurant) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [ordersRes, productsRes, tablesRes, cashRes] = await Promise.all([
          context.supabase
            .from("orders")
            .select("status, order_type, total")
            .eq("restaurant_id", restaurant.id)
            .gte("created_at", startOfDay.toISOString())
            .limit(500),
          context.supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .eq("is_active", true),
          context.supabase
            .from("restaurant_tables")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id),
          context.supabase
            .from("cash_sessions")
            .select("id, status, opened_at")
            .eq("restaurant_id", restaurant.id)
            .eq("status", "open")
            .limit(1),
        ]);

        const orders = ordersRes.data ?? [];
        const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
          const key = String(o.status);
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});
        const revenue = orders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + Number(o.total ?? 0), 0);

        contextBlock = [
          `Restaurante: ${restaurant.name} (slug: ${restaurant.slug})`,
          `Plano: ${restaurant.plan ?? "—"} | Ativo: ${restaurant.is_active ? "sim" : "não"}`,
          `Modo de funcionamento (horários): ${restaurant.open_mode ?? "—"}`,
          `Canais: delivery=${restaurant.delivery_enabled ? "on" : "off"}, retirada=${restaurant.pickup_enabled ? "on" : "off"}, salão=${restaurant.dine_in_enabled ? "on" : "off"}`,
          `Provedor de pagamento ativo: ${restaurant.active_payment_provider ?? "—"}`,
          `Fim do teste: ${restaurant.trial_ends_at ?? "—"} | Fim da assinatura: ${restaurant.subscription_ends_at ?? "—"}`,
          `Pedidos hoje: ${orders.length} (${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ") || "nenhum"})`,
          `Faturamento hoje (sem cancelados): R$ ${revenue.toFixed(2)}`,
          `Produtos ativos: ${productsRes.count ?? 0} | Mesas cadastradas: ${tablesRes.count ?? 0}`,
          `Caixa aberto: ${(cashRes.data?.length ?? 0) > 0 ? "sim" : "não"}`,
        ].join("\n");
      }
    }

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    try {
      const result = await generateText({
        model: gateway("openai/gpt-5.6-sol"),
        providerOptions: { lovable: { reasoningEffort: "none" } },
        system: `${SYSTEM_PROMPT}\n\n--- Contexto atual do restaurante ---\n${contextBlock}`,
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });

      return { text: result.text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("askAdminAssistant error", message);
      if (message.includes("429")) {
        throw new Response("Muitas solicitações à IA. Tente novamente em instantes.", { status: 429 });
      }
      if (message.includes("402")) {
        throw new Response("Os créditos de IA acabaram. Recarregue para continuar usando o assistente.", { status: 402 });
      }
      throw new Response("Não consegui falar com a IA agora. Tente novamente.", { status: 500 });
    }
  });
