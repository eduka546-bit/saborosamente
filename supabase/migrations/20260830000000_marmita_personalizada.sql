-- ============================================================================
-- Marmita Personalizada
-- Grupos (Proteínas, Carboidratos, Legumes, Molhos) e seus ingredientes
-- (com modos de preparo). Preço por faixa de peso total (P/M/G/GG).
-- Idempotente. Padrão do projeto: RLS via public.has_role(auth.uid(),'admin')
-- e leitura pública para o cliente montar a marmita.
-- ============================================================================

-- ── Grupos de ingredientes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marmita_grupos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  ordem       int NOT NULL DEFAULT 0,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Ingredientes de cada grupo ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marmita_ingredientes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id      uuid REFERENCES public.marmita_grupos(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  -- modos de preparo (ex.: ["Desfiado","Grelhado","Parmegiana"]). Pode ser vazio.
  modos_preparo jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- observação opcional (ex.: "Branco ou integral")
  observacao    text,
  ordem         int NOT NULL DEFAULT 0,
  ativo         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── RLS: leitura pública, escrita só admin ──────────────────────────────────
ALTER TABLE public.marmita_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marmita_ingredientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marmita_grupos_read" ON public.marmita_grupos;
CREATE POLICY "marmita_grupos_read" ON public.marmita_grupos FOR SELECT USING (true);
DROP POLICY IF EXISTS "marmita_grupos_admin" ON public.marmita_grupos;
CREATE POLICY "marmita_grupos_admin" ON public.marmita_grupos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "marmita_ingredientes_read" ON public.marmita_ingredientes;
CREATE POLICY "marmita_ingredientes_read" ON public.marmita_ingredientes FOR SELECT USING (true);
DROP POLICY IF EXISTS "marmita_ingredientes_admin" ON public.marmita_ingredientes;
CREATE POLICY "marmita_ingredientes_admin" ON public.marmita_ingredientes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.marmita_grupos TO anon;
GRANT ALL ON public.marmita_grupos TO authenticated;
GRANT ALL ON public.marmita_grupos TO service_role;
GRANT SELECT ON public.marmita_ingredientes TO anon;
GRANT ALL ON public.marmita_ingredientes TO authenticated;
GRANT ALL ON public.marmita_ingredientes TO service_role;

-- ── pedido_itens: suportar item sem produto do catálogo ─────────────────────
ALTER TABLE public.pedido_itens ALTER COLUMN produto_id DROP NOT NULL;
ALTER TABLE public.pedido_itens
  ADD COLUMN IF NOT EXISTS nome_item text;

-- ── Seed dos grupos/ingredientes (só se ainda não houver dados) ─────────────
DO $$
DECLARE
  g_prot uuid;
  g_carb uuid;
  g_leg  uuid;
  g_mol  uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.marmita_grupos) THEN
    INSERT INTO public.marmita_grupos (nome, ordem) VALUES ('Proteínas', 0) RETURNING id INTO g_prot;
    INSERT INTO public.marmita_grupos (nome, ordem) VALUES ('Carboidratos', 1) RETURNING id INTO g_carb;
    INSERT INTO public.marmita_grupos (nome, ordem) VALUES ('Legumes', 2) RETURNING id INTO g_leg;
    INSERT INTO public.marmita_grupos (nome, ordem) VALUES ('Molhos', 3) RETURNING id INTO g_mol;

    -- Proteínas
    INSERT INTO public.marmita_ingredientes (grupo_id, nome, modos_preparo, ordem) VALUES
      (g_prot, 'Frango', '["Iscas","Desfiado","Empanado","Parmegiana","Strogonoff","Grelhado","Ensopado"]'::jsonb, 0),
      (g_prot, 'Bovino (Patinho)', '["Moída","Ensopada","Tiras","Desfiada","Parmegiana","Strogonoff"]'::jsonb, 1),
      (g_prot, 'Filé de Tilápia', '[]'::jsonb, 2);

    -- Carboidratos
    INSERT INTO public.marmita_ingredientes (grupo_id, nome, modos_preparo, observacao, ordem) VALUES
      (g_carb, 'Arroz', '["Branco","Integral"]'::jsonb, 'Branco ou integral', 0),
      (g_carb, 'Feijão', '["Preto","Carioca"]'::jsonb, 'Preto ou carioca', 1),
      (g_carb, 'Batata-doce', '["Rústica em cubos","Purê"]'::jsonb, 'Rústica em cubos ou purê', 2),
      (g_carb, 'Batata inglesa', '["Rústica em cubos","Purê"]'::jsonb, 'Rústica em cubos ou purê', 3),
      (g_carb, 'Macarrão', '["Talharim","Espaguete integral"]'::jsonb, 'Talharim ou espaguete integral', 4),
      (g_carb, 'Aipim', '["Em cubos","Purê"]'::jsonb, 'Em cubos ou purê', 5);

    -- Legumes
    INSERT INTO public.marmita_ingredientes (grupo_id, nome, modos_preparo, ordem) VALUES
      (g_leg, 'Brócolis', '[]'::jsonb, 0),
      (g_leg, 'Cenoura', '[]'::jsonb, 1),
      (g_leg, 'Couve-flor', '[]'::jsonb, 2),
      (g_leg, 'Purê de abóbora cabotiá', '[]'::jsonb, 3),
      (g_leg, 'Mix de legumes', '[]'::jsonb, 4);

    -- Molhos
    INSERT INTO public.marmita_ingredientes (grupo_id, nome, modos_preparo, ordem) VALUES
      (g_mol, 'Sugo', '[]'::jsonb, 0),
      (g_mol, 'Bolonhesa (carne moída)', '[]'::jsonb, 1),
      (g_mol, 'Madeira', '[]'::jsonb, 2),
      (g_mol, 'Pesto', '[]'::jsonb, 3),
      (g_mol, 'Refogado', '[]'::jsonb, 4),
      (g_mol, 'Espinafre', '[]'::jsonb, 5);
  END IF;
END $$;

-- Força o PostgREST a recarregar o schema cache.
NOTIFY pgrst, 'reload schema';
