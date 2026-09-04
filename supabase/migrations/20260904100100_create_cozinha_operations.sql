create table if not exists public.cozinha_receitas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null unique references public.produtos(id) on delete cascade,
  ingredientes jsonb not null default '[]'::jsonb,
  modo_preparo text,
  rendimento_observacao text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.cozinha_producoes (
  id uuid primary key default gen_random_uuid(),
  data_producao date not null default current_date,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  quantidade_planejada integer not null check (quantidade_planejada > 0),
  quantidade_produzida integer not null default 0 check (quantidade_produzida >= 0),
  status text not null default 'planejada' check (status in ('planejada', 'em_preparo', 'concluida')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.cozinha_estoque (
  id uuid primary key default gen_random_uuid(),
  ingrediente text not null unique,
  unidade text not null default 'kg',
  quantidade_atual numeric not null default 0 check (quantidade_atual >= 0),
  quantidade_minima numeric not null default 0 check (quantidade_minima >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create index if not exists cozinha_producoes_data_idx on public.cozinha_producoes(data_producao, status);
create index if not exists cozinha_producoes_produto_idx on public.cozinha_producoes(produto_id);

alter table public.cozinha_receitas enable row level security;
alter table public.cozinha_producoes enable row level security;
alter table public.cozinha_estoque enable row level security;

create policy "cozinha e admin acessam receitas" on public.cozinha_receitas
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role));

create policy "cozinha e admin acessam producoes" on public.cozinha_producoes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role));

create policy "cozinha e admin acessam estoque" on public.cozinha_estoque
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role));
