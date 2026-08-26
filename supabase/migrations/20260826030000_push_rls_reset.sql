-- ============================================================================
-- Reset completo das policies de push_subscriptions.
-- A tentativa anterior não destravou o INSERT (RLS continuou barrando com 42501),
-- provavelmente por policy remanescente. Aqui removemos TODAS as policies da
-- tabela dinamicamente e recriamos apenas o conjunto correto e permissivo.
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'push_subscriptions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.push_subscriptions', pol.policyname);
  END LOOP;
END $$;

-- Garante RLS habilitada e grants amplos (subscription não é dado sensível).
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon, authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

-- Qualquer visitante registra/atualiza/remove uma inscrição (identificada pelo endpoint único).
CREATE POLICY "push_insert_all" ON public.push_subscriptions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "push_update_all" ON public.push_subscriptions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "push_delete_all" ON public.push_subscriptions
  FOR DELETE TO anon, authenticated USING (true);

-- Leitura da lista: liberada para authenticated (o painel admin lê para status).
-- service_role (usado pela edge function send-push) já bypassa RLS.
CREATE POLICY "push_select_all" ON public.push_subscriptions
  FOR SELECT TO anon, authenticated USING (true);
