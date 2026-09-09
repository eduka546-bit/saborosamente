alter table public.cozinha_estoque add column if not exists ingrediente_id uuid references public.cozinha_ingredientes(id) on delete cascade;
create unique index if not exists cozinha_estoque_ingrediente_id_idx on public.cozinha_estoque(ingrediente_id) where ingrediente_id is not null;

insert into public.cozinha_estoque (ingrediente, ingrediente_id, unidade, quantidade_atual, quantidade_minima)
select i.nome, i.id, case when i.unidade_medida = 'un' then 'un' else 'g' end, 0, 0
from public.cozinha_ingredientes i
where not exists (select 1 from public.cozinha_estoque e where e.ingrediente_id = i.id or lower(e.ingrediente) = lower(i.nome));

create table if not exists public.cozinha_movimentacoes_ingredientes (
  id uuid primary key default gen_random_uuid(),
  ingrediente_id uuid not null references public.cozinha_ingredientes(id) on delete restrict,
  producao_id uuid references public.cozinha_producoes(id) on delete set null,
  tipo text not null check (tipo in ('consumo_producao','estorno_producao','ajuste')),
  quantidade numeric not null,
  observacao text,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists cozinha_mov_ingredientes_data_idx on public.cozinha_movimentacoes_ingredientes(created_at desc);

create table if not exists public.cozinha_lotes_producao (
  id uuid primary key default gen_random_uuid(),
  producao_id uuid not null unique references public.cozinha_producoes(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  tamanho text not null check (tamanho in ('200','300','400')),
  quantidade_inicial integer not null check (quantidade_inicial > 0),
  quantidade_disponivel integer not null check (quantidade_disponivel >= 0),
  created_at timestamptz not null default now()
);
create index if not exists cozinha_lotes_disponiveis_idx on public.cozinha_lotes_producao(produto_id, tamanho, created_at) where quantidade_disponivel > 0;

create table if not exists public.cozinha_transferencia_lotes (
  transferencia_id uuid not null references public.cozinha_transferencias_estoque(id) on delete cascade,
  lote_id uuid not null references public.cozinha_lotes_producao(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  primary key (transferencia_id, lote_id)
);

alter table public.cozinha_movimentacoes_ingredientes enable row level security;
alter table public.cozinha_lotes_producao enable row level security;
alter table public.cozinha_transferencia_lotes enable row level security;
create policy "cozinha consulta movimentos de ingredientes" on public.cozinha_movimentacoes_ingredientes for select to authenticated using (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role));
create policy "cozinha consulta lotes" on public.cozinha_lotes_producao for select to authenticated using (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role));
create policy "cozinha consulta lotes transferidos" on public.cozinha_transferencia_lotes for select to authenticated using (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role));

