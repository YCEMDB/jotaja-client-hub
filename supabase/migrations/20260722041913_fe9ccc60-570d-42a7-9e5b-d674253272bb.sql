DROP POLICY IF EXISTS settings_public_select ON public.app_settings;
CREATE POLICY settings_public_select ON public.app_settings
  FOR SELECT
  USING (key IN (
    'public_url',
    'support_whatsapp',
    'support_email',
    'support_hours',
    'maintenance_mode',
    'maintenance_message'
  ));

CREATE OR REPLACE FUNCTION public.admin_upsert_setting(
  p_key text,
  p_value jsonb,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_reason text := btrim(coalesce(p_reason, ''));
  v_key text := btrim(coalesce(p_key, ''));
  v_old jsonb;
  v_new jsonb := p_value;
  v_text text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  PERFORM private.assert_super_admin();

  IF length(regexp_replace(v_reason, '\s', '', 'g')) < 5 THEN
    RAISE EXCEPTION 'reason_required_min_5_chars' USING ERRCODE = '22023';
  END IF;

  IF v_key NOT IN ('support_whatsapp','support_email','company_name','company_cnpj','public_url','maintenance_mode','maintenance_message') THEN
    RAISE EXCEPTION 'setting_key_not_allowed' USING ERRCODE = '22023';
  END IF;

  IF v_new IS NULL OR jsonb_typeof(v_new) = 'null' THEN
    RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
  END IF;

  IF v_key = 'maintenance_mode' THEN
    IF jsonb_typeof(v_new) = 'boolean' THEN
      -- ok, mantém booleano
    ELSIF jsonb_typeof(v_new) = 'string' THEN
      v_text := btrim(v_new #>> '{}');
      IF v_text NOT IN ('true','false') THEN
        RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
      END IF;
      v_new := to_jsonb(v_text::boolean);
    ELSE
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
  ELSIF v_key = 'maintenance_message' THEN
    IF jsonb_typeof(v_new) <> 'string' THEN
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
    v_text := btrim(v_new #>> '{}');
    v_new := to_jsonb(v_text);
  ELSE
    IF jsonb_typeof(v_new) <> 'string' THEN
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
    v_text := btrim(v_new #>> '{}');
    v_new := to_jsonb(v_text);
  END IF;

  IF v_key = 'support_whatsapp' THEN
    IF v_text !~ '^[0-9]{10,15}$' THEN
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
  ELSIF v_key = 'support_email' THEN
    IF v_text !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(v_text) > 254 THEN
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
  ELSIF v_key = 'public_url' THEN
    IF v_text !~* '^https?://[^\s]{3,300}$' THEN
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
  ELSIF v_key = 'company_name' THEN
    IF length(v_text) < 2 OR length(v_text) > 160 THEN
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
  ELSIF v_key = 'company_cnpj' THEN
    IF length(regexp_replace(v_text, '\D', '', 'g')) <> 14 THEN
      RAISE EXCEPTION 'invalid_setting_value' USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT value INTO v_old FROM public.app_settings WHERE key = v_key FOR UPDATE;

  IF v_old IS NOT DISTINCT FROM v_new THEN
    RETURN jsonb_build_object('ok', true, 'changed', false, 'key', v_key);
  END IF;

  INSERT INTO public.app_settings(key, value, updated_at)
    VALUES (v_key, v_new, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  PERFORM private.record_audit(
    p_action := 'admin_upsert_setting',
    p_entity_type := 'app_settings',
    p_entity_id := NULL,
    p_reason := v_reason,
    p_before := jsonb_build_object('key', v_key, 'value', v_old),
    p_after := jsonb_build_object('key', v_key, 'value', v_new)
  );

  RETURN jsonb_build_object('ok', true, 'changed', true, 'key', v_key);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_setting(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_setting(text, jsonb, text) TO authenticated, service_role;

INSERT INTO public.app_settings (key, value) VALUES
  ('maintenance_mode', 'true'::jsonb),
  ('maintenance_message', '"Estamos realizando uma manutenção programada para melhorar ainda mais a sua experiência. Voltaremos em breve."'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;