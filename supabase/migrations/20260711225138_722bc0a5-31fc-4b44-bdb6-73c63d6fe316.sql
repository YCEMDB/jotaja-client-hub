
ALTER FUNCTION private._pagbank_encrypt(text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION private._pagbank_decrypt(bytea)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.pagbank_connect_init(uuid, text, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.pagbank_connect_complete(text, text, text, integer, text[], text, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.pagbank_rotate_webhook_key(uuid, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
