
-- P0.3: RPC para acesso público seguro a pedidos
DROP FUNCTION IF EXISTS public.get_public_order(UUID);

CREATE OR REPLACE FUNCTION public.get_public_order(p_order_id UUID)
RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    status order_status,
    payment_status payment_status,
    customer_name TEXT,
    total NUMERIC,
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    pix_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.restaurant_id,
        o.status,
        o.payment_status,
        o.customer_name,
        o.total,
        o.pix_qr_code,
        o.pix_qr_code_base64,
        o.pix_expires_at,
        o.created_at
    FROM public.orders o
    WHERE o.id = p_order_id;
END;
$$;
