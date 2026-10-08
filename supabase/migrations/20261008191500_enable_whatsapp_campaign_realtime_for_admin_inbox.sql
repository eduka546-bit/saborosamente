-- Notificacoes Realtime de envios de campanhas no painel admin.
-- A tabela ja possui RLS e politica de acesso somente para administradores.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname='supabase_realtime'
       AND schemaname='public'
       AND tablename='campanhas_whatsapp_envios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campanhas_whatsapp_envios;
  END IF;
END
$$;