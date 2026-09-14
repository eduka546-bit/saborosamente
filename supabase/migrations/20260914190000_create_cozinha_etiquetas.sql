create sequence if not exists public.cozinha_etiquetas_ean_seq start 1;

create or replace function public.gerar_codigo_barras_etiqueta()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  base text;
  soma integer := 0;
  i integer;
  digito integer;
begin
  base := '789' || lpad(nextval('public.cozinha_etiquetas_ean_seq')::text, 9, '0');
  for i in 1..12 loop
    soma := soma + (substring(base from i for 1)::integer * case when (12 - i) % 2 = 0 then 1 else 3 end);
  end loop;
  digito := (10 - (soma % 10)) % 10;
  return base || digito::text;
end;
$$;

create table if not exists public.cozinha_etiquetas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  tamanho_g integer not null check (tamanho_g in (200, 300, 400)),
  codigo_barras text not null unique default public.gerar_codigo_barras_etiqueta(),
  nome_exibicao text,
  ingredientes text,
  informacao_nutricional jsonb not null default '{}'::jsonb,
  instrucoes_preparo text,
  conservacao text,
  validade_dias integer check (validade_dias is null or validade_dias >= 0),
  imagem_url text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (produto_id, tamanho_g)
);

create index if not exists cozinha_etiquetas_produto_idx on public.cozinha_etiquetas(produto_id, tamanho_g);

alter table public.cozinha_etiquetas enable row level security;

create policy "cozinha le etiquetas" on public.cozinha_etiquetas
for select to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role));

create policy "cozinha gerencia etiquetas" on public.cozinha_etiquetas
for all to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role))
with check (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role));

create or replace function public.atualizar_updated_at_cozinha_etiquetas()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists cozinha_etiquetas_updated_at on public.cozinha_etiquetas;
create trigger cozinha_etiquetas_updated_at before update on public.cozinha_etiquetas
for each row execute function public.atualizar_updated_at_cozinha_etiquetas();

notify pgrst, 'reload schema';
