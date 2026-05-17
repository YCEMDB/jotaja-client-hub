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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantBrief[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const loadMeta = async (uid: string) => {
    setMetaLoading(true);
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
      setRestaurantId(valid ?? list[0]?.id ?? null);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    let currentUid: string | null = null;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      const newUid = s?.user?.id ?? null;
      if (newUid && newUid !== currentUid) {
        currentUid = newUid;
        setTimeout(() => loadMeta(newUid), 0);
      } else if (!newUid) {
        currentUid = null;
        setRoles([]);
        setRestaurants([]);
        setRestaurantId(null);
      }
      // TOKEN_REFRESHED / mesma sessão: não recarrega meta (evita splash ao trocar de aba)
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadMeta(s.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(SELECTED_KEY);
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
