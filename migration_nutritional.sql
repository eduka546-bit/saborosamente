ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS tabela_nutricional JSONB,
ADD COLUMN IF NOT EXISTS tabela_nutricional_300g JSONB,
ADD COLUMN IF NOT EXISTS tabela_nutricional_400g JSONB;
