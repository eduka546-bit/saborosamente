
-- Adicionar colunas para preços de diferentes tamanhos (200g é o padrão 'preco')
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS preco_300g numeric;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS preco_400g numeric;

-- Garantir que as permissões continuem válidas (opcional, mas recomendado)
GRANT SELECT ON public.produtos TO anon, authenticated;
GRANT ALL ON public.produtos TO service_role;
