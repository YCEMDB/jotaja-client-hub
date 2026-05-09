// Lovable AI - Menu suggestions for restaurants
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, context } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    let system = "Você é um consultor de cardápio para restaurantes brasileiros. Responda em português, de forma prática e objetiva.";
    let user = "";

    if (mode === "categories") {
      system += " Sugira nomes de categorias de cardápio para o restaurante descrito.";
      user = `Restaurante: ${context.name}\nDescrição: ${context.description ?? "(sem descrição)"}\n\nSugira 6 categorias relevantes para o cardápio. Para cada categoria, inclua um nome curto e uma descrição de 1 frase.`;
    } else if (mode === "description") {
      system += " Escreva descrições atrativas e curtas para itens de cardápio.";
      user = `Produto: ${context.name}\nCategoria: ${context.category ?? "—"}\nPreço: R$ ${context.price ?? "—"}\n\nEscreva uma descrição apetitosa de até 2 linhas, destacando ingredientes e diferencial. Não inclua emojis.`;
    } else if (mode === "products") {
      system += " Sugira produtos para uma categoria específica do cardápio.";
      user = `Restaurante: ${context.name}\nCategoria: ${context.category}\n\nSugira 5 produtos com nome, descrição curta e faixa de preço sugerida em reais. Formato: lista numerada.`;
    } else {
      return new Response(JSON.stringify({ error: "modo inválido" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      const message = res.status === 429
        ? "Limite de requisições atingido. Tente em alguns segundos."
        : res.status === 402
        ? "Créditos de IA esgotados. Adicione créditos no workspace."
        : `Erro IA: ${text}`;
      return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
