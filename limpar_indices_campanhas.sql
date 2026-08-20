-- Execute isso APENAS se receber erros de índices ou policies duplicados
-- Depois execute criar_tabela_campanhas.sql novamente

-- Deletar índices
DROP INDEX IF EXISTS public.idx_campanhas_status;
DROP INDEX IF EXISTS public.idx_campanhas_created_at;
DROP INDEX IF EXISTS public.idx_envios_campanha;
DROP INDEX IF EXISTS public.idx_envios_status;
DROP INDEX IF EXISTS public.idx_listas_created_by;
DROP INDEX IF EXISTS public.idx_contatos_lista;
DROP INDEX IF EXISTS public.idx_contatos_telefone;

-- Deletar policies
DROP POLICY IF EXISTS "admin_can_crud_listas" ON public.listas_contatos;
DROP POLICY IF EXISTS "admin_can_crud_contatos" ON public.contatos_lista;
DROP POLICY IF EXISTS "admin_can_crud_campanhas" ON public.campanhas_whatsapp;
DROP POLICY IF EXISTS "admin_can_crud_envios" ON public.campanhas_whatsapp_envios;

-- Agora execute criar_tabela_campanhas.sql novamente
