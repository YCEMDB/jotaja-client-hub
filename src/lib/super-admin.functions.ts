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
    .limit(1);
  if (error || !data || data.length === 0) {
    throw new Response("Forbidden: super-admin only", { status: 403 });
  }
}

const createTenantSchema = z.object({
  restaurant_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  plan: z.enum(["trial", "essential", "professional"]).default("trial"),
  trial_days: z.number().int().min(0).max(365).default(14),
  owner_full_name: z.string().trim().min(2).max(120),
  owner_email: z.string().trim().email().max(255),
  owner_phone: z.string().trim().max(40).optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

async function generateUniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "loja";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await supabaseAdmin.from("restaurants").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

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

    // 1. Auto-generate unique slug from restaurant name
    const slug = await generateUniqueSlug(data.restaurant_name);

    // 2. Find or create user — always force a known password so the dono can log in
    const password = genPassword();
    let ownerId: string | null = null;
    let createdNewUser = false;

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users.find((u) => u.email?.toLowerCase() === data.owner_email.toLowerCase());
    if (found) {
      ownerId = found.id;
      // Usuário já existe — reseta senha e confirma o e-mail
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(found.id, {
        password,
        email_confirm: true,
      });
      if (updErr) throw new Response(updErr.message, { status: 500 });
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
        slug,
        owner_id: ownerId!,
        plan: data.plan,
        phone: data.phone ?? null,
        is_active: true,
        trial_ends_at: data.plan === "trial" ? trialEnds.toISOString() : null,
      })
      .select("id")
      .single();
    if (restErr) throw new Response(restErr.message, { status: 500 });

    // 4. Owner role é sincronizado automaticamente pelo trigger sync_owner_role
    //    (Sprint 2.2.a — restaurants.owner_id é a fonte única de verdade).

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
      owner_email: data.owner_email,
      owner_full_name: data.owner_full_name,
      restaurant_name: data.restaurant_name,
      temporary_password: password,
      created_new_user: createdNewUser,
    };
  });

const resetPwdSchema = z.object({ restaurant_id: z.string().uuid() });

export const resetOwnerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => resetPwdSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { data: rest, error } = await supabaseAdmin
      .from("restaurants")
      .select("id,name,owner_id")
      .eq("id", data.restaurant_id)
      .single();
    if (error || !rest) throw new Response("Restaurante não encontrado", { status: 404 });
    const { data: ownerInfo } = await supabaseAdmin.auth.admin.getUserById(rest.owner_id);
    if (!ownerInfo?.user?.email) throw new Response("Dono sem e-mail cadastrado", { status: 400 });
    const password = genPassword();
    const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(rest.owner_id, {
      password,
      email_confirm: true,
    });
    if (upErr) throw new Response(upErr.message, { status: 500 });
    const { data: prof } = await supabaseAdmin.from("profiles").select("full_name").eq("id", rest.owner_id).maybeSingle();
    return {
      ok: true,
      owner_email: ownerInfo.user.email,
      owner_full_name: prof?.full_name ?? null,
      restaurant_name: rest.name,
      temporary_password: password,
    };
  });

const addAdminSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
});

export const addSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => addAdminSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const password = genPassword();
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const found = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
    let userId: string;
    let createdNewUser = false;
    if (found) {
      userId = found.id;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(found.id, { password, email_confirm: true });
      if (error) throw new Response(error.message, { status: 500 });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });
      if (error || !created.user) throw new Response(error?.message ?? "Erro ao criar usuário", { status: 500 });
      userId = created.user.id;
      createdNewUser = true;
    }
    // Insere role (ignora duplicata)
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!existing) {
      const { error } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "super_admin",
        restaurant_id: null,
      });
      if (error) throw new Response(error.message, { status: 500 });
    }
    return {
      ok: true,
      user_id: userId,
      email: data.email,
      full_name: data.full_name,
      temporary_password: password,
      created_new_user: createdNewUser,
    };
  });

const removeAdminSchema = z.object({ user_id: z.string().uuid() });
export const removeSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => removeAdminSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Response("Você não pode remover seu próprio acesso", { status: 400 });
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", "super_admin");
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const listSuperAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,created_at")
      .eq("role", "super_admin");
    const ids = (roles ?? []).map((r: any) => r.user_id);
    if (!ids.length) return { admins: [] as any[] };
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id,full_name,email")
      .in("id", ids);
    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    // Fallback: fetch emails via auth.admin for users sem profile
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const userMap = new Map((usersList?.users ?? []).map((u) => [u.id, u]));
    const admins = (roles ?? []).map((r: any) => {
      const p: any = profMap.get(r.user_id);
      const u = userMap.get(r.user_id);
      return {
        user_id: r.user_id,
        email: p?.email ?? u?.email ?? null,
        full_name: p?.full_name ?? u?.user_metadata?.full_name ?? null,
        added_at: r.created_at,
        is_self: r.user_id === context.userId,
      };
    });
    return { admins };
  });

