alter table public.campanhas_whatsapp_envios
  add column if not exists meta_message_id text,
  add column if not exists entregue_em timestamptz,
  add column if not exists lida_em timestamptz;

create unique index if not exists campanhas_whatsapp_envios_meta_message_id_key
  on public.campanhas_whatsapp_envios (meta_message_id)
  where meta_message_id is not null;

create index if not exists campanhas_whatsapp_envios_telefone_idx
  on public.campanhas_whatsapp_envios (telefone);
