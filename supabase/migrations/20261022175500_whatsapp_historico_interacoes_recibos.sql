-- Atendimento WhatsApp: histórico permanente e eventos de interação oficiais.
-- Migração aditiva: NÃO altera a janela curta usada pelo BOT, nem o telefone
-- vinculado à Meta. RLS permite somente admins visualizar o conteúdo.

CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens_historico (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversa_id uuid NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  chave text NOT NULL,
  mensagem jsonb NOT NULL,
  registrado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_mensagens_historico_unique UNIQUE (conversa_id, chave)
);
CREATE INDEX IF NOT EXISTS whatsapp_historico_paginar_idx
  ON public.whatsapp_mensagens_historico (conversa_id, id DESC);

ALTER TABLE public.whatsapp_mensagens_historico ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_mensagens_historico FROM anon, authenticated;
GRANT SELECT ON public.whatsapp_mensagens_historico TO authenticated;
CREATE POLICY "Admins leem historico WhatsApp"
 ON public.whatsapp_mensagens_historico FOR SELECT TO authenticated
 USING (public.usuario_tem_role(ARRAY['admin'::text]));

-- O webhook e o navegador ainda mantêm uma janela curta de 30 mensagens para IA.
-- A captura acontece antes que uma mensagem desapareça dessa janela.
-- Usa ID da Meta quando disponível e hash determinístico para mensagens legadas.
CREATE OR REPLACE FUNCTION public.whatsapp_historico_ao_gravar()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_msg jsonb;
DECLARE v_chave text;
BEGIN
  IF jsonb_typeof(NEW.mensagens) <> 'array' THEN RETURN NEW; END IF;
  FOR v_msg IN SELECT value FROM jsonb_array_elements(NEW.mensagens) LOOP
    v_chave := CASE
      WHEN coalesce(v_msg->>'whatsapp_message_id','') <> ''
        THEN 'meta:' || v_msg->>'whatsapp_message_id'
      ELSE 'legado:' || md5(jsonb_build_array(
        v_msg->>'role', v_msg->>'content', v_msg->>'timestamp',
        v_msg->>'media_path', v_msg->>'media_url',
        v_msg->>'campaign_id', v_msg->>'manual'
      )::text)
    END;
    INSERT INTO public.whatsapp_mensagens_historico(conversa_id,chave,mensagem)
    VALUES (NEW.id,v_chave,v_msg)
    ON CONFLICT (conversa_id,chave) DO UPDATE
      SET mensagem = EXCLUDED.mensagem;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.whatsapp_historico_ao_gravar() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_whatsapp_historico_ao_gravar ON public.whatsapp_conversas;
CREATE TRIGGER trg_whatsapp_historico_ao_gravar
AFTER INSERT OR UPDATE OF mensagens ON public.whatsapp_conversas
FOR EACH ROW EXECUTE FUNCTION public.whatsapp_historico_ao_gravar();

-- Preenche o histórico que ainda existe na janela atual. Mensagens já
-- descartadas antes desta migração não podem ser restauradas.
INSERT INTO public.whatsapp_mensagens_historico(conversa_id,chave,mensagem)
SELECT c.id,
  CASE WHEN coalesce(m.value->>'whatsapp_message_id','') <> ''
    THEN 'meta:' || m.value->>'whatsapp_message_id'
    ELSE 'legado:' || md5(jsonb_build_array(
      m.value->>'role',m.value->>'content',m.value->>'timestamp',
      m.value->>'media_path',m.value->>'media_url',
      m.value->>'campaign_id',m.value->>'manual'
    )::text) END,
  m.value
FROM public.whatsapp_conversas c
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(c.mensagens) = 'array' THEN c.mensagens ELSE '[]'::jsonb END
) WITH ORDINALITY AS m(value,ord)
ORDER BY c.created_at, c.id, m.ord
ON CONFLICT (conversa_id,chave) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.whatsapp_interacoes (
  whatsapp_message_id text PRIMARY KEY,
  conversa_id uuid NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('botao','lista','botao_template')),
  titulo text NOT NULL,
  identificador text,
  mensagem_origem_id text,
  recebido_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_interacoes_conversa_idx
 ON public.whatsapp_interacoes(conversa_id,recebido_em DESC);
ALTER TABLE public.whatsapp_interacoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_interacoes FROM anon, authenticated;
GRANT SELECT ON public.whatsapp_interacoes TO authenticated;
CREATE POLICY "Admins leem botoes clicados no WhatsApp"
 ON public.whatsapp_interacoes FOR SELECT TO authenticated
 USING (public.usuario_tem_role(ARRAY['admin'::text]));

