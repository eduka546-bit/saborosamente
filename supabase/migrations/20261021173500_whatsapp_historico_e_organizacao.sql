-- Histórico permanente do atendimento: preserva mensagens fora da janela
-- curta que o agente utiliza para contexto. Migração aditiva; nenhum dado apagado.
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens_historico (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversa_id uuid NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  chave text NOT NULL,
  mensagem jsonb NOT NULL,
  enviada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_historico_conversa_chave_key UNIQUE (conversa_id, chave)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_historico_conversa_id
  ON public.whatsapp_mensagens_historico (conversa_id, id DESC);

ALTER TABLE public.whatsapp_mensagens_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente administradores consultam historico WhatsApp"
  ON public.whatsapp_mensagens_historico
  FOR SELECT TO authenticated
  USING (public.usuario_tem_role(ARRAY['admin'::text]));

-- O identificador Meta prevalece. Mensagens antigas sem ID recebem uma chave
-- baseada no conteúdo/horário, sem depender da posição da janela de 30 itens.
CREATE OR REPLACE FUNCTION public.whatsapp_chave_historico(msg jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
 SELECT CASE WHEN length(coalesce(msg->>'whatsapp_message_id','')) > 0
 THEN 'meta:' || (msg->>'whatsapp_message_id')
 ELSE 'legado:' || md5(jsonb_build_array(
   msg->>'role', msg->>'content', msg->>'timestamp',
   msg->>'media_path', msg->>'media_url', msg->>'campaign_id'
 )::text)
 END
$$;

-- Trigger registra, de maneira idempotente, novas mensagens e mudanças
-- nos recibos, sem afetar o formato atual que o robô usa.
CREATE OR REPLACE FUNCTION public.whatsapp_salvar_historico()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE item jsonb;
BEGIN
 IF jsonb_typeof(NEW.mensagens) IS DISTINCT FROM 'array' THEN RETURN NEW; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(NEW.mensagens)
 LOOP
  INSERT INTO public.whatsapp_mensagens_historico
    (conversa_id, chave, mensagem, enviada_em)
  VALUES (
    NEW.id, public.whatsapp_chave_historico(item), item,
    CASE WHEN (item->>'timestamp') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
         THEN (item->>'timestamp')::timestamptz ELSE NULL END
  )
  ON CONFLICT (conversa_id, chave) DO UPDATE
    SET mensagem = EXCLUDED.mensagem, enviada_em = EXCLUDED.enviada_em;
 END LOOP;
 RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.whatsapp_salvar_historico() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.whatsapp_chave_historico(jsonb) FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_whatsapp_salvar_historico ON public.whatsapp_conversas;
CREATE TRIGGER trg_whatsapp_salvar_historico
AFTER INSERT OR UPDATE OF mensagens ON public.whatsapp_conversas
FOR EACH ROW EXECUTE FUNCTION public.whatsapp_salvar_historico();

-- Preserva a janela que já existe no momento da migração; não recupera
-- mensagens removidas antes dela.
INSERT INTO public.whatsapp_mensagens_historico
  (conversa_id, chave, mensagem, enviada_em)
SELECT c.id, public.whatsapp_chave_historico(m.value), m.value,
       CASE WHEN (m.value->>'timestamp') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
            THEN (m.value->>'timestamp')::timestamptz ELSE NULL END
FROM public.whatsapp_conversas c
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(c.mensagens) = 'array' THEN c.mensagens ELSE '[]'::jsonb END
) WITH ORDINALITY AS m(value, posicao)
ORDER BY c.id, m.posicao
ON CONFLICT (conversa_id, chave) DO NOTHING;

-- Organização pessoal do atendimento; não altera mensagens do cliente.
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas_organizacao (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  fixada boolean NOT NULL DEFAULT false,
  arquivada boolean NOT NULL DEFAULT false,
  silenciada boolean NOT NULL DEFAULT false,
  nao_lida_manual boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversa_id)
);

ALTER TABLE public.whatsapp_conversas_organizacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administradores organizam suas conversas"
 ON public.whatsapp_conversas_organizacao FOR ALL TO authenticated
 USING (user_id = (SELECT auth.uid()) AND public.usuario_tem_role(ARRAY['admin'::text]))
 WITH CHECK (user_id = (SELECT auth.uid()) AND public.usuario_tem_role(ARRAY['admin'::text]));

CREATE INDEX IF NOT EXISTS idx_whatsapp_organizacao_user
 ON public.whatsapp_conversas_organizacao (user_id, arquivada, fixada);
