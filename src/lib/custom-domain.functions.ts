import { createServerFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PLATFORM_HOSTS = [
  "comandahub.online",
  "www.comandahub.online",
  "localhost",
];

function isPlatformHost(host: string) {
  const h = host.toLowerCase().split(":")[0];
  if (PLATFORM_HOSTS.includes(h)) return true;
  if (h.endsWith(".lovable.app")) return true;
  if (h.endsWith(".lovableproject.com")) return true;
  return false;
}

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Resolves the current request host to a restaurant slug
 * when it matches a verified custom_domain. Returns null
 * for the platform domain or unknown hosts.
 */
export const resolveHostToSlug = createServerFn({ method: "GET" }).handler(
  async () => {
    let host = "";
    try {
      host = getRequestHost() ?? "";
    } catch {
      return { slug: null as string | null };
    }
    if (!host || isPlatformHost(host)) return { slug: null };

    const normalized = normalizeDomain(host);

    const { data } = await supabaseAdmin
      .from("restaurants")
      .select("slug, custom_domain, custom_domain_verified, is_active")
      .or(`custom_domain.eq.${normalized},custom_domain.eq.${host.toLowerCase()}`)
      .eq("custom_domain_verified", true)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    return { slug: data?.slug ?? null };
  },
);

/**
 * Saves the custom_domain for a restaurant owned by the caller.
 * Resets verified=false until DNS is re-checked.
 */
export const saveCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        restaurantId: z.string().uuid(),
        domain: z.string().max(255),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const raw = data.domain.trim();
    const domain = raw ? normalizeDomain(raw) : null;

    if (domain && !DOMAIN_REGEX.test(domain)) {
      throw new Error("Domínio inválido. Exemplo: pedido.minhaloja.com.br");
    }

    const { data: r, error: rErr } = await supabase
      .from("restaurants")
      .select("id, owner_id")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!r || r.owner_id !== userId) throw new Error("Sem permissão");

    if (domain) {
      const { data: clash } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .ilike("custom_domain", domain)
        .neq("id", data.restaurantId)
        .limit(1)
        .maybeSingle();
      if (clash) throw new Error("Esse domínio já está em uso por outra loja.");
    }

    const { error } = await supabase
      .from("restaurants")
      .update({
        custom_domain: domain,
        custom_domain_verified: false,
      })
      .eq("id", data.restaurantId);
    if (error) throw new Error(error.message);

    return { ok: true, domain };
  });

/**
 * Tries to verify the configured custom_domain by fetching
 * a marker page over HTTPS. If the response carries the
 * platform marker header OR contains the restaurant slug,
 * mark it as verified.
 */
export const verifyCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ restaurantId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: r, error } = await supabase
      .from("restaurants")
      .select("id, owner_id, slug, custom_domain")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r || r.owner_id !== userId) throw new Error("Sem permissão");
    if (!r.custom_domain) throw new Error("Configure um domínio primeiro");

    const target = `https://${r.custom_domain}/__domain-check`;
    let verified = false;
    let reason = "";
    try {
      const res = await fetch(target, {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": "ComandaHub-DomainCheck/1.0" },
      });
      const marker = res.headers.get("x-comandahub-domain");
      if (marker && marker.toLowerCase() === r.custom_domain.toLowerCase()) {
        verified = true;
      } else {
        const body = await res.text();
        if (body.includes("__comandahub_marker__")) verified = true;
        else reason = `Resposta sem marcador (status ${res.status}).`;
      }
    } catch (e: any) {
      reason = e?.message ?? "Falha ao acessar o domínio.";
    }

    await supabaseAdmin
      .from("restaurants")
      .update({ custom_domain_verified: verified })
      .eq("id", r.id);

    return { verified, reason };
  });