create or replace function public.concluir_producao_cozinha(p_producao_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v public.cozinha_producoes%rowtype; c text; falta text; r record;
begin
  if not (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role)) then raise exception 'Acesso não autorizado' using errcode = '42501'; end if;
  select * into v from public.cozinha_producoes where id = p_producao_id for update;
  if not found then raise exception 'Produção não encontrada'; end if;
  if v.status = 'concluida' then return; end if;
  c := case v.gramatura when '200' then 'estoque_200g' when '300' then 'estoque_300g' when '400' then 'estoque_400g' else null end;
  if c is null then raise exception 'Tamanho de produção inválido'; end if;
  create temporary table if not exists _necessidades (ingrediente_id uuid primary key, quantidade numeric not null) on commit drop;
  truncate _necessidades;
  insert into _necessidades
  select z.ingrediente_id, sum(z.quantidade) from (
    select ri.ingrediente_id,
      (case ri.operacao_producao when 'acrescentar' then (case v.gramatura when '200' then ri.gramas_200 when '300' then ri.gramas_300 else ri.gramas_400 end) * (1 + ri.fator_producao) when 'dividir' then (case v.gramatura when '200' then ri.gramas_200 when '300' then ri.gramas_300 else ri.gramas_400 end) / ri.fator_producao else (case v.gramatura when '200' then ri.gramas_200 when '300' then ri.gramas_300 else ri.gramas_400 end) end) * v.quantidade_planejada * ci.rendimento_padrao quantidade
    from public.cozinha_receitas cr join public.cozinha_receita_itens ri on ri.receita_id = cr.id join public.cozinha_ingredientes ci on ci.id = ri.ingrediente_id
    where cr.produto_id = v.produto_id and ri.ingrediente_id is not null
    union all
    select pi.ingrediente_id,
      ((case ri.operacao_producao when 'acrescentar' then (case v.gramatura when '200' then ri.gramas_200 when '300' then ri.gramas_300 else ri.gramas_400 end) * (1 + ri.fator_producao) when 'dividir' then (case v.gramatura when '200' then ri.gramas_200 when '300' then ri.gramas_300 else ri.gramas_400 end) / ri.fator_producao else (case v.gramatura when '200' then ri.gramas_200 when '300' then ri.gramas_300 else ri.gramas_400 end) end) * v.quantidade_planejada / cp.rendimento_final_g) * pi.quantidade * ci.rendimento_padrao quantidade
    from public.cozinha_receitas cr join public.cozinha_receita_itens ri on ri.receita_id = cr.id join public.cozinha_preparacoes cp on cp.id = ri.preparacao_id join public.cozinha_preparacao_itens pi on pi.preparacao_id = cp.id join public.cozinha_ingredientes ci on ci.id = pi.ingrediente_id
    where cr.produto_id = v.produto_id and ri.preparacao_id is not null
  ) z group by z.ingrediente_id;
  select string_agg(ci.nome, ', ') into falta from _necessidades n join public.cozinha_ingredientes ci on ci.id=n.ingrediente_id left join public.cozinha_estoque e on e.ingrediente_id=n.ingrediente_id where coalesce(e.quantidade_atual,0) < n.quantidade;
  if falta is not null then raise exception 'Estoque insuficiente para: %', falta; end if;
  for r in select * from _necessidades loop
    update public.cozinha_estoque set quantidade_atual = quantidade_atual-r.quantidade, updated_at=now(), updated_by=(select auth.uid()) where ingrediente_id=r.ingrediente_id;
    insert into public.cozinha_movimentacoes_ingredientes(ingrediente_id,producao_id,tipo,quantidade,criado_por) values(r.ingrediente_id,v.id,'consumo_producao',-r.quantidade,(select auth.uid()));
  end loop;
  insert into public.cozinha_estoque_marmitas(produto_id,updated_by) values(v.produto_id,(select auth.uid())) on conflict(produto_id) do nothing;
  execute format('update public.cozinha_estoque_marmitas set %I=%I+$1,updated_at=now(),updated_by=$2 where produto_id=$3',c,c) using v.quantidade_planejada,(select auth.uid()),v.produto_id;
  insert into public.cozinha_lotes_producao(producao_id,produto_id,tamanho,quantidade_inicial,quantidade_disponivel) values(v.id,v.produto_id,v.gramatura,v.quantidade_planejada,v.quantidade_planejada) on conflict(producao_id) do nothing;
  update public.cozinha_producoes set status='concluida',quantidade_produzida=quantidade_planejada,updated_at=now() where id=v.id;
end; $$;

create or replace function public.ajustar_estoque_ingrediente(p_ingrediente_id uuid, p_quantidade numeric, p_minimo numeric, p_observacao text default null) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role)) then raise exception 'Acesso não autorizado' using errcode = '42501'; end if;
  if p_quantidade < 0 or p_minimo < 0 then raise exception 'Valores inválidos'; end if;
  update public.cozinha_estoque set quantidade_atual=p_quantidade,quantidade_minima=p_minimo,updated_at=now(),updated_by=(select auth.uid()) where ingrediente_id=p_ingrediente_id;
  if not found then raise exception 'Ingrediente não encontrado no estoque'; end if;
  insert into public.cozinha_movimentacoes_ingredientes(ingrediente_id,tipo,quantidade,observacao,criado_por) values(p_ingrediente_id,'ajuste',p_quantidade,p_observacao,(select auth.uid()));
end; $$;

