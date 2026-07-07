
-- Sprint 6.3 Fase D: Editor visual do mapa de mesas.
-- Adiciona colunas de layout (tamanho, rotação, forma) e RPC de save em lote.

ALTER TABLE public.restaurant_tables
  ADD COLUMN IF NOT EXISTS width    int  NOT NULL DEFAULT 96  CHECK (width  BETWEEN 40 AND 400),
  ADD COLUMN IF NOT EXISTS height   int  NOT NULL DEFAULT 96  CHECK (height BETWEEN 40 AND 400),
  ADD COLUMN IF NOT EXISTS rotation int  NOT NULL DEFAULT 0   CHECK (rotation BETWEEN -180 AND 360),
  ADD COLUMN IF NOT EXISTS shape    text NOT NULL DEFAULT 'rect' CHECK (shape IN ('rect','circle'));

-- Estende get_table_map para retornar as novas colunas mantendo o schema atual.
CREATE OR REPLACE FUNCTION public.get_table_map(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_out jsonb;
BEGIN
  IF NOT public._tables_can_manage(p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.number), '[]'::jsonb) INTO v_out FROM (
    SELECT
      t.id, t.number, t.name, t.area, t.capacity, t.qr_token, t.is_active,
      t.position_x, t.position_y, t.width, t.height, t.rotation, t.shape,
      s.id           AS session_id,
      s.status       AS session_status,
      s.opened_at,
      s.party_size,
      s.customer_name,
      COALESCE(o.total_open,0)::numeric(10,2) AS current_total,
      COALESCE(o.n_open,0)::int               AS open_orders,
      CASE
        WHEN NOT t.is_active           THEN 'inactive'
        WHEN s.status = 'blocked'      THEN 'blocked'
        WHEN s.status IN ('open','closing') THEN s.status::text
        ELSE 'free'
      END AS ui_status
    FROM public.restaurant_tables t
    LEFT JOIN LATERAL (
      SELECT * FROM public.table_sessions
       WHERE table_id = t.id AND status IN ('open','closing','blocked')
       ORDER BY opened_at DESC LIMIT 1
    ) s ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(o.total),0) AS total_open, count(*) AS n_open
        FROM public.orders o
       WHERE o.table_session_id = s.id AND o.status::text <> 'cancelled'
    ) o ON true
    WHERE t.restaurant_id = p_restaurant_id
  ) x;
  RETURN v_out;
END $$;

-- Batch save do layout visual. Aceita array jsonb com { id, position_x, position_y, width, height, rotation, area, shape }.
-- Cada item é aplicado somente se pertencer ao restaurante e o caller for team_owner.
CREATE OR REPLACE FUNCTION public.update_table_layout(p_restaurant_id uuid, p_updates jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_item jsonb;
  v_count int := 0;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;
  IF p_updates IS NULL OR jsonb_typeof(p_updates) <> 'array' THEN
    RAISE EXCEPTION 'invalid_payload: p_updates deve ser array' USING ERRCODE='invalid_parameter_value';
  END IF;

  FOR v_item IN SELECT jsonb_array_elements(p_updates) LOOP
    UPDATE public.restaurant_tables SET
      position_x = COALESCE((v_item->>'position_x')::int, position_x),
      position_y = COALESCE((v_item->>'position_y')::int, position_y),
      width      = COALESCE((v_item->>'width')::int, width),
      height     = COALESCE((v_item->>'height')::int, height),
      rotation   = COALESCE((v_item->>'rotation')::int, rotation),
      shape      = COALESCE(NULLIF(btrim(v_item->>'shape'),''), shape),
      area       = CASE WHEN v_item ? 'area' THEN NULLIF(btrim(v_item->>'area'),'') ELSE area END
    WHERE id = (v_item->>'id')::uuid
      AND restaurant_id = p_restaurant_id;
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;

  RETURN v_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.update_table_layout(uuid, jsonb) FROM anon;
GRANT  EXECUTE ON FUNCTION public.update_table_layout(uuid, jsonb) TO authenticated;
