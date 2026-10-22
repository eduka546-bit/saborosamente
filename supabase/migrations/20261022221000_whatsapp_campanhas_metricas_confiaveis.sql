
-- Atribui respostas reais e botões ao envio mais recente (até 72h);
-- respostas de botões com context.id priorizam o ID exato da mensagem Meta.
-- Não cria mensagens, não altera estoque e não chama API de envio.
CREATE OR REPLACE FUNCTION public.campanha_whatsapp_telefone_canonico(p_telefone text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
WITH digitos AS (
  SELECT regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g') AS numero
), local AS (
  SELECT CASE WHEN left(numero, 2) = '55' AND length(numero) IN (12, 13)
    THEN substr(numero, 3) ELSE numero END AS numero FROM digitos
)
SELECT CASE WHEN length(numero) = 11 AND substr(numero, 3, 1) = '9'
  THEN substr(numero, 1, 2) || substr(numero, 4)
  ELSE numero END FROM local;
$$;

CREATE OR REPLACE FUNCTION public.campanha_whatsapp_marcar_resposta()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_envio_id uuid;
BEGIN
  IF length(public.campanha_whatsapp_telefone_canonico(NEW.telefone)) < 10 THEN RETURN NEW; END IF;
  SELECT e.id INTO v_envio_id
  FROM public.campanhas_whatsapp_envios AS e
  WHERE e.status IN ('enviado', 'entregue', 'lido')
    AND e.enviado_em IS NOT NULL
    AND public.campanha_whatsapp_telefone_canonico(e.telefone) =
        public.campanha_whatsapp_telefone_canonico(NEW.telefone)
    AND NEW.created_at >= e.enviado_em
    AND NEW.created_at < e.enviado_em + interval '72 hours'
  ORDER BY e.enviado_em DESC, e.id DESC LIMIT 1;
  IF v_envio_id IS NOT NULL THEN
    UPDATE public.campanhas_whatsapp_envios
      SET respondeu_em = COALESCE(respondeu_em, NEW.created_at)
      WHERE id = v_envio_id AND respondeu_em IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campanha_resposta_recebida ON public.whatsapp_mensagens_processadas;
CREATE TRIGGER trg_campanha_resposta_recebida
  AFTER INSERT ON public.whatsapp_mensagens_processadas
  FOR EACH ROW EXECUTE FUNCTION public.campanha_whatsapp_marcar_resposta();

CREATE OR REPLACE FUNCTION public.campanha_whatsapp_marcar_interacao()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_envio_id uuid; v_telefone text;
BEGIN
  -- O contexto da mensagem identifica precisamente o envio clicado e evita
  -- misturar campanhas do mesmo cliente.
  IF NEW.mensagem_origem_id IS NOT NULL THEN
    SELECT e.id INTO v_envio_id
      FROM public.campanhas_whatsapp_envios AS e
     WHERE e.meta_message_id = NEW.mensagem_origem_id
       AND e.status IN ('enviado', 'entregue', 'lido')
       AND NEW.recebido_em >= COALESCE(e.enviado_em, e.created_at) - interval '5 minutes'
       AND NEW.recebido_em < COALESCE(e.enviado_em, e.created_at) + interval '72 hours'
     LIMIT 1;
  END IF;
  IF v_envio_id IS NULL THEN
    SELECT c.telefone INTO v_telefone FROM public.whatsapp_conversas AS c
      WHERE c.id = NEW.conversa_id;
    IF length(public.campanha_whatsapp_telefone_canonico(v_telefone)) >= 10 THEN
      SELECT e.id INTO v_envio_id
      FROM public.campanhas_whatsapp_envios AS e
      WHERE e.status IN ('enviado', 'entregue', 'lido')
        AND e.enviado_em IS NOT NULL
        AND public.campanha_whatsapp_telefone_canonico(e.telefone) =
            public.campanha_whatsapp_telefone_canonico(v_telefone)
        AND NEW.recebido_em >= e.enviado_em
        AND NEW.recebido_em < e.enviado_em + interval '72 hours'
      ORDER BY e.enviado_em DESC, e.id DESC LIMIT 1;
    END IF;
  END IF;
  IF v_envio_id IS NOT NULL THEN
    UPDATE public.campanhas_whatsapp_envios
       SET respondeu_em = COALESCE(respondeu_em, NEW.recebido_em),
           interagiu_em = COALESCE(interagiu_em, NEW.recebido_em)
     WHERE id = v_envio_id AND (respondeu_em IS NULL OR interagiu_em IS NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campanha_interacao_recebida ON public.whatsapp_interacoes;
CREATE TRIGGER trg_campanha_interacao_recebida
  AFTER INSERT OR UPDATE OF mensagem_origem_id, recebido_em, conversa_id
  ON public.whatsapp_interacoes
  FOR EACH ROW EXECUTE FUNCTION public.campanha_whatsapp_marcar_interacao();

-- Webhooks da Meta nem sempre chegam na ordem "sent, delivered, read".
-- Preserva eventos mais fortes, sem impedir a reabertura de falhas para reenvio.
CREATE OR REPLACE FUNCTION public.campanha_whatsapp_status_monotonico()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.lida_em IS NOT NULL OR OLD.status = 'lido' THEN
    IF NEW.status IN ('enviado', 'entregue', 'falhou') THEN NEW.status := 'lido'; END IF;
    NEW.lida_em := COALESCE(NEW.lida_em, OLD.lida_em);
    NEW.entregue_em := COALESCE(NEW.entregue_em, OLD.entregue_em, NEW.lida_em);
  ELSIF OLD.entregue_em IS NOT NULL OR OLD.status = 'entregue' THEN
    IF NEW.status IN ('enviado', 'falhou') THEN NEW.status := 'entregue'; END IF;
    NEW.entregue_em := COALESCE(NEW.entregue_em, OLD.entregue_em);
  ELSIF OLD.status = 'falhou' AND NEW.status = 'enviado'
        AND NEW.meta_message_id IS NOT DISTINCT FROM OLD.meta_message_id THEN
    NEW.status := 'falhou';
  END IF;
  IF NEW.status = 'lido' THEN
    NEW.lida_em := COALESCE(NEW.lida_em, now());
    NEW.entregue_em := COALESCE(NEW.entregue_em, NEW.lida_em);
  ELSIF NEW.status = 'entregue' THEN
    NEW.entregue_em := COALESCE(NEW.entregue_em, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campanha_status_monotonico ON public.campanhas_whatsapp_envios;
CREATE TRIGGER trg_campanha_status_monotonico BEFORE UPDATE
  ON public.campanhas_whatsapp_envios
  FOR EACH ROW EXECUTE FUNCTION public.campanha_whatsapp_status_monotonico();

-- Repara somente regressões comprovadas por timestamps já existentes.
UPDATE public.campanhas_whatsapp_envios SET status = 'lido'
 WHERE status IN ('enviado', 'entregue') AND lida_em IS NOT NULL;
UPDATE public.campanhas_whatsapp_envios SET status = 'entregue'
 WHERE status = 'enviado' AND entregue_em IS NOT NULL;
UPDATE public.campanhas_whatsapp_envios SET entregue_em = lida_em
 WHERE status = 'lido' AND entregue_em IS NULL AND lida_em IS NOT NULL;

-- Recupera interações antigas pelo ID de origem exato, sem inferir cliques em links.
UPDATE public.campanhas_whatsapp_envios AS e
   SET respondeu_em = COALESCE(e.respondeu_em, i.recebido_em),
       interagiu_em = COALESCE(e.interagiu_em, i.recebido_em)
  FROM public.whatsapp_interacoes AS i
 WHERE i.mensagem_origem_id = e.meta_message_id
   AND e.status IN ('enviado', 'entregue', 'lido')
   AND i.recebido_em >= COALESCE(e.enviado_em, e.created_at) - interval '5 minutes'
   AND i.recebido_em < COALESCE(e.enviado_em, e.created_at) + interval '72 hours'
   AND (e.respondeu_em IS NULL OR e.interagiu_em IS NULL);
