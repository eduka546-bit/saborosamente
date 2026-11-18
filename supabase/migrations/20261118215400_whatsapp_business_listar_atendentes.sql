-- Somente administradores podem listar integrantes aptos a atender pelo painel.
CREATE OR REPLACE FUNCTION public.whatsapp_listar_atendentes()
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT p.id, COALESCE(NULLIF(BTRIM(p.nome), ''), 'Administrador')::text
  FROM public.user_roles r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role = 'admin'::public.app_role
    AND public.usuario_tem_role(ARRAY['admin'::text])
  ORDER BY p.nome NULLS LAST
$$;
REVOKE ALL ON FUNCTION public.whatsapp_listar_atendentes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.whatsapp_listar_atendentes() TO authenticated;
