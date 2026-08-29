-- ============================================================
-- Agendamento do alerta diário de estoque via WhatsApp
-- Chama a edge function estoque-alerta-diario todo dia às 19h (Brasília).
-- 19h America/Sao_Paulo (UTC-3) == 22:00 UTC → expressão '0 22 * * *'.
--
-- PRÉ-REQUISITOS:
--   1. Deploy da função:  supabase functions deploy estoque-alerta-diario
--   2. Secrets já existentes reaproveitados: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
--      CRON_SECRET. Opcional: ADMIN_ALERT_PHONE (default 5547997391514 no código).
--      Para trocar o número depois:  supabase secrets set ADMIN_ALERT_PHONE=55XXXXXXXXXXX
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento anterior com o mesmo nome, se existir (evita duplicar)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'estoque-alerta-diario') THEN
    PERFORM cron.unschedule('estoque-alerta-diario');
  END IF;
END $$;

-- Agenda diariamente às 22:00 UTC (= 19:00 em Brasília, UTC-3)
SELECT cron.schedule(
  'estoque-alerta-diario',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/estoque-alerta-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg',
      'x-cron-secret', 'ShlGfXVdQmUMo8RaWCyTFzv31J0NIZirHu46OA7n'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Conferir agendamentos:
--   SELECT jobid, jobname, schedule, active FROM cron.job;
-- Ver últimas execuções:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- Testar manualmente a função (envia agora):
--   supabase functions invoke estoque-alerta-diario --no-verify-jwt
