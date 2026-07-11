
REVOKE EXECUTE ON FUNCTION public.create_category(uuid,text,text,int,uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_category(uuid,text,text,int,uuid,boolean,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.archive_category(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_category(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_product(uuid,text,numeric,uuid,text,numeric,text,int,uuid,boolean,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_product(uuid,text,text,uuid,uuid,text,boolean,int,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.archive_product(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_product(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_product_availability(uuid,boolean,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_product_price(uuid,numeric,numeric,numeric,numeric,boolean,text) FROM anon;
NOTIFY pgrst, 'reload schema';
