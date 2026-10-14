-- Etiquetas manuais dos clientes e pré-cadastros por telefone; acesso exclusivo ao administrador.
create table if not exists public.clientes_etiquetas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) between 1 and 48),
  cor text not null default '#086e45' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists clientes_etiquetas_nome_unico on public.clientes_etiquetas (lower(btrim(nome)));

create table if not exists public.clientes_etiquetas_atribuicoes (
  etiqueta_id uuid not null references public.clientes_etiquetas(id) on delete cascade,
  cliente_chave text not null check (length(btrim(cliente_chave)) between 4 and 180),
  created_at timestamptz not null default now(),
  primary key (etiqueta_id, cliente_chave)
);
create index if not exists clientes_etiquetas_atribuicoes_chave on public.clientes_etiquetas_atribuicoes(cliente_chave);

alter table public.clientes_etiquetas enable row level security;
alter table public.clientes_etiquetas_atribuicoes enable row level security;

revoke all on public.clientes_etiquetas from anon;
revoke all on public.clientes_etiquetas_atribuicoes from anon;
grant select, insert, update, delete on public.clientes_etiquetas to authenticated;
grant select, insert, update, delete on public.clientes_etiquetas_atribuicoes to authenticated;

do $
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clientes_etiquetas' and policyname = 'Etiquetas apenas administradores') then
    create policy "Etiquetas apenas administradores" on public.clientes_etiquetas
      for all to authenticated
      using (public.has_role((select auth.uid()), 'admin'::public.app_role))
      with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clientes_etiquetas_atribuicoes' and policyname = 'Atribuicoes apenas administradores') then
    create policy "Atribuicoes apenas administradores" on public.clientes_etiquetas_atribuicoes
      for all to authenticated
      using (public.has_role((select auth.uid()), 'admin'::public.app_role))
      with check (public.has_role((select auth.uid()), 'admin'::public.app_role));
  end if;
end;
$;

insert into public.clientes_etiquetas(nome, cor) values
  ('VIP','#8b5cf6'),
  ('Cliente fiel','#086e45'),
  ('Acompanhar','#f59e0b'),
  ('Atendimento especial','#2563eb'),
  ('Interesse em combos','#e87921'),
  ('Preferência por sopas','#14b8a6')
on conflict do nothing;
