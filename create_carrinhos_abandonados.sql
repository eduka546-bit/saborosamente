-- Bootstrap legado da tabela de carrinhos abandonados.
-- O schema de produção é mantido pelas migrations em supabase/migrations.
-- Acesso público direto NÃO é permitido: visitantes usam RPCs validadas.

CREATE TABLE IF NOT EXISTS public.carrinhos_abandonados (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome          text,
  telefone      text,
  email         text,
  itens         jsonb NOT NULL DEFAULT '[]'::jsonb,
  valor_total   numeric NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'abandonado',
  cupom_oferta  text,
  origem        text DEFAULT 'exit_intent',
  convertido_em timestamptz,
  notificado_em timestamptz,
  recuperacao_whatsapp_consentimento boolean NOT NULL DEFAULT false,
  recuperacao_whatsapp_consentido_em timestamptz,
  lead_capturado_em timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carrinhos_user_id
  ON public.carrinhos_abandonados(user_id);
CREATE INDEX IF NOT EXISTS idx_carrinhos_status
  ON public.carrinhos_abandonados(status);
CREATE INDEX IF NOT EXISTS idx_carrinhos_created
  ON public.carrinhos_abandonados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carrinhos_session
  ON public.carrinhos_abandonados(session_id);

ALTER TABLE public.carrinhos_abandonados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_carrinhos" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "user_own_carrinho" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "anon_insert_carrinho" ON public.carrinhos_abandonados;

CREATE POLICY carrinhos_admin_all
ON public.carrinhos_abandonados
FOR ALL
TO authenticated
USING (public.has_role((select auth.uid()), 'admin'::public.app_role))
WITH CHECK (public.has_role((select auth.uid()), 'admin'::public.app_role));

CREATE POLICY carrinhos_user_own
ON public.carrinhos_abandonados
FOR ALL
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.carrinhos_abandonados
FROM anon;

-- Visitantes anônimos salvam carrinho e lead exclusivamente pelas RPCs
-- save_abandoned_cart e capture_checkout_recovery_lead, que validam payload.
