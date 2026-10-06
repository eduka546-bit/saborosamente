alter table public.cozinha_receitas add column if not exists margem_custo_percentual numeric not null default 10 check (margem_custo_percentual >= 0);
