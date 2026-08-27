-- ============================================================
-- Selos de restrição por produto: Sem Glúten / Sem Lactose
-- Campos booleanos dedicados (não dependem do texto informacao_nutricional),
-- usados para exibir selos no canto da foto do produto.
-- ============================================================

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS sem_gluten  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sem_lactose boolean NOT NULL DEFAULT false;
