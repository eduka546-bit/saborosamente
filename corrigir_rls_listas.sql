-- Reabilitar RLS
ALTER TABLE public.listas_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_lista ENABLE ROW LEVEL SECURITY;

-- Deletar policies antigas
DROP POLICY IF EXISTS "admin_can_crud_listas" ON public.listas_contatos;
DROP POLICY IF EXISTS "admin_can_crud_contatos" ON public.contatos_lista;

-- Criar policies novas (MELHORADAS)

-- Para listas_contatos: Admin pode ler TODAS (não só as criadas por ele)
CREATE POLICY "admin_read_all_listas" ON public.listas_contatos
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Admin pode criar listas
CREATE POLICY "admin_insert_listas" ON public.listas_contatos
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Admin pode atualizar listas
CREATE POLICY "admin_update_listas" ON public.listas_contatos
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Admin pode deletar listas
CREATE POLICY "admin_delete_listas" ON public.listas_contatos
  FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Para contatos_lista: Admin pode ler TODOS contatos
CREATE POLICY "admin_read_all_contatos" ON public.contatos_lista
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Admin pode inserir contatos
CREATE POLICY "admin_insert_contatos" ON public.contatos_lista
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Admin pode atualizar contatos
CREATE POLICY "admin_update_contatos" ON public.contatos_lista
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

-- Admin pode deletar contatos
CREATE POLICY "admin_delete_contatos" ON public.contatos_lista
  FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));