create or replace function public.reverter_conclusao_producao_cozinha(p_producao_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v public.cozinha_producoes%rowtype; c text; lote public.cozinha_lotes_producao%rowtype; r record;
begin
  if not (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role)) then raise exception 'Acesso não autorizado' using errcode = '42501'; end if;
  select * into v from public.cozinha_producoes where id=p_producao_id for update;
  if not found then raise exception 'Produção não encontrada'; end if;
  if v.status <> 'concluida' then return; end if;
  select * into lote from public.cozinha_lotes_producao where producao_id=v.id for update;
  if not found or lote.quantidade_disponivel <> lote.quantidade_inicial then raise exception 'Não é possível voltar para pendente: parte deste lote já foi transferida para a loja.'; end if;
  c:=case v.gramatura when '200' then 'estoque_200g' when '300' then 'estoque_300g' when '400' then 'estoque_400g' else null end;
  execute format('update public.cozinha_estoque_marmitas set %I=%I-$1,updated_at=now(),updated_by=$2 where produto_id=$3',c,c) using v.quantidade_planejada,(select auth.uid()),v.produto_id;
  for r in select ingrediente_id, -sum(quantidade) quantidade from public.cozinha_movimentacoes_ingredientes where producao_id=v.id and tipo='consumo_producao' group by ingrediente_id loop
    update public.cozinha_estoque set quantidade_atual=quantidade_atual+r.quantidade,updated_at=now(),updated_by=(select auth.uid()) where ingrediente_id=r.ingrediente_id;
    insert into public.cozinha_movimentacoes_ingredientes(ingrediente_id,producao_id,tipo,quantidade,criado_por) values(r.ingrediente_id,v.id,'estorno_producao',r.quantidade,(select auth.uid()));
  end loop;
  delete from public.cozinha_lotes_producao where id=lote.id;
  update public.cozinha_producoes set status='planejada',quantidade_produzida=0,updated_at=now() where id=v.id;
end; $$;

create or replace function public.transferir_cozinha_para_loja(p_produto_id uuid,p_tamanho text,p_quantidade integer) returns void language plpgsql security definer set search_path = '' as $$
declare saldo integer; c text; restante integer := p_quantidade; l record; transferencia uuid;
begin
  if not (public.has_role((select auth.uid()), 'admin'::public.app_role) or public.has_role((select auth.uid()), 'cozinha'::public.app_role)) then raise exception 'Acesso não autorizado' using errcode = '42501'; end if;
  if p_quantidade is null or p_quantidade<=0 then raise exception 'Informe uma quantidade válida'; end if;
  c:=case p_tamanho when '200' then 'estoque_200g' when '300' then 'estoque_300g' when '400' then 'estoque_400g' else null end;
  if c is null then raise exception 'Tamanho inválido'; end if;
  execute format('select %I from public.cozinha_estoque_marmitas where produto_id=$1 for update',c) into saldo using p_produto_id;
  if saldo is null or saldo<p_quantidade then raise exception 'Quantidade maior que o saldo da cozinha'; end if;
  insert into public.cozinha_transferencias_estoque(produto_id,tamanho,quantidade,transferido_por) values(p_produto_id,p_tamanho,p_quantidade,(select auth.uid())) returning id into transferencia;
  for l in select * from public.cozinha_lotes_producao where produto_id=p_produto_id and tamanho=p_tamanho and quantidade_disponivel>0 order by created_at for update loop
    exit when restante=0;
    insert into public.cozinha_transferencia_lotes(transferencia_id,lote_id,quantidade) values(transferencia,l.id,least(restante,l.quantidade_disponivel));
    update public.cozinha_lotes_producao set quantidade_disponivel=quantidade_disponivel-least(restante,l.quantidade_disponivel) where id=l.id;
    restante:=restante-least(restante,l.quantidade_disponivel);
  end loop;
  if restante>0 then raise exception 'Não há lotes disponíveis suficientes para essa transferência'; end if;
  execute format('update public.cozinha_estoque_marmitas set %I=%I-$1,updated_at=now(),updated_by=$2 where produto_id=$3',c,c) using p_quantidade,(select auth.uid()),p_produto_id;
  execute format('update public.produtos set %I=%I+$1 where id=$2',c,c) using p_quantidade,p_produto_id;
end; $$;

revoke all on function public.ajustar_estoque_ingrediente(uuid,numeric,numeric,text) from public,anon;
grant execute on function public.ajustar_estoque_ingrediente(uuid,numeric,numeric,text) to authenticated,service_role;
notify pgrst, 'reload schema';