CREATE TABLE IF NOT EXISTS public.whatsapp_reacoes (
  conversa_id uuid NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  mensagem_destino_id text NOT NULL,
  remetente text NOT NULL,
  emoji text NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversa_id,mensagem_destino_id,remetente)
);
CREATE INDEX IF NOT EXISTS whatsapp_reacoes_conversa_idx
 ON public.whatsapp_reacoes(conversa_id);
ALTER TABLE public.whatsapp_reacoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_reacoes FROM anon, authenticated;
GRANT SELECT ON public.whatsapp_reacoes TO authenticated;
CREATE POLICY "Admins leem reacoes WhatsApp"
 ON public.whatsapp_reacoes FOR SELECT TO authenticated
 USING (public.usuario_tem_role(ARRAY['admin'::text]));

CREATE TABLE IF NOT EXISTS public.whatsapp_recibos (
  whatsapp_message_id text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('enviado','entregue','lido','falhou')),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_recibos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_recibos FROM anon, authenticated;
GRANT SELECT ON public.whatsapp_recibos TO authenticated;
CREATE POLICY "Admins leem status reais WhatsApp"
 ON public.whatsapp_recibos FOR SELECT TO authenticated
 USING (public.usuario_tem_role(ARRAY['admin'::text]));

-- A atualização monotônica impede que um recibo 'sent' atrasado
-- rebaixe uma mensagem que já foi confirmada como lida.
CREATE OR REPLACE FUNCTION public.whatsapp_registrar_recibo(
  p_message_id text, p_status text
) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF p_message_id IS NULL OR length(p_message_id)>255
    OR p_message_id NOT LIKE 'wamid.%'
    OR p_status NOT IN ('enviado','entregue','lido','falhou') THEN
    RAISE EXCEPTION 'Recibo WhatsApp inválido';
  END IF;
  INSERT INTO public.whatsapp_recibos AS r (whatsapp_message_id,status)
  VALUES (p_message_id,p_status)
  ON CONFLICT (whatsapp_message_id) DO UPDATE
  SET status = CASE
    WHEN r.status = 'lido' THEN r.status
    WHEN r.status = 'entregue' AND EXCLUDED.status IN ('enviado','falhou') THEN r.status
    WHEN r.status = 'falhou' AND EXCLUDED.status = 'enviado' THEN r.status
    WHEN EXCLUDED.status = 'lido' THEN 'lido'
    WHEN EXCLUDED.status = 'entregue' THEN 'entregue'
    ELSE EXCLUDED.status END,
    atualizado_em = now();
END $$;
REVOKE ALL ON FUNCTION public.whatsapp_registrar_recibo(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.whatsapp_registrar_recibo(text,text) TO service_role;

-- Idempotência adicional: a mesma reação ou clique pode reaparecer em caminhos
-- diferentes do webhook. A mesma mensagem do cliente não deve se repetir.
CREATE OR REPLACE FUNCTION public.whatsapp_append_mensagem(
  p_conversa_id uuid, p_mensagem jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v_atual jsonb;
DECLARE v_completo jsonb;
DECLARE v_ultimas jsonb;
DECLARE v_data timestamptz;
DECLARE v_anterior timestamptz;
DECLARE v_id text;
BEGIN
  IF p_mensagem IS NULL OR jsonb_typeof(p_mensagem) <> 'object' THEN
    RAISE EXCEPTION 'Mensagem inválida';
  END IF;
  SELECT COALESCE(mensagens,'[]'::jsonb),ultima_msg
    INTO v_atual,v_anterior
    FROM public.whatsapp_conversas WHERE id=p_conversa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversa não encontrada'; END IF;

  v_id := NULLIF(p_mensagem->>'whatsapp_message_id','');
  IF v_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_atual) AS e(item)
    WHERE e.item->>'whatsapp_message_id'=v_id
  ) THEN
    RETURN v_atual;
  END IF;

  v_completo := v_atual || jsonb_build_array(p_mensagem);
  SELECT COALESCE(jsonb_agg(e.value ORDER BY e.ord),'[]'::jsonb)
    INTO v_ultimas
    FROM jsonb_array_elements(v_completo) WITH ORDINALITY AS e(value,ord)
    WHERE e.ord > GREATEST(jsonb_array_length(v_completo)-30,0);
  BEGIN
    v_data := (p_mensagem->>'timestamp')::timestamptz;
  EXCEPTION WHEN others THEN
    v_data := NULL;
  END;
  v_data := COALESCE(v_data,clock_timestamp());

  UPDATE public.whatsapp_conversas
  SET mensagens=v_ultimas,
      ultima_msg=GREATEST(COALESCE(v_anterior,v_data),v_data)
  WHERE id=p_conversa_id;
  RETURN v_ultimas;
END $$;
REVOKE ALL ON FUNCTION public.whatsapp_append_mensagem(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.whatsapp_append_mensagem(uuid,jsonb) TO authenticated,service_role;
