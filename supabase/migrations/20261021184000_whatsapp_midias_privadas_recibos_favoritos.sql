-- Etapa complementar (aplicar depois do histórico/organização):
-- anexos novos privados, recibos de entrega e mensagens favoritas por admin.
-- Não muda a privacidade do bucket legado 'agente-arquivos' porque
-- ele também é usado por outros módulos do sistema.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-envios-privados', 'whatsapp-envios-privados', false, 16777216,
  ARRAY[
    'image/jpeg','image/png','video/mp4','video/3gpp',
    'audio/mpeg','audio/mp4','audio/ogg','audio/aac','audio/amr',
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Admin pode enviar midia privada WhatsApp"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-envios-privados'
  AND public.usuario_tem_role(ARRAY['admin'::text])
);

CREATE POLICY "Admin pode visualizar midia privada WhatsApp"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'whatsapp-envios-privados'
  AND public.usuario_tem_role(ARRAY['admin'::text])
);

-- Recibos podem chegar ANTES de o frontend salvar a mensagem ou fora de ordem.
-- Mantê-los por ID Meta evita a perda ou o retrocesso do estado.
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagem_recibos (
  whatsapp_message_id text PRIMARY KEY,
  telefone text,
  status text NOT NULL CHECK (status IN ('enviado','entregue','lido','falhou')),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_mensagem_recibos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins leem recibos WhatsApp"
ON public.whatsapp_mensagem_recibos FOR SELECT TO authenticated
USING (public.usuario_tem_role(ARRAY['admin'::text]));
GRANT SELECT ON public.whatsapp_mensagem_recibos TO authenticated;

CREATE OR REPLACE FUNCTION public.registrar_recibo_whatsapp(
  p_message_id text, p_status text, p_telefone text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_message_id IS NULL OR length(p_message_id) > 255
     OR p_message_id NOT LIKE 'wamid.%'
     OR p_status NOT IN ('enviado','entregue','lido','falhou') THEN
    RAISE EXCEPTION 'Recibo inválido';
  END IF;
  INSERT INTO public.whatsapp_mensagem_recibos AS r
    (whatsapp_message_id, telefone, status, atualizado_em)
  VALUES (p_message_id, left(p_telefone, 24), p_status, now())
  ON CONFLICT (whatsapp_message_id) DO UPDATE SET
    telefone = coalesce(EXCLUDED.telefone, r.telefone),
    status = CASE
      WHEN r.status = 'lido' THEN r.status
      WHEN r.status = 'entregue' AND EXCLUDED.status IN ('enviado','falhou')
        THEN r.status
      WHEN r.status = 'falhou' AND EXCLUDED.status = 'enviado'
        THEN r.status
      WHEN EXCLUDED.status = 'lido' THEN 'lido'
      WHEN EXCLUDED.status = 'entregue' THEN 'entregue'
      ELSE EXCLUDED.status
    END,
    atualizado_em = now();
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_recibo_whatsapp(text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_recibo_whatsapp(text,text,text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_recibo_whatsapp(text,text,text) TO service_role;

CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens_favoritas (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversa_id uuid NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  chave text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversa_id, chave)
);
ALTER TABLE public.whatsapp_mensagens_favoritas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gerencia suas mensagens favoritas"
ON public.whatsapp_mensagens_favoritas FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id AND public.usuario_tem_role(ARRAY['admin'::text]))
WITH CHECK ((SELECT auth.uid()) = user_id AND public.usuario_tem_role(ARRAY['admin'::text]));
GRANT SELECT, INSERT, DELETE ON public.whatsapp_mensagens_favoritas TO authenticated;
