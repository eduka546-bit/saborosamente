-- Desabilitar RLS temporariamente para testar
ALTER TABLE public.listas_contatos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_lista DISABLE ROW LEVEL SECURITY;

-- Se funcionar, então é problema de RLS policies
-- Execute o debug_listas.sql para verificar
