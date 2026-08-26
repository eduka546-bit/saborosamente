-- ============================================================================
-- MIGRATIONS FALTANTES — abas admin que retornavam 404/400
-- ----------------------------------------------------------------------------
-- Gerado a partir da auditoria (as queries do frontend esperam estas
-- tabelas/colunas, que ainda NÃO existem no banco).
--
-- REVISE antes de aplicar. Rode no SQL Editor do Supabase.
-- Os tipos de coluna foram inferidos dos formulários da UI; ajuste conforme
-- sua modelagem real (ex.: se "custo"/"preco" devem ser numeric(10,2)).
--
-- Todas as tabelas têm RLS habilitada. As policies abaixo permitem acesso a
-- usuários autenticados (ajuste para exigir role admin se desejar, seguindo o
-- padrão de user_roles usado no restante do projeto).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) acompanhamentos  (rota: /admin/acompanhamentos)
-- ---------------------------------------------------------------------------
create table if not exists public.acompanhamentos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  preco       numeric(10, 2) not null default 0,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.acompanhamentos enable row level security;
create policy "acompanhamentos_auth_all" on public.acompanhamentos
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 2) embalagens  (rota: /admin/embalagens)  — form: nome, descricao, custo
-- ---------------------------------------------------------------------------
create table if not exists public.embalagens (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  custo       numeric(10, 2) not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.embalagens enable row level security;
create policy "embalagens_auth_all" on public.embalagens
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 3) entregadores  (rota: /admin/config/entregador) — nome, telefone, veiculo, ativo
-- ---------------------------------------------------------------------------
create table if not exists public.entregadores (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  telefone    text,
  veiculo     text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.entregadores enable row level security;
create policy "entregadores_auth_all" on public.entregadores
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 4) unidades  (rota: /admin/config/unidades)
-- ---------------------------------------------------------------------------
create table if not exists public.unidades (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  endereco    text,
  telefone    text,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.unidades enable row level security;
create policy "unidades_auth_all" on public.unidades
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 5) ouvidoria  (rota: /admin/ouvidoria) — join com profiles(nome,email), status
-- ---------------------------------------------------------------------------
create table if not exists public.ouvidoria (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete set null,
  mensagem    text not null,
  status      text not null default 'aberto',   -- aberto | resolvido
  created_at  timestamptz not null default now()
);
alter table public.ouvidoria enable row level security;
-- Cliente pode abrir manifestação; admin lê/atualiza. Ajuste conforme necessário.
create policy "ouvidoria_insert_auth" on public.ouvidoria
  for insert to authenticated with check (true);
create policy "ouvidoria_select_auth" on public.ouvidoria
  for select to authenticated using (true);
create policy "ouvidoria_update_auth" on public.ouvidoria
  for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 6) complementos  (rota: /admin/complementos) — grupos + itens (1:N)
-- ---------------------------------------------------------------------------
create table if not exists public.complemento_grupos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  obrigatorio boolean not null default false,
  min_escolhas int not null default 0,
  max_escolhas int not null default 1,
  created_at  timestamptz not null default now()
);
create table if not exists public.complemento_itens (
  id          uuid primary key default gen_random_uuid(),
  grupo_id    uuid not null references public.complemento_grupos (id) on delete cascade,
  nome        text not null,
  preco       numeric(10, 2) not null default 0,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.complemento_grupos enable row level security;
alter table public.complemento_itens enable row level security;
create policy "complemento_grupos_auth_all" on public.complemento_grupos
  for all to authenticated using (true) with check (true);
create policy "complemento_itens_auth_all" on public.complemento_itens
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 7) cashback_transacoes / cashback_saldo (rota: /admin/config/cashback-config)
--    Só crie se ainda não existirem — o checkout/cashback.ts já usa cashback_saldo.
-- ---------------------------------------------------------------------------
create table if not exists public.cashback_saldo (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  saldo       numeric(10, 2) not null default 0,
  updated_at  timestamptz not null default now()
);
create table if not exists public.cashback_transacoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  pedido_id   uuid,
  tipo        text not null,                    -- credito | debito
  valor       numeric(10, 2) not null,
  created_at  timestamptz not null default now()
);
alter table public.cashback_saldo enable row level security;
alter table public.cashback_transacoes enable row level security;
create policy "cashback_saldo_auth_all" on public.cashback_saldo
  for all to authenticated using (true) with check (true);
create policy "cashback_transacoes_auth_all" on public.cashback_transacoes
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 8) Colunas faltantes em site_settings (rotas config com erro 400)
--    parametros / informativo / horarios / cashback-config leem/escrevem estas.
--    São armazenadas como JSONB (a UI usa objetos) ou escalares.
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists parametros_loja        jsonb,
  add column if not exists avisos_informativos     jsonb,
  add column if not exists horarios_funcionamento  jsonb,
  add column if not exists cashback_ativo          boolean default false,
  add column if not exists cashback_percentual     numeric(5, 2) default 0,
  add column if not exists cashback_validade_dias   int default 90,
  add column if not exists cashback_minimo_uso      numeric(10, 2) default 5,
  add column if not exists cashback_limite_desconto_pct numeric(5, 2) default 50;

-- ---------------------------------------------------------------------------
-- NOTA sobre /admin/pontuacao (erro 400):
--   A query filtra .neq("status", "Cancelado") com C maiúsculo, mas os status
--   reais dos pedidos são minúsculos ("cancelado"). Corrigir no código
--   (src/routes/admin/pontuacao.tsx) em vez de no banco.
-- ============================================================================
