update public.site_settings
set parametros_loja =
  jsonb_set(
    jsonb_set(
      coalesce(parametros_loja, '{}'::jsonb),
      '{google_analytics_id}',
      to_jsonb('G-S49FE5L25S'::text),
      true
    ),
    '{google_analytics_ativo}',
    'true'::jsonb,
    true
  );
