-- ============================================================
-- Tabela de logs de webhooks recebidos (pra análise de integração).
-- Grava tudo que chega, sem filtro — depois de entender o formato,
-- o parser real é implementado na edge function.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem      text NOT NULL DEFAULT 'desconhecido',
  metodo      text,
  url         text,
  headers     jsonb,
  payload     jsonb,
  processado  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_origem ON public.webhook_logs(origem);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- RLS: só admin lê/gerencia
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_logs_admin" ON public.webhook_logs;
CREATE POLICY "webhook_logs_admin" ON public.webhook_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) pode inserir
GRANT ALL ON public.webhook_logs TO service_role;
GRANT SELECT ON public.webhook_logs TO authenticated;

NOTIFY pgrst, 'reload schema';
