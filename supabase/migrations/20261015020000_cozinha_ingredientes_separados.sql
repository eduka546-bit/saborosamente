-- Lista de ingredientes separados para a cozinha por dia, ingrediente e unidade.
-- Não movimenta estoque e não modifica a necessidade calculada.
CREATE TABLE IF NOT EXISTS public.cozinha_ingredientes_separados (
  data_producao date NOT NULL,
  ingrediente_id uuid NOT NULL REFERENCES public.cozinha_ingredientes(id) ON DELETE CASCADE,
  unidade text NOT NULL CHECK (unidade IN ('g','L','un')),
  quantidade_referencia numeric NOT NULL CHECK (quantidade_referencia >= 0),
  marcado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (data_producao, ingrediente_id, unidade)
);

CREATE INDEX IF NOT EXISTS cozinha_ingredientes_separados_ingrediente_idx
  ON public.cozinha_ingredientes_separados (ingrediente_id, data_producao);

ALTER TABLE public.cozinha_ingredientes_separados ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cozinha_ingredientes_separados TO authenticated;
REVOKE ALL ON public.cozinha_ingredientes_separados FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename = 'cozinha_ingredientes_separados'
    AND policyname = 'Cozinha e admin podem marcar ingredientes separados'
  ) THEN
    CREATE POLICY "Cozinha e admin podem marcar ingredientes separados"
      ON public.cozinha_ingredientes_separados FOR ALL TO authenticated
      USING (
        public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
        OR public.has_role((SELECT auth.uid()), 'cozinha'::public.app_role)
      )
      WITH CHECK (
        public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
        OR public.has_role((SELECT auth.uid()), 'cozinha'::public.app_role)
      );
  END IF;
END;
$$;
