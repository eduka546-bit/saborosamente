-- Estatísticas derivadas dos registros de cada envio, em vez de
-- contadores antigos que ficavam desatualizados após webhooks.
-- SECURITY INVOKER: respeita as políticas RLS administrativas das duas tabelas.
CREATE OR REPLACE VIEW public.campanhas_whatsapp_resumo
WITH (security_invoker = true)
AS
SELECT
  e.campanha_id,
  count(*)::integer AS registros,
  count(DISTINCT regexp_replace(e.telefone, '[^0-9]', '', 'g'))::integer AS destinatarios_unicos,
  count(*) FILTER (WHERE e.status IN ('enviado','entregue','lido'))::integer AS enviados,
  count(DISTINCT regexp_replace(e.telefone, '[^0-9]', '', 'g'))
    FILTER (WHERE e.status IN ('enviado','entregue','lido'))::integer AS destinatarios_com_envio,
  count(*) FILTER (WHERE e.entregue_em IS NOT NULL OR e.status IN ('entregue','lido'))::integer AS entregues,
  count(*) FILTER (WHERE e.lida_em IS NOT NULL OR e.status = 'lido')::integer AS lidos,
  count(*) FILTER (WHERE e.status = 'falhou')::integer AS falhas,
  count(*) FILTER (WHERE e.status = 'pendente')::integer AS pendentes,
  count(*) FILTER (WHERE e.respondeu_em IS NOT NULL)::integer AS responderam,
  count(*) FILTER (WHERE e.interagiu_em IS NOT NULL)::integer AS interagiram,
  count(*) FILTER (WHERE e.meta_message_id IS NULL AND e.status IN ('enviado','entregue','lido'))::integer AS sem_id_meta,
  (count(*) - count(DISTINCT regexp_replace(e.telefone, '[^0-9]', '', 'g')))::integer AS registros_repetidos,
  (count(*) FILTER (WHERE e.status IN ('enviado','entregue','lido')) -
   count(DISTINCT regexp_replace(e.telefone, '[^0-9]', '', 'g'))
     FILTER (WHERE e.status IN ('enviado','entregue','lido')))::integer AS envios_repetidos
FROM public.campanhas_whatsapp_envios e
GROUP BY e.campanha_id;

REVOKE ALL ON public.campanhas_whatsapp_resumo FROM PUBLIC, anon;
GRANT SELECT ON public.campanhas_whatsapp_resumo TO authenticated, service_role;
