-- Preserva integralmente os lotes de histórico/echoes do WhatsApp Business.
-- A janela de 30 mensagens fica apenas como cache do atendimento em tempo real.
-- Todas as mensagens originais permanecem na tabela de histórico para paginação.
CREATE OR REPLACE FUNCTION public.whatsapp_coexistencia_registrar_lote(
  p_conversa_id uuid,
  p_mensagens jsonb,
  p_assumir_humano boolean DEFAULT false,
  p_nome text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_atual jsonb;
  v_novas jsonb := '[]'::jsonb;
  v_ultimas jsonb;
  v_ultima timestamptz;
  v_maxima timestamptz;
  v_data timestamptz;
  v_msg jsonb;
  v_chave text;
  v_id text;
  v_vistas text[] := ARRAY[]::text[];
  v_total integer := 0;
  v_adicionadas integer := 0;
BEGIN
  IF p_mensagens IS NULL OR jsonb_typeof(p_mensagens) <> 'array'
     OR jsonb_array_length(p_mensagens) > 500 THEN
    RAISE EXCEPTION 'Lote de mensagens inválido ou maior que 500';
  END IF;

  SELECT COALESCE(mensagens, '[]'::jsonb), ultima_msg
  INTO v_atual, v_ultima
  FROM public.whatsapp_conversas
  WHERE id = p_conversa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversa não encontrada'; END IF;
  v_maxima := v_ultima;

  FOR v_msg IN SELECT value FROM jsonb_array_elements(p_mensagens) LOOP
    IF jsonb_typeof(v_msg) <> 'object' THEN CONTINUE; END IF;
    v_id := NULLIF(v_msg->>'whatsapp_message_id', '');
    v_chave := CASE
      WHEN v_id IS NOT NULL THEN 'meta:' || v_id
      ELSE 'legado:' || md5(jsonb_build_array(
        v_msg->>'role', v_msg->>'content', v_msg->>'timestamp',
        v_msg->>'media_path', v_msg->>'media_url',
        v_msg->>'campaign_id', v_msg->>'manual'
      )::text)
    END;

    -- O registro definitivo é criado antes de qualquer truncamento.
    INSERT INTO public.whatsapp_mensagens_historico(conversa_id, chave, mensagem)
    VALUES (p_conversa_id, v_chave, v_msg)
    ON CONFLICT (conversa_id, chave)
    DO UPDATE SET mensagem = EXCLUDED.mensagem;
    v_total := v_total + 1;

    IF v_chave = ANY(v_vistas) OR (
      v_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_atual) AS e(item)
        WHERE e.item->>'whatsapp_message_id' = v_id
      )
    ) THEN CONTINUE; END IF;
    v_vistas := array_append(v_vistas, v_chave);
    v_novas := v_novas || jsonb_build_array(v_msg);
    v_adicionadas := v_adicionadas + 1;

    BEGIN
      v_data := (v_msg->>'timestamp')::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      v_data := NULL;
    END;
    IF v_data IS NOT NULL THEN
      v_maxima := GREATEST(v_maxima, v_data);
    END IF;
  END LOOP;

  -- Usa o timestamp original do WhatsApp para que importar mensagens antigas
  -- não desloque nem elimine as mensagens mais recentes do cache da conversa.
  SELECT COALESCE(jsonb_agg(s.item ORDER BY s.ts ASC, s.ord ASC), '[]'::jsonb)
  INTO v_ultimas
  FROM (
    SELECT m.item, m.ord, COALESCE(m.item->>'timestamp','') AS ts
    FROM jsonb_array_elements(v_atual || v_novas) WITH ORDINALITY AS m(item,ord)
    ORDER BY COALESCE(m.item->>'timestamp','') DESC, m.ord DESC
    LIMIT 30
  ) s;

  UPDATE public.whatsapp_conversas
  SET mensagens = v_ultimas,
      ultima_msg = COALESCE(GREATEST(v_ultima,v_maxima), ultima_msg),
      modo = CASE WHEN p_assumir_humano THEN 'humano' ELSE modo END,
      nome = CASE WHEN COALESCE(nome,'')='' AND COALESCE(p_nome,'')<>'' THEN LEFT(p_nome,120)
             ELSE nome END
  WHERE id = p_conversa_id;

  RETURN jsonb_build_object(
    'recebidas', v_total,
    'novas_na_janela', v_adicionadas,
    'cache', jsonb_array_length(v_ultimas)
  );
END
$function$;

REVOKE ALL ON FUNCTION public.whatsapp_coexistencia_registrar_lote(uuid,jsonb,boolean,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_coexistencia_registrar_lote(uuid,jsonb,boolean,text)
  TO service_role;
