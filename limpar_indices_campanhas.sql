-- Execute isso APENAS se receber erros de índices duplicados
-- Depois execute criar_tabela_campanhas.sql novamente

DROP INDEX IF EXISTS public.idx_campanhas_status;
DROP INDEX IF EXISTS public.idx_campanhas_created_at;
DROP INDEX IF EXISTS public.idx_envios_campanha;
DROP INDEX IF EXISTS public.idx_envios_status;
DROP INDEX IF EXISTS public.idx_listas_created_by;
DROP INDEX IF EXISTS public.idx_contatos_lista;
DROP INDEX IF EXISTS public.idx_contatos_telefone;

-- Agora execute criar_tabela_campanhas.sql novamente
