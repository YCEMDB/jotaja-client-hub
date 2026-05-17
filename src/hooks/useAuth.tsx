import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "owner" | "employee";

export type RestaurantBrief = {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean;
  plan?: string | null;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
};

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isSuperAdmin: boolean;
  /** True while loading roles/restaurants metadata after sign-in. */
  metaLoading: boolean;
  /** Active restaurant id (own restaurant for owners; selected one for super-admin). */
  restaurantId: string | null;
  /** Available restaurants (owner = own; super_admin = all). */
  restaurants: RestaurantBrief[];
  selectRestaurant: (id: string) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const SELECTED_KEY = "comanda.selectedRestaurantId";
const META_CACHE_KEY = "comanda.authMeta.v1";

type CachedMeta = {
  uid: string;
  roles: AppRole[];
  restaurants: RestaurantBrief[];
  restaurantId: string | null;
};

function readCachedMeta(): CachedMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(META_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedMeta) : null;
  } catch {
    return null;
  }
}

function writeCachedMeta(m: CachedMeta | null) {
  if (typeof window === "undefined") return;
  try {
    if (m) localStorage.setItem(META_CACHE_KEY, JSON.stringify(m));
    else localStorage.removeItem(META_CACHE_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = typeof window !== "undefined" ? readCachedMeta() : null;
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>(cached?.roles ?? []);
  const [restaurants, setRestaurants] = useState<RestaurantBrief[]>(cached?.restaurants ?? []);
  const [restaurantId, setRestaurantId] = useState<string | null>(cached?.restaurantId ?? null);
  const [metaLoading, setMetaLoading] = useState(false);

  const loadMeta = async (uid: string, { silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setMetaLoading(true);
    try {
      const rolesRes = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const r = (rolesRes.data?.map((x) => x.role) as AppRole[]) ?? [];
      setRoles(r);
      const isSA = r.includes("super_admin");

      let list: RestaurantBrief[] = [];
      if (isSA) {
        const { data } = await supabase
          .from("restaurants")
          .select("id,name,slug,is_active,plan,trial_ends_at,subscription_ends_at")
          .order("created_at", { ascending: false });
        list = (data ?? []) as RestaurantBrief[];
      } else {
        const { data } = await supabase
          .from("restaurants")
          .select("id,name,slug,is_active,plan,trial_ends_at,subscription_ends_at")
          .eq("owner_id", uid);
        list = (data ?? []) as RestaurantBrief[];
      }
      setRestaurants(list);

      const stored = typeof window !== "undefined" ? localStorage.getItem(SELECTED_KEY) : null;
      const valid = stored && list.some((x) => x.id === stored) ? stored : null;
      const finalRid = valid ?? list[0]?.id ?? null;
      setRestaurantId(finalRid);
      writeCachedMeta({ uid, roles: r, restaurants: list, restaurantId: finalRid });
    } finally {
      if (!silent) setMetaLoading(false);
    }
  };

  useEffect(() => {
    let currentUid: string | null = cached?.uid ?? null;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      const newUid = s?.user?.id ?? null;
      if (newUid && newUid !== currentUid) {
        currentUid = newUid;
        const cachedNow = readCachedMeta();
        const silent = !!cachedNow && cachedNow.uid === newUid;
        setTimeout(() => loadMeta(newUid, { silent }), 0);
      } else if (!newUid) {
        currentUid = null;
        setRoles([]);
        setRestaurants([]);
        setRestaurantId(null);
        writeCachedMeta(null);
      }
      // TOKEN_REFRESHED / mesma sessão: não recarrega meta (evita splash ao trocar de aba)
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const sameAsCache = cached?.uid === s.user.id;
        currentUid = s.user.id;
        // Com cache válido para o mesmo usuário, revalida em background sem splash
        loadMeta(s.user.id, { silent: sameAsCache });
      } else {
        writeCachedMeta(null);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(SELECTED_KEY);
    writeCachedMeta(null);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await loadMeta(user.id);
  };

  const selectRestaurant = (id: string) => {
    localStorage.setItem(SELECTED_KEY, id);
    setRestaurantId(id);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        metaLoading,
        roles,
        isSuperAdmin: roles.includes("super_admin"),
        restaurantId,
        restaurants,
        selectRestaurant,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
