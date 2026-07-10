-- Fix: get_products_profitability_report referenced non-existent column oi.price.
-- Order items store the price in oi.unit_price. Recreating the function with the correct column.

CREATE OR REPLACE FUNCTION public.get_products_profitability_report(
  p_restaurant_id uuid,
  p_from timestamptz,
  p_to timestamptz
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.total_margin DESC NULLS LAST), '[]'::jsonb) INTO result FROM (
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.price,
      p.promo_price,
      COALESCE(SUM(oi.quantity),0)::int AS units_sold,
      COALESCE(SUM(oi.quantity * oi.unit_price),0)::numeric AS revenue,
      COALESCE((
        SELECT SUM(pr.quantity * si.avg_cost)
        FROM public.product_recipes pr
        JOIN public.stock_ingredients si ON si.id = pr.ingredient_id
        WHERE pr.product_id = p.id
      ),0)::numeric AS unit_cost,
      (COALESCE(p.promo_price, p.price) - COALESCE((
        SELECT SUM(pr.quantity * si.avg_cost)
        FROM public.product_recipes pr
        JOIN public.stock_ingredients si ON si.id = pr.ingredient_id
        WHERE pr.product_id = p.id
      ),0))::numeric AS unit_margin,
      (COALESCE(SUM(oi.quantity),0) *
       (COALESCE(p.promo_price, p.price) - COALESCE((
         SELECT SUM(pr.quantity * si.avg_cost)
         FROM public.product_recipes pr
         JOIN public.stock_ingredients si ON si.id = pr.ingredient_id
         WHERE pr.product_id = p.id
       ),0)))::numeric AS total_margin,
      EXISTS (SELECT 1 FROM public.product_recipes pr WHERE pr.product_id = p.id) AS has_recipe
    FROM public.products p
    LEFT JOIN public.order_items oi ON oi.product_id = p.id
    LEFT JOIN public.orders o ON o.id = oi.order_id
      AND o.created_at >= p_from AND o.created_at < p_to
      AND o.status NOT IN ('cancelled')
    WHERE p.restaurant_id = p_restaurant_id
    GROUP BY p.id, p.name, p.price, p.promo_price
  ) t;

  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.get_products_profitability_report(uuid, timestamptz, timestamptz) TO authenticated;

NOTIFY pgrst, 'reload schema';