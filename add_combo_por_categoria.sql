-- Habilita o construtor de combo por categoria
ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS combo_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS combo_titulo text DEFAULT NULL,       -- Ex: "Monte sua Linha Refeições"
  ADD COLUMN IF NOT EXISTS combo_descricao text DEFAULT NULL;    -- Ex: "Escolha entre 200g, 300g e 400g"

-- Ativa para a linha principal de marmitas se quiser (opcional — ajuste o nome conforme o banco)
-- UPDATE public.categorias SET combo_ativo = true WHERE nome ILIKE '%refeição%' OR nome ILIKE '%refeicao%';
