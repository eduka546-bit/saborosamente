-- pg_cron runs in GMT; 21:45 GMT is 18:45 in São Bento do Sul (BRT, UTC-3).
INSERT INTO private.edge_cron_secrets (name, secret_value, secret_hash)
SELECT 'estoque-alerta-diario', value, encode(extensions.digest(value, 'sha256'), 'hex')
FROM (SELECT encode(extensions.gen_random_bytes(32), 'hex') AS value) generated
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
  PERFORM cron.unschedule('estoque-alerta-diario');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule(
  'estoque-alerta-diario',
  '45 21 * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/estoque-alerta-diario',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          SELECT secret_value FROM private.edge_cron_secrets
          WHERE name = 'estoque-alerta-diario'
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cron$
);
