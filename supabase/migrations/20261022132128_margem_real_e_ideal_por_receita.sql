alter table public.cozinha_receitas
  add column if not exists margem_custo_ideal_percentual numeric not null default 20
  check (margem_custo_ideal_percentual >= 0);

update public.cozinha_receitas
set margem_custo_ideal_percentual = 20
where margem_custo_ideal_percentual is null;
