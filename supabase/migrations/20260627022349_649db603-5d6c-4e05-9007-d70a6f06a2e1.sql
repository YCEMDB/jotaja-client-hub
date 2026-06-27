
CREATE OR REPLACE FUNCTION public.get_public_categories(p_slug text)
RETURNS TABLE(id uuid, name text, "position" int, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c."position", c.is_active
  FROM public.categories c
  JOIN public.restaurants r ON r.id = c.restaurant_id
  WHERE r.slug = p_slug AND c.is_active = true
  ORDER BY c."position" NULLS LAST, c.name;
$$;
REVOKE ALL ON FUNCTION public.get_public_categories(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_categories(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_products(p_slug text)
RETURNS TABLE(
  id uuid, name text, description text, price numeric,
  promo_price numeric, image_url text, category_id uuid, is_available boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.description, p.price, p.promo_price,
         p.image_url, p.category_id, p.is_available
  FROM public.products p
  JOIN public.restaurants r ON r.id = p.restaurant_id
  WHERE r.slug = p_slug AND p.is_available = true
  ORDER BY p."position" NULLS LAST, p.name;
$$;
REVOKE ALL ON FUNCTION public.get_public_products(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_products(text) TO anon, authenticated;
