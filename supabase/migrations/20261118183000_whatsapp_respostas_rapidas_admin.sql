-- Respostas rápidas do atendimento manual WhatsApp (/atalho).
-- O texto é mantido com suas quebras de linha, emojis e marcações do WhatsApp.
create table if not exists public.whatsapp_respostas_rapidas (
  id uuid primary key default gen_random_uuid(),
  atalho text not null unique check (atalho ~ '^[a-z0-9_-]{1,50}$'),
  mensagem text not null check (length(btrim(mensagem)) > 0 and length(mensagem) <= 4096),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_respostas_rapidas enable row level security;
revoke all on public.whatsapp_respostas_rapidas from anon, public;
grant select, insert, update, delete on public.whatsapp_respostas_rapidas to authenticated;
grant select, insert, update, delete on public.whatsapp_respostas_rapidas to service_role;

create policy "whatsapp_respostas_rapidas_admin"
  on public.whatsapp_respostas_rapidas
  for all to authenticated
  using (public.usuario_tem_role(array['admin'::text]))
  with check (public.usuario_tem_role(array['admin'::text]));

insert into public.whatsapp_respostas_rapidas (atalho, mensagem)
values ('campoalegre', $msg$🚛 *Entregas CAMPO ALEGRE*
📆 *Toda SEXTA*
🗒️ *Pedidos até sexta 11h*
🏪 *Ou escolha na Loja em SBS*
💚 *Peça pelo whats ou site*$msg$)
on conflict (atalho) do nothing;
