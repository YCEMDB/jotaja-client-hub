-- Sprint 2.2.b: Horários unificados
-- 1) Backfill: lojas com is_open=false legado viram force_closed (apenas se estiverem em modo auto)
UPDATE public.restaurants
   SET open_mode = 'force_closed'
 WHERE is_open IS DISTINCT FROM true
   AND COALESCE(open_mode, 'auto') = 'auto';

-- 2) Normaliza is_open para true em todos (deprecado, sem uso lógico); mantém coluna por compat
UPDATE public.restaurants SET is_open = true WHERE is_open IS DISTINCT FROM true;

COMMENT ON COLUMN public.restaurants.is_open IS
  'DEPRECATED. Não usar como regra de negócio. Fonte oficial: open_mode + opening_hours + timezone (ver is_restaurant_open_now).';

-- 3) is_restaurant_open_now: deixa de considerar is_open. Fonte única = open_mode + opening_hours + timezone.
CREATE OR REPLACE FUNCTION public.is_restaurant_open_now(p_restaurant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r RECORD;
  v_local TIMESTAMPTZ;
  v_dow INT;
  v_key TEXT;
  v_day JSONB;
  v_open TIME;
  v_close TIME;
  v_now TIME;
BEGIN
  SELECT is_active, open_mode, timezone, opening_hours
    INTO r FROM public.restaurants WHERE id = p_restaurant_id;
  IF NOT FOUND OR r.is_active IS DISTINCT FROM true THEN RETURN false; END IF;

  IF r.open_mode = 'force_open'   THEN RETURN true;  END IF;
  IF r.open_mode = 'force_closed' THEN RETURN false; END IF;

  -- open_mode = 'auto' (ou nulo): segue calendário
  IF r.opening_hours IS NULL THEN RETURN false; END IF;

  v_local := timezone(COALESCE(r.timezone,'America/Sao_Paulo'), now());
  v_dow   := EXTRACT(DOW FROM v_local)::int;
  v_key   := (ARRAY['sun','mon','tue','wed','thu','fri','sat'])[v_dow + 1];
  v_day   := r.opening_hours -> v_key;
  IF v_day IS NULL OR COALESCE((v_day->>'closed')::boolean,false) THEN RETURN false; END IF;

  BEGIN
    v_open  := (v_day->>'open')::time;
    v_close := (v_day->>'close')::time;
  EXCEPTION WHEN OTHERS THEN RETURN false;
  END;
  IF v_open IS NULL OR v_close IS NULL THEN RETURN false; END IF;

  v_now := v_local::time;
  IF v_close > v_open THEN
    RETURN v_now >= v_open AND v_now < v_close;
  ELSE
    -- Overnight (18:00 -> 02:00)
    RETURN v_now >= v_open OR v_now < v_close;
  END IF;
END $function$;