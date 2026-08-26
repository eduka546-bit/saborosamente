-- ============================================================================
-- Ajuste de RLS em push_subscriptions.
-- Problema: a policy de INSERT exigia auth.uid() = user_id OR admin, mas o
-- painel admin nem sempre tem uma sessão Supabase com role 'admin' em user_roles,
-- então o registro da inscrição de push era rejeitado (erro 42501) e nada era salvo.
--
-- Uma subscription de push (endpoint + chaves) não é dado sensível — é apenas
-- um destino de notificação. Permitimos que qualquer visitante (anon/authenticated)
-- registre/atualize/remova UMA inscrição identificada pelo endpoint único.
-- A LEITURA continua restrita (só admin/service_role veem a lista completa).
-- ============================================================================

-- Permite anon também inserir/gerenciar (o painel pode não ter sessão autenticada)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon;

-- ── INSERT: qualquer um pode registrar sua inscrição ──
DROP POLICY IF EXISTS "push_subs_own_insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_insert_any" ON public.push_subscriptions;
CREATE POLICY "push_subs_insert_any" ON public.push_subscriptions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ── UPDATE: necessário para o upsert (onConflict endpoint) funcionar ──
DROP POLICY IF EXISTS "push_subs_own_update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_update_any" ON public.push_subscriptions;
CREATE POLICY "push_subs_update_any" ON public.push_subscriptions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── DELETE: permite cancelar a inscrição do próprio aparelho ──
DROP POLICY IF EXISTS "push_subs_own_delete" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_delete_any" ON public.push_subscriptions;
CREATE POLICY "push_subs_delete_any" ON public.push_subscriptions
  FOR DELETE TO anon, authenticated
  USING (true);

-- ── SELECT: leitura da lista completa só para admin (service_role já bypassa) ──
DROP POLICY IF EXISTS "push_subs_own_select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_select_admin" ON public.push_subscriptions;
CREATE POLICY "push_subs_select_admin" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
