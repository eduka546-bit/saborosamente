-- ============================================================
-- Agendamento do tick de automações WhatsApp
-- Chama a edge function whatsapp-automacoes-tick a cada minuto para retomar
-- execuções paradas em nós "aguardar" cujo tempo já venceu.
--
-- PRÉ-REQUISITOS:
--   1. Deploy da função:  supabase functions deploy whatsapp-automacoes-tick
--   2. Definir os secrets: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID e CRON_SECRET
--      (o CRON_SECRET é o mesmo valor usado abaixo em 'x-cron-secret').
--
-- ANTES DE RODAR, substitua:
--   <PROJECT_REF>  → o ref do seu projeto Supabase (ex: abcdefgh)
--   <CRON_SECRET>  → o mesmo valor configurado no secret CRON_SECRET da função
-- ============================================================

-- Extensões necessárias (idempotente)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento anterior com o mesmo nome, se existir (evita duplicar)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'whatsapp-automacoes-tick') THEN
    PERFORM cron.unschedule('whatsapp-automacoes-tick');
  END IF;
END $$;

-- Agenda a chamada a cada 4 minutos
SELECT cron.schedule(
  'whatsapp-automacoes-tick',
  '*/4 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-automacoes-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'ShlGfXVdQmUMo8RaWCyTFzv31J0NIZirHu46OA7n'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Para conferir os agendamentos:
--   SELECT jobid, jobname, schedule, active FROM cron.job;
-- Para ver as últimas execuções do cron:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- Para desagendar:
--   SELECT cron.unschedule('whatsapp-automacoes-tick');
