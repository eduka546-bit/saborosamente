-- ============================================================================
-- Web Push: armazena as inscrições (subscriptions) dos aparelhos admin.
-- Cada aparelho/navegador que ativar notificações gera um endpoint único.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuário gerencia as próprias inscrições; admin enxerga todas.
DROP POLICY IF EXISTS "push_subs_own_insert" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_insert" ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "push_subs_own_select" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_select" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "push_subs_own_delete" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_delete" ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "push_subs_own_update" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_update" ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
