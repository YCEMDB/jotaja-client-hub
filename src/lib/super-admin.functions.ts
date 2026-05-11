import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error || !data) {
    throw new Response("Forbidden: super-admin only", { status: 403 });
  }
}

const createTenantSchema = z.object({
  restaurant_name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífen"),
  phone: z.string().trim().max(40).optional().nullable(),
  plan: z.enum(["trial", "essential", "professional"]).default("trial"),
  trial_days: z.number().int().min(0).max(365).default(14),
  owner_full_name: z.string().trim().min(2).max(120),
  owner_email: z.string().trim().email().max(255),
  owner_phone: z.string().trim().max(40).optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let p = "";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) p += chars[bytes[i] % chars.length];
  return p + "!9";
}

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createTenantSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);

    // 1. Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (existing) throw new Response("Esse slug já está em uso", { status: 400 });

    // 2. Find or create user
    const password = genPassword();
    let ownerId: string | null = null;
    let createdNewUser = false;

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users.find((u) => u.email?.toLowerCase() === data.owner_email.toLowerCase());
    if (found) {
      ownerId = found.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.owner_email,
        password,
        email_confirm: true,
        user_metadata: { full_name: data.owner_full_name, phone: data.owner_phone ?? "" },
      });
      if (createErr || !created.user) throw new Response(createErr?.message ?? "Erro ao criar usuário", { status: 500 });
      ownerId = created.user.id;
      createdNewUser = true;
    }

    // 3. Insert restaurant
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + data.trial_days);
    const { data: rest, error: restErr } = await supabaseAdmin
      .from("restaurants")
      .insert({
        name: data.restaurant_name,
        slug: data.slug,
        owner_id: ownerId!,
        plan: data.plan,
        phone: data.phone ?? null,
        is_active: true,
        trial_ends_at: data.plan === "trial" ? trialEnds.toISOString() : null,
      })
      .select("id")
      .single();
    if (restErr) throw new Response(restErr.message, { status: 500 });

    // 4. Insert role (owner) for that restaurant
    await supabaseAdmin.from("user_roles").insert({
      user_id: ownerId!,
      role: "owner",
      restaurant_id: rest.id,
    });

    // 5. Update lead if provided
    if (data.lead_id) {
      await supabaseAdmin.from("signup_leads").update({
        status: "approved",
        restaurant_id: rest.id,
      }).eq("id", data.lead_id);
    }

    return {
      ok: true,
      restaurant_id: rest.id,
      owner_id: ownerId,
      temporary_password: createdNewUser ? password : null,
      created_new_user: createdNewUser,
    };
  });

export const getGlobalMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);

    const now = new Date();
    const start30 = new Date(now); start30.setDate(now.getDate() - 30);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startWeek = new Date(now); startWeek.setDate(now.getDate() - 7);
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const trialSoon = new Date(now); trialSoon.setDate(now.getDate() + 7);

    const [{ data: rests }, { data: orders30 }] = await Promise.all([
      supabaseAdmin.from("restaurants").select("id,name,plan,is_active,trial_ends_at"),
      supabaseAdmin.from("orders").select("restaurant_id,total,status,created_at").gte("created_at", start30.toISOString()),
    ]);

    const restaurants = rests ?? [];
    const totalStores = restaurants.length;
    const activeStores = restaurants.filter((r: any) => r.is_active).length;
    const trialStores = restaurants.filter((r: any) => r.plan === "trial").length;

    const planValues: Record<string, number> = { trial: 0, essential: 99, professional: 199 };
    const mrr = restaurants.filter((r: any) => r.is_active).reduce((s: number, r: any) => s + (planValues[r.plan] ?? 0), 0);

    const validOrders = (orders30 ?? []).filter((o: any) => o.status !== "cancelled");
    const ordersToday = validOrders.filter((o: any) => new Date(o.created_at) >= startToday);
    const ordersWeek = validOrders.filter((o: any) => new Date(o.created_at) >= startWeek);
    const ordersMonth = validOrders.filter((o: any) => new Date(o.created_at) >= startMonth);

    const revenueMonth = ordersMonth.reduce((s: number, o: any) => s + Number(o.total), 0);
    const revenue30 = validOrders.reduce((s: number, o: any) => s + Number(o.total), 0);

    // Daily series
    const dayMap = new Map<string, { orders: number; revenue: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start30); d.setDate(start30.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      dayMap.set(k, { orders: 0, revenue: 0 });
    }
    validOrders.forEach((o: any) => {
      const k = o.created_at.slice(0, 10);
      const cur = dayMap.get(k);
      if (cur) { cur.orders += 1; cur.revenue += Number(o.total); }
    });
    const daily = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

    // Top stores by revenue this month
    const restMap = new Map(restaurants.map((r: any) => [r.id, r]));
    const storeRev = new Map<string, number>();
    ordersMonth.forEach((o: any) => {
      storeRev.set(o.restaurant_id, (storeRev.get(o.restaurant_id) ?? 0) + Number(o.total));
    });
    const topStores = Array.from(storeRev.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, revenue]) => ({ id, name: (restMap.get(id) as any)?.name ?? "—", revenue }));

    // Trials expiring within 7 days
    const expiringTrials = restaurants
      .filter((r: any) => r.plan === "trial" && r.trial_ends_at && new Date(r.trial_ends_at) <= trialSoon && new Date(r.trial_ends_at) >= now)
      .map((r: any) => ({ id: r.id, name: r.name, trial_ends_at: r.trial_ends_at }))
      .sort((a: any, b: any) => a.trial_ends_at.localeCompare(b.trial_ends_at));

    return {
      totals: {
        totalStores,
        activeStores,
        trialStores,
        payingStores: activeStores - trialStores,
        mrr,
        revenueMonth,
        revenue30,
        ordersToday: ordersToday.length,
        ordersWeek: ordersWeek.length,
        ordersMonth: ordersMonth.length,
      },
      daily,
      topStores,
      expiringTrials,
    };
  });
