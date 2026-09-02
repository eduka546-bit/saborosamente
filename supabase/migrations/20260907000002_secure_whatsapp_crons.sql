-- Store per-job credentials in the private schema and keep plaintext out of source control.
INSERT INTO private.edge_cron_secrets (name, secret_value, secret_hash)
SELECT job_name, value, encode(extensions.digest(value, 'sha256'), 'hex')
FROM (
  SELECT 'whatsapp-automacoes-tick'::text AS job_name,
         encode(extensions.gen_random_bytes(32), 'hex') AS value
) generated
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
  PERFORM cron.unschedule('whatsapp-automacoes-tick');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule(
  'whatsapp-automacoes-tick',
  '*/4 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-automacoes-tick',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          SELECT secret_value FROM private.edge_cron_secrets
          WHERE name = 'whatsapp-automacoes-tick'
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cron$
);
