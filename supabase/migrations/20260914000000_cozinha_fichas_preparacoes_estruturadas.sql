alter table public.cozinha_receitas
  add column if not exists preparacoes jsonb not null default '[]'::jsonb;

alter table public.cozinha_preparacao_itens
  add column if not exists quantidade_texto text;

create table if not exists public.cozinha_ingrediente_aliases (
  id uuid primary key default gen_random_uuid(),
  ingrediente_id uuid not null references public.cozinha_ingredientes(id) on delete cascade,
  alias text not null unique,
  created_at timestamptz not null default now()
);

alter table public.cozinha_ingrediente_aliases enable row level security;
create index if not exists cozinha_ingrediente_aliases_ingrediente_idx
  on public.cozinha_ingrediente_aliases(ingrediente_id);
