-- Fichas técnicas estruturadas da cozinha: ingredientes, preparações e marmitas.

create table if not exists public.cozinha_ingredientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  unidade_medida text not null default 'g' check (unidade_medida in ('g', 'un')),
  rendimento_padrao numeric(8,4) not null default 1 check (rendimento_padrao > 0),
  custo_por_kg numeric(12,4) not null default 0 check (custo_por_kg >= 0),
  custo_por_unidade numeric(12,4) not null default 0 check (custo_por_unidade >= 0),
  ultimo_valor_pago numeric(12,2),
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.cozinha_preparacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  rendimento_final_g numeric(12,2) not null default 0 check (rendimento_final_g >= 0),
  modo_preparo text,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.cozinha_preparacao_itens (
  id uuid primary key default gen_random_uuid(),
  preparacao_id uuid not null references public.cozinha_preparacoes(id) on delete cascade,
  ingrediente_id uuid not null references public.cozinha_ingredientes(id) on delete restrict,
  quantidade numeric(12,3) not null default 0 check (quantidade >= 0),
  rendimento_quebra numeric(8,4) not null default 1 check (rendimento_quebra > 0),
  ordem integer not null default 0,
  unique (preparacao_id, ingrediente_id)
);

create table if not exists public.cozinha_receita_itens (
  id uuid primary key default gen_random_uuid(),
  receita_id uuid not null references public.cozinha_receitas(id) on delete cascade,
  ingrediente_id uuid references public.cozinha_ingredientes(id) on delete restrict,
  preparacao_id uuid references public.cozinha_preparacoes(id) on delete restrict,
  gramas_200 numeric(12,3) not null default 0 check (gramas_200 >= 0),
  gramas_300 numeric(12,3) not null default 0 check (gramas_300 >= 0),
  gramas_400 numeric(12,3) not null default 0 check (gramas_400 >= 0),
  gramas_personalizada numeric(12,3) not null default 0 check (gramas_personalizada >= 0),
  rendimento_quebra numeric(8,4) not null default 1 check (rendimento_quebra > 0),
  observacao text,
  ordem integer not null default 0,
  constraint cozinha_receita_itens_origem_check check (
    (ingrediente_id is not null and preparacao_id is null) or
    (ingrediente_id is null and preparacao_id is not null)
  )
);

-- Mantém as receitas simples que já existiam. Elas entram como componentes
-- iniciais e a cozinha só precisa informar as gramaturas depois, sem perder
-- os nomes que já estavam cadastrados.
insert into public.cozinha_ingredientes (nome)
select distinct trim(ingrediente.nome)
from public.cozinha_receitas receita
cross join lateral jsonb_array_elements_text(receita.ingredientes) as ingrediente(nome)
where trim(ingrediente.nome) <> ''
on conflict (nome) do nothing;

insert into public.cozinha_receita_itens (receita_id, ingrediente_id, ordem)
select receita.id, ingrediente.id, row_number() over (partition by receita.id order by ingrediente.nome) - 1
from public.cozinha_receitas receita
cross join lateral jsonb_array_elements_text(receita.ingredientes) as nome_ingrediente(nome)
join public.cozinha_ingredientes ingrediente on ingrediente.nome = trim(nome_ingrediente.nome)
where trim(nome_ingrediente.nome) <> ''
  and not exists (
    select 1
    from public.cozinha_receita_itens item
    where item.receita_id = receita.id
      and item.ingrediente_id = ingrediente.id
  );

alter table public.cozinha_producoes
  add column if not exists gramatura text not null default '400' check (gramatura in ('200', '300', '400', 'personalizada'));

create index if not exists cozinha_preparacao_itens_preparacao_idx on public.cozinha_preparacao_itens(preparacao_id);
create index if not exists cozinha_receita_itens_receita_idx on public.cozinha_receita_itens(receita_id);

alter table public.cozinha_ingredientes enable row level security;
alter table public.cozinha_preparacoes enable row level security;
alter table public.cozinha_preparacao_itens enable row level security;
alter table public.cozinha_receita_itens enable row level security;

create policy "cozinha e admin acessam ingredientes" on public.cozinha_ingredientes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role));

create policy "cozinha e admin acessam preparacoes" on public.cozinha_preparacoes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role));

create policy "cozinha e admin acessam itens de preparacao" on public.cozinha_preparacao_itens
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role));

create policy "cozinha e admin acessam itens de receita" on public.cozinha_receita_itens
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) or public.has_role(auth.uid(), 'cozinha'::public.app_role));

grant select, insert, update, delete on public.cozinha_ingredientes, public.cozinha_preparacoes, public.cozinha_preparacao_itens, public.cozinha_receita_itens to authenticated;
