-- Security hardening, phase 2.
-- Apply only after the frontend uses save_abandoned_cart/update_abandoned_cart_state.

ALTER TABLE public.carrinhos_abandonados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_carrinhos" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "anon_insert_carrinho" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "user_own_carrinho" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS carrinhos_admin_all ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS carrinhos_user_own ON public.carrinhos_abandonados;

CREATE POLICY carrinhos_admin_all
ON public.carrinhos_abandonados FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

CREATE POLICY carrinhos_user_own
ON public.carrinhos_abandonados FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.carrinhos_abandonados FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carrinhos_abandonados TO authenticated;
GRANT ALL ON public.carrinhos_abandonados TO service_role;

NOTIFY pgrst, 'reload schema';
