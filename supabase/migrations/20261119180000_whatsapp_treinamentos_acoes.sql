create table public.whatsapp_acoes_botoes (
  id uuid primary key default gen_random_uuid(),
  rotulo text not null check (length(trim(rotulo)) between 1 and 80),
  chave text not null unique check (length(chave) between 1 and 80),
  acao text not null check (acao in ('menu_cardapio','menu_pedido','menu_atendente','menu_site','duvida_como_funciona','duvida_entrega','duvida_pagamento','duvida_descontos')),
  ativo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.agente_treinamentos (
  id uuid primary key default gen_random_uuid(),
  pergunta text not null check (length(trim(pergunta)) between 1 and 1500),
  resposta text not null check (length(trim(resposta)) between 1 and 1500),
  status text not null default 'pendente' check (status in ('pendente','aprovado','arquivado')),
  created_at timestamptz not null default now()
);

alter table public.whatsapp_acoes_botoes enable row level security;
alter table public.agente_treinamentos enable row level security;
revoke all on public.whatsapp_acoes_botoes, public.agente_treinamentos from public, anon, authenticated;
grant select, insert, update on public.whatsapp_acoes_botoes, public.agente_treinamentos to authenticated;
grant select, insert, update on public.whatsapp_acoes_botoes, public.agente_treinamentos to service_role;
create policy "admin_acoes_botoes" on public.whatsapp_acoes_botoes for all to authenticated
  using (public.usuario_tem_role(array['admin'::text])) with check (public.usuario_tem_role(array['admin'::text]));
create policy "admin_treinamentos" on public.agente_treinamentos for all to authenticated
  using (public.usuario_tem_role(array['admin'::text])) with check (public.usuario_tem_role(array['admin'::text]));
