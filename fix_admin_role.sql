-- Garante que o admin principal tem a role correta na tabela user_roles
-- Substitua pelo UUID real do usuário admin (veja em Authentication > Users no Supabase)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'anabolic.foodsbs@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Garante leitura pública de delivery_rates (sem restrição de role)
DROP POLICY IF EXISTS "rates_public_read" ON public.delivery_rates;
CREATE POLICY "rates_public_read" ON public.delivery_rates
  FOR SELECT USING (true);

-- Garante escrita para admins E para service_role
DROP POLICY IF EXISTS "rates_admin_write" ON public.delivery_rates;
CREATE POLICY "rates_admin_write" ON public.delivery_rates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
