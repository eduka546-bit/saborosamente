-- Coluna para controlar se o produto aparece no site (online) ou só no PDV.
-- Default true = aparece em tudo. Se false = só PDV (não aparece no catálogo online).
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS visivel_online boolean NOT NULL DEFAULT true;

NOTIFY pgrst, 'reload schema';
