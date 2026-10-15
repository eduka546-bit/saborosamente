-- Ajustes operacionais de ingredientes por dia, separados das receitas e das baixas de estoque.
create table if not exists public.cozinha_ingredientes_manuais (
 id uuid primary key default gen_random_uuid(),
 data_producao date not null,
 tipo text not null check (tipo in ('ajuste','adicional')),
 ingrediente_id uuid references public.cozinha_ingredientes(id) on delete set null,
 nome text not null check (length(btrim(nome)) between 1 and 120),
 unidade text not null check (unidade in ('g','L','un')),
 quantidade numeric not null check (quantidade >= 0 and quantidade <= 100000000),
 referencia_original numeric,
 marcado_em timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint ajuste_requer_ingrediente check (tipo <> 'ajuste' or ingrediente_id is not null)
);
create unique index if not exists coz_ingred_man_ajustes_unicos on public.cozinha_ingredientes_manuais (data_producao,ingrediente_id,unidade) where tipo='ajuste';
create unique index if not exists coz_ingred_man_adicionais_unicos on public.cozinha_ingredientes_manuais (data_producao,lower(btrim(nome)),unidade) where tipo='adicional';
create index if not exists coz_ingred_man_data on public.cozinha_ingredientes_manuais(data_producao);
alter table public.cozinha_ingredientes_manuais enable row level security;
revoke all on public.cozinha_ingredientes_manuais from anon;
grant select,insert,update,delete on public.cozinha_ingredientes_manuais to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='cozinha_ingredientes_manuais' and policyname='Cozinha e admin gerenciam ajustes de ingredientes') then
  create policy "Cozinha e admin gerenciam ajustes de ingredientes" on public.cozinha_ingredientes_manuais for all to authenticated
   using(public.has_role((select auth.uid()),'admin'::public.app_role) or public.has_role((select auth.uid()),'cozinha'::public.app_role))
   with check(public.has_role((select auth.uid()),'admin'::public.app_role) or public.has_role((select auth.uid()),'cozinha'::public.app_role));
 end if;
end $$;