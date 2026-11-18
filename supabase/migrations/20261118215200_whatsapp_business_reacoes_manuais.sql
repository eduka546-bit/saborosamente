-- Permite registrar no histórico as reações manuais aceitas pela Meta.
-- A leitura de reações já possuía policy de administrador.
GRANT INSERT, UPDATE, DELETE ON public.whatsapp_reacoes TO authenticated;
CREATE POLICY whatsapp_reacoes_admin_insert
  ON public.whatsapp_reacoes FOR INSERT TO authenticated
  WITH CHECK (public.usuario_tem_role(ARRAY['admin'::text]) AND remetente = 'empresa');
CREATE POLICY whatsapp_reacoes_admin_update
  ON public.whatsapp_reacoes FOR UPDATE TO authenticated
  USING (public.usuario_tem_role(ARRAY['admin'::text]) AND remetente = 'empresa')
  WITH CHECK (public.usuario_tem_role(ARRAY['admin'::text]) AND remetente = 'empresa');
CREATE POLICY whatsapp_reacoes_admin_delete
  ON public.whatsapp_reacoes FOR DELETE TO authenticated
  USING (public.usuario_tem_role(ARRAY['admin'::text]) AND remetente = 'empresa');
