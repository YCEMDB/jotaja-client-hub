import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanFeatures = {
  coupons?: boolean;
  drivers?: boolean;
  max_users?: number | null;
  api_access?: boolean;
  auto_print?: boolean;
  manual_pdv?: boolean;
  max_locations?: number | null;
  delivery_zones?: boolean;
  multi_location?: boolean;
  online_payment?: boolean;
  advanced_reports?: boolean;
  priority_support?: boolean;
  max_orders_per_month?: number | null;
  communication_channels_max?: number | null;
  tables_max?: number | null;
  stock?: boolean;
  stock_recipes?: boolean;
  max_ingredients?: number | null;
};

export type PlanInfo = {
  id: string;
  name: string;
  price_monthly: number;
  features: PlanFeatures;
};

const DEFAULT_STARTER: PlanInfo = {
  id: "starter",
  name: "Starter",
  price_monthly: 97,
  features: {
    coupons: false,
    drivers: false,
    max_users: 1,
    api_access: false,
    auto_print: false,
    manual_pdv: false,
    max_locations: 1,
    delivery_zones: true,
    multi_location: false,
    online_payment: false,
    advanced_reports: false,
    priority_support: false,
    max_orders_per_month: 300,
  },
};

export function usePlanFeatures() {
  const { restaurantId } = useAuth();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    if (!restaurantId) { setPlan(null); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: r } = await supabase
        .from("restaurants")
        .select("plan_id")
        .eq("id", restaurantId)
        .maybeSingle();
      const planId = (r as any)?.plan_id || "starter";
      const { data: p } = await supabase
        .from("app_plans")
        .select("id,name,price_monthly,features")
        .eq("id", planId)
        .maybeSingle();
      if (cancel) return;
      setPlan((p as PlanInfo) ?? DEFAULT_STARTER);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [restaurantId]);

  const has = (key: keyof PlanFeatures): boolean => {
    if (!plan) return false;
    const v = plan.features?.[key];
    return v === true || (typeof v === "number" && v > 0) || v === null;
  };

  return { plan, features: plan?.features ?? {}, has, loading };
}
