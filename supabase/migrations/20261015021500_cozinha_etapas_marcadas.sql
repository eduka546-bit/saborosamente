-- Checklist de preparações, componentes por prato e montagem concluída por tamanho.
-- São etapas operacionais: não alteram estoque nem o status oficial da produção.
CREATE TABLE IF NOT EXISTS public.cozinha_etapas_marcadas (
  data_producao date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('preparacao','componente','prato')),
  chave text NOT NULL CHECK (length(chave) BETWEEN 1 AND 180),
  assinatura_referencia text NOT NULL CHECK (length(assinatura_referencia) BETWEEN 1 AND 5000),
  marcado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (data_producao, tipo, chave)
);
CREATE INDEX IF NOT EXISTS cozinha_etapas_marcadas_data_idx ON public.cozinha_etapas_marcadas (data_producao);
ALTER TABLE public.cozinha_etapas_marcadas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cozinha_etapas_marcadas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cozinha_etapas_marcadas TO authenticated;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='cozinha_etapas_marcadas'
      AND policyname='Cozinha e admin podem marcar etapas'
  ) THEN
    CREATE POLICY "Cozinha e admin podem marcar etapas" ON public.cozinha_etapas_marcadas
      FOR ALL TO authenticated
      USING (public.has_role((select auth.uid()),'admin'::public.app_role)
        OR public.has_role((select auth.uid()),'cozinha'::public.app_role))
      WITH CHECK (public.has_role((select auth.uid()),'admin'::public.app_role)
        OR public.has_role((select auth.uid()),'cozinha'::public.app_role));
  END IF;
END $$;
