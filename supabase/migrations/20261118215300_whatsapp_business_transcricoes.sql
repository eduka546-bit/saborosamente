-- Transcrições sob demanda; não altera mensagens nem envia textos ao cliente.
CREATE TABLE IF NOT EXISTS public.whatsapp_transcricoes (
  conversa_id uuid NOT NULL REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  media_path text NOT NULL CHECK (length(media_path) BETWEEN 5 AND 800),
  transcricao text NOT NULL CHECK (length(transcricao) BETWEEN 1 AND 20000),
  criada_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversa_id, media_path)
);
ALTER TABLE public.whatsapp_transcricoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_transcricoes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.whatsapp_transcricoes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_transcricoes TO service_role;
CREATE POLICY whatsapp_transcricoes_admin_select ON public.whatsapp_transcricoes
  FOR SELECT TO authenticated USING (public.usuario_tem_role(ARRAY['admin'::text]));
