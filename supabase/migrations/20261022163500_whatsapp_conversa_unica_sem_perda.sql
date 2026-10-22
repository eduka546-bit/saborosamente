-- Hotfix: consolidar históricos e impedir várias linhas por telefone.
-- Preserva backups das linhas consolidadas. Aplicar antes da nova edge function.

-- Os backups não podem ser acessados pelo navegador, nem por usuários logados.
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas_backup_dedup_20261022
  (LIKE public.whatsapp_conversas INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
ALTER TABLE public.whatsapp_conversas_backup_dedup_20261022 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_conversas_backup_dedup_20261022 FROM PUBLIC, anon, authenticated;

INSERT INTO public.whatsapp_conversas_backup_dedup_20261022
SELECT c.*
FROM public.whatsapp_conversas c
WHERE regexp_replace(c.telefone, '[^0-9]', '', 'g') IN (
  SELECT regexp_replace(telefone, '[^0-9]', '', 'g')
  FROM public.whatsapp_conversas
  GROUP BY 1 HAVING COUNT(*) > 1
)
ON CONFLICT (id) DO NOTHING;

-- Conservar uma única conversa por telefone, sem eliminar nenhuma das
-- mensagens atuais: a janela de ambas as conversas é mesclada em ordem.
DO $$
DECLARE
  v_telefone text;
  v_principal uuid;
  v_mensagens jsonb;
  v_ultima timestamptz;
  v_pedido jsonb;
  v_avaliacao uuid;
BEGIN
  FOR v_telefone IN
    SELECT regexp_replace(telefone, '[^0-9]', '', 'g') AS telefone_limpo
    FROM public.whatsapp_conversas
    GROUP BY 1 HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO v_principal
    FROM public.whatsapp_conversas
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = v_telefone
    ORDER BY ultima_msg DESC NULLS LAST, created_at DESC NULLS LAST, id
    LIMIT 1;

    SELECT COALESCE(jsonb_agg(e.value ORDER BY
      COALESCE(NULLIF(e.value->>'timestamp', ''),
        to_char(COALESCE(c.ultima_msg,c.created_at), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      c.created_at, e.ord), '[]'::jsonb)
      INTO v_mensagens
    FROM public.whatsapp_conversas c
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(c.mensagens, '[]'::jsonb))
      WITH ORDINALITY AS e(value, ord)
    WHERE regexp_replace(c.telefone, '[^0-9]', '', 'g') = v_telefone;

    SELECT MAX(ultima_msg) INTO v_ultima
    FROM public.whatsapp_conversas
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = v_telefone;

    SELECT pedido_em_andamento, aguardando_avaliacao
      INTO v_pedido, v_avaliacao
    FROM public.whatsapp_conversas
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = v_telefone
      AND (pedido_em_andamento IS NOT NULL OR aguardando_avaliacao IS NOT NULL)
    ORDER BY ultima_msg DESC NULLS LAST
    LIMIT 1;

    -- Os registros removidos da lista continuam inteiros no backup acima.
    DELETE FROM public.whatsapp_conversas
    WHERE regexp_replace(telefone, '[^0-9]', '', 'g') = v_telefone
      AND id <> v_principal;

    UPDATE public.whatsapp_conversas
    SET telefone = v_telefone,
        mensagens = COALESCE((
          SELECT jsonb_agg(value ORDER BY ord)
          FROM (
            SELECT value, ord
            FROM jsonb_array_elements(v_mensagens) WITH ORDINALITY AS e(value, ord)
            WHERE ord > GREATEST(jsonb_array_length(v_mensagens) - 30, 0)
          ) AS recentes
        ), '[]'::jsonb),
        ultima_msg = GREATEST(COALESCE(ultima_msg, v_ultima), COALESCE(v_ultima, ultima_msg)),
        pedido_em_andamento = COALESCE(pedido_em_andamento, v_pedido),
        aguardando_avaliacao = COALESCE(aguardando_avaliacao, v_avaliacao)
    WHERE id = v_principal;
  END LOOP;
END $$;

-- Normaliza os telefones restantes e todas as futuras inserções/edições.
UPDATE public.whatsapp_conversas
SET telefone = regexp_replace(telefone, '[^0-9]', '', 'g')
WHERE telefone <> regexp_replace(telefone, '[^0-9]', '', 'g');

CREATE OR REPLACE FUNCTION public.whatsapp_conversa_normalizar_numero()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.telefone := regexp_replace(COALESCE(NEW.telefone, ''), '[^0-9]', '', 'g');
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.whatsapp_conversa_normalizar_numero() FROM PUBLIC;
DROP TRIGGER IF EXISTS whatsapp_conversa_normalizar_numero_trg ON public.whatsapp_conversas;
CREATE TRIGGER whatsapp_conversa_normalizar_numero_trg
BEFORE INSERT OR UPDATE OF telefone ON public.whatsapp_conversas
FOR EACH ROW EXECUTE FUNCTION public.whatsapp_conversa_normalizar_numero();

-- Impede dois webhooks simultâneos de criarem duas conversas do mesmo número.
ALTER TABLE public.whatsapp_conversas
ADD CONSTRAINT whatsapp_conversas_telefone_unico UNIQUE (telefone);

-- Append protegido por bloqueio de linha e com a mesma janela de contexto
-- de 30 mensagens que o agente usa. Não muda pedidos, IA nem perfis.
CREATE OR REPLACE FUNCTION public.whatsapp_append_mensagem(
  p_conversa_id uuid,
  p_mensagem jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_atual jsonb;
  v_completo jsonb;
  v_ultimas jsonb;
  v_data timestamptz;
  v_anterior timestamptz;
BEGIN
  IF p_mensagem IS NULL OR jsonb_typeof(p_mensagem) <> 'object' THEN
    RAISE EXCEPTION 'Mensagem inválida';
  END IF;

  SELECT COALESCE(mensagens, '[]'::jsonb), ultima_msg
    INTO v_atual, v_anterior
    FROM public.whatsapp_conversas
    WHERE id = p_conversa_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversa não encontrada';
  END IF;

  v_completo := v_atual || jsonb_build_array(p_mensagem);
  SELECT COALESCE(jsonb_agg(e.value ORDER BY e.ord), '[]'::jsonb)
    INTO v_ultimas
    FROM jsonb_array_elements(v_completo) WITH ORDINALITY AS e(value, ord)
    WHERE e.ord > GREATEST(jsonb_array_length(v_completo) - 30, 0);

  BEGIN
    v_data := (p_mensagem->>'timestamp')::timestamptz;
  EXCEPTION WHEN others THEN
    v_data := NULL;
  END;
  v_data := COALESCE(v_data, clock_timestamp());

  UPDATE public.whatsapp_conversas
  SET mensagens = v_ultimas,
      ultima_msg = GREATEST(COALESCE(v_anterior, v_data), v_data)
  WHERE id = p_conversa_id;

  RETURN v_ultimas;
END $$;

REVOKE ALL ON FUNCTION public.whatsapp_append_mensagem(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.whatsapp_append_mensagem(uuid,jsonb) TO authenticated, service_role;