// ---- Reset (limpa pedidos/clientes da loja, zera contadores) ----
const resetTenantSchema = z.object({ restaurant_id: z.string().uuid() });
export const resetTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => resetTenantSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const rid = data.restaurant_id;
    // pega ids de orders pra apagar items
    const { data: ords } = await supabaseAdmin.from("orders").select("id").eq("restaurant_id", rid);
    const orderIds = (ords ?? []).map((o: any) => o.id);
    if (orderIds.length) {
      await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
    }
    await supabaseAdmin.from("orders").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("customers").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("restaurants").update({
      order_number_seq: 0,
      monthly_order_count: 0,
    }).eq("id", rid);
    return { ok: true, deleted_orders: orderIds.length };
  });

// ---- Delete completo do restaurante ----
const deleteTenantSchema = z.object({ restaurant_id: z.string().uuid(), confirm_name: z.string() });
export const deleteTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => deleteTenantSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { data: rest } = await supabaseAdmin
      .from("restaurants").select("id,name").eq("id", data.restaurant_id).single();
    if (!rest) throw new Response("Restaurante não encontrado", { status: 404 });
    if (rest.name.trim() !== data.confirm_name.trim()) {
      throw new Response("Nome de confirmação não confere", { status: 400 });
    }
    const rid = data.restaurant_id;
    // children
    const { data: ords } = await supabaseAdmin.from("orders").select("id").eq("restaurant_id", rid);
    const orderIds = (ords ?? []).map((o: any) => o.id);
    if (orderIds.length) await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
    await supabaseAdmin.from("orders").delete().eq("restaurant_id", rid);
    const { data: prods } = await supabaseAdmin.from("products").select("id").eq("restaurant_id", rid);
    const prodIds = (prods ?? []).map((p: any) => p.id);
    if (prodIds.length) {
      const { data: groups } = await supabaseAdmin.from("product_option_groups").select("id").in("product_id", prodIds);
      const gIds = (groups ?? []).map((g: any) => g.id);
      if (gIds.length) await supabaseAdmin.from("product_option_items").delete().in("group_id", gIds);
      await supabaseAdmin.from("product_option_groups").delete().in("product_id", prodIds);
    }
    await supabaseAdmin.from("products").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("categories").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("delivery_areas").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("delivery_drivers").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("coupons").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("customers").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("restaurant_payments").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("user_roles").delete().eq("restaurant_id", rid);
    await supabaseAdmin.from("signup_leads").update({ restaurant_id: null }).eq("restaurant_id", rid);
    await supabaseAdmin.from("restaurants").delete().eq("id", rid);
    return { ok: true };
  });

const metricsSchema = z.object({ restaurant_id: z.string().uuid().optional().nullable() }).optional();
export const getGlobalMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => metricsSchema.parse(i) ?? {})
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const filterId = (data as any)?.restaurant_id ?? null;

    const now = new Date();
    const start30 = new Date(now); start30.setDate(now.getDate() - 30);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startWeek = new Date(now); startWeek.setDate(now.getDate() - 7);
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const trialSoon = new Date(now); trialSoon.setDate(now.getDate() + 7);

    let ordersQ = supabaseAdmin.from("orders").select("restaurant_id,total,status,created_at").gte("created_at", start30.toISOString());
    if (filterId) ordersQ = ordersQ.eq("restaurant_id", filterId);
    const [{ data: rests }, { data: orders30 }] = await Promise.all([
      supabaseAdmin.from("restaurants").select("id,name,plan_id,is_active,trial_ends_at").order("name"),
      ordersQ,
    ]);

    const nowMs = Date.now();
    const isTrial = (r: any) => !!r.trial_ends_at && new Date(r.trial_ends_at).getTime() > nowMs;

    const restaurants = rests ?? [];
    const totalStores = restaurants.length;
    const activeStores = restaurants.filter((r: any) => r.is_active).length;
    const trialStores = restaurants.filter(isTrial).length;

    // Preço mensal por tier real (plan_id). Trial ativo não conta MRR.
    const planValues: Record<string, number> = { starter: 97, pro: 199, business: 399 };
    const mrr = restaurants
      .filter((r: any) => r.is_active && !isTrial(r))
      .reduce((s: number, r: any) => s + (planValues[r.plan_id ?? "starter"] ?? 0), 0);

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

    // Trials expiring within 7 days (baseado em trial_ends_at, não no enum legado)
    const expiringTrials = restaurants
      .filter((r: any) => r.trial_ends_at && new Date(r.trial_ends_at) <= trialSoon && new Date(r.trial_ends_at) >= now)
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
      restaurants: restaurants.map((r: any) => ({ id: r.id, name: r.name })),
      filtered_restaurant_id: filterId,
    };
  });
