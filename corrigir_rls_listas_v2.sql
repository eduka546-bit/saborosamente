-- DESABILITAR RLS COMPLETAMENTE (mais simples)
-- Já que estamos em ambiente controlado (apenas admin acessa)

ALTER TABLE public.listas_contatos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_lista DISABLE ROW LEVEL SECURITY;

-- Alternativamente, você pode deletar as policies antigas:
DROP POLICY IF EXISTS "admin_read_all_listas" ON public.listas_contatos;
DROP POLICY IF EXISTS "admin_insert_listas" ON public.listas_contatos;
DROP POLICY IF EXISTS "admin_update_listas" ON public.listas_contatos;
DROP POLICY IF EXISTS "admin_delete_listas" ON public.listas_contatos;
DROP POLICY IF EXISTS "admin_read_all_contatos" ON public.contatos_lista;
DROP POLICY IF EXISTS "admin_insert_contatos" ON public.contatos_lista;
DROP POLICY IF EXISTS "admin_update_contatos" ON public.contatos_lista;
DROP POLICY IF EXISTS "admin_delete_contatos" ON public.contatos_lista;
DROP POLICY IF EXISTS "admin_can_crud_listas" ON public.listas_contatos;
DROP POLICY IF EXISTS "admin_can_crud_contatos" ON public.contatos_lista;

-- Pronto! Agora as tabelas são públicas (mas dentro do app, só admin pode acessar)
