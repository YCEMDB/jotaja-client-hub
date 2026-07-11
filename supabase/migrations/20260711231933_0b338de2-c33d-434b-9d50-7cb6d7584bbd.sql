-- Cria a chave de criptografia PagBank no Supabase Vault.
-- A RPC private._pagbank_encryption_key() lê de vault.decrypted_secrets;
-- o secret gerado via generate_secret ficou apenas nas Edge Function envs,
-- que o Postgres não enxerga.
DO $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM vault.secrets WHERE name = 'pagbank_token_encryption_key'
  ) INTO v_exists;

  IF NOT v_exists THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(48), 'base64'),
      'pagbank_token_encryption_key',
      'Chave simétrica para criptografar access/refresh tokens do PagBank Connect'
    );
  END IF;
END $$;