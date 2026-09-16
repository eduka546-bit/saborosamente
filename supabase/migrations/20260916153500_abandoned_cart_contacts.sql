-- Enriquece carrinhos abandonados com nome/telefone do perfil autenticado
-- e mantém futuros snapshots com os dados necessários para recuperação via WhatsApp.

UPDATE public.carrinhos_abandonados c
SET nome = COALESCE(c.nome, p.nome),
    telefone = COALESCE(c.telefone, p.telefone),
    updated_at = GREATEST(c.updated_at, now())
FROM public.profiles p
WHERE p.id = c.user_id
  AND (
    c.nome IS NULL OR btrim(c.nome) = '' OR
    c.telefone IS NULL OR btrim(c.telefone) = ''
  );

CREATE OR REPLACE FUNCTION public.save_abandoned_cart(
  p_session_id text,
  p_itens jsonb,
  p_valor_total numeric,
  p_origem text DEFAULT 'timeout'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_id uuid;
  v_user_id uuid := (SELECT auth.uid());
  v_email text := NULLIF((SELECT auth.jwt() ->> 'email'), '');
  v_nome text;
  v_telefone text;
BEGIN
  IF p_session_id IS NULL
     OR length(p_session_id) NOT BETWEEN 20 AND 128
     OR p_session_id !~ '^sess_[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Sessão inválida' USING ERRCODE = '22023';
  END IF;
  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) > 100 THEN
    RAISE EXCEPTION 'Itens inválidos' USING ERRCODE = '22023';
  END IF;
  IF p_valor_total IS NULL OR p_valor_total < 0 OR p_valor_total > 100000 THEN
    RAISE EXCEPTION 'Valor inválido' USING ERRCODE = '22023';
  END IF;
  IF p_origem NOT IN ('timeout', 'exit_intent', 'manual') THEN
    RAISE EXCEPTION 'Origem inválida' USING ERRCODE = '22023';
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT NULLIF(btrim(p.nome), ''), NULLIF(btrim(p.telefone), '')
      INTO v_nome, v_telefone
    FROM public.profiles p
    WHERE p.id = v_user_id
    LIMIT 1;
  END IF;

  SELECT c.id INTO v_id
  FROM public.carrinhos_abandonados c
  WHERE c.session_id = p_session_id
    AND (c.user_id IS NULL OR c.user_id = v_user_id)
  ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.carrinhos_abandonados (
      session_id, user_id, nome, telefone, email, itens, valor_total, status, origem, updated_at
    ) VALUES (
      p_session_id, v_user_id, v_nome, v_telefone, v_email,
      p_itens, p_valor_total, 'abandonado', p_origem, now()
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.carrinhos_abandonados
    SET user_id = COALESCE(v_user_id, user_id),
        nome = COALESCE(v_nome, nome),
        telefone = COALESCE(v_telefone, telefone),
        email = COALESCE(v_email, email),
        itens = p_itens,
        valor_total = p_valor_total,
        status = 'abandonado',
        origem = p_origem,
        updated_at = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;
