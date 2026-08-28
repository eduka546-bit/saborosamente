-- ============================================================
-- Combos Prontos: tabela de sabores disponíveis por combo.
-- O admin seleciona quais produtos do cardápio ficam como opção
-- de escolha para o cliente no combo pronto.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.combo_sabores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id    uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  produto_id  uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  ordem       int NOT NULL DEFAULT 0,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(combo_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_combo_sabores_combo ON public.combo_sabores(combo_id);

-- RLS: leitura pública (cliente precisa ver os sabores), escrita admin
ALTER TABLE public.combo_sabores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "combo_sabores_read" ON public.combo_sabores;
CREATE POLICY "combo_sabores_read" ON public.combo_sabores FOR SELECT USING (true);

DROP POLICY IF EXISTS "combo_sabores_admin" ON public.combo_sabores;
CREATE POLICY "combo_sabores_admin" ON public.combo_sabores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.combo_sabores TO anon;
GRANT ALL ON public.combo_sabores TO authenticated;
GRANT ALL ON public.combo_sabores TO service_role;

NOTIFY pgrst, 'reload schema';
