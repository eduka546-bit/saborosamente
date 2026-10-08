-- Disparos de marketing sao enviados pela campanha e exibidos na aba Campanhas.
-- Somente uma conversa ja existente deve receber a copia no historico.
-- Nunca iniciar um atendimento humano pela simples saida de uma campanha.
CREATE OR REPLACE FUNCTION public._registrar_envio_campanha_na_conversa(
  p_campanha_id uuid,
  p_telefone text,
  p_enviado_em timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  campanha RECORD;
  conversa RECORD;
  mensagens_atual jsonb;
  mensagem_campanha jsonb;
BEGIN
  SELECT id, nome, mensagem, imagem_url, video_url, midia_tipo
    INTO campanha
  FROM public.campanhas_whatsapp
  WHERE id = p_campanha_id;

  IF campanha.id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO conversa
  FROM public.whatsapp_conversas
  WHERE telefone = p_telefone
  ORDER BY ultima_msg DESC NULLS LAST
  LIMIT 1;

  -- Contatos sem conversa ficam apenas na aba Campanhas, alimentada por
  -- campanhas_whatsapp_envios. O envio nao abre atendimento.
  IF conversa.id IS NULL THEN
    RETURN;
  END IF;

  mensagem_campanha := jsonb_build_object(
    'role', 'assistant',
    'content', COALESCE(campanha.mensagem, ''),
    'campaign_id', campanha.id,
    'campaign_name', campanha.nome,
    'media_type', campanha.midia_tipo,
    'media_url', CASE
      WHEN campanha.midia_tipo = 'imagem' THEN campanha.imagem_url
      WHEN campanha.midia_tipo = 'video' THEN campanha.video_url
      ELSE NULL
    END,
    'timestamp', COALESCE(p_enviado_em, now())
  );

  mensagens_atual := COALESCE(conversa.mensagens, '[]'::jsonb);
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(mensagens_atual) AS m
    WHERE m->>'campaign_id' = campanha.id::text
  ) THEN
    mensagens_atual := mensagens_atual || jsonb_build_array(mensagem_campanha);
    IF jsonb_array_length(mensagens_atual) > 30 THEN
      SELECT COALESCE(jsonb_agg(value ORDER BY ord), '[]'::jsonb)
        INTO mensagens_atual
      FROM (
        SELECT value, ord
        FROM jsonb_array_elements(mensagens_atual) WITH ORDINALITY AS x(value, ord)
        ORDER BY ord DESC
        LIMIT 30
      ) q;
    END IF;
    UPDATE public.whatsapp_conversas
       SET mensagens = mensagens_atual,
           ultima_msg = GREATEST(
             COALESCE(ultima_msg, 'epoch'::timestamptz),
             COALESCE(p_enviado_em, now())
           )
     WHERE id = conversa.id;
  END IF;
END;
$function$;