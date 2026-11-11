-- Ajuste pontual de refeições prontas na cozinha, sem alterar estoque da loja.
-- Preserva o histórico dos lotes e registra a diferença de cada ajuste.
create table if not exists public.cozinha_ajustes_estoque_marmitas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete restrict,
  tamanho text not null check (tamanho in ('200','300','400')),
  quantidade_anterior integer not null check (quantidade_anterior >= 0),
  quantidade_nova integer not null check (quantidade_nova >= 0),
  observacao text,
  ajustado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists cozinha_ajustes_estoque_marmitas_data_idx
  on public.cozinha_ajustes_estoque_marmitas(created_at desc);
alter table public.cozinha_ajustes_estoque_marmitas enable row level security;
drop policy if exists "cozinha consulta ajustes de marmitas" on public.cozinha_ajustes_estoque_marmitas;
create policy "cozinha consulta ajustes de marmitas"
  on public.cozinha_ajustes_estoque_marmitas for select to authenticated
  using (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  );
revoke all on public.cozinha_ajustes_estoque_marmitas from public, anon, authenticated;
grant select on public.cozinha_ajustes_estoque_marmitas to authenticated;

create or replace function public.ajustar_estoque_marmitas_cozinha(
  p_produto_id uuid,
  p_tamanho text,
  p_quantidade integer,
  p_observacao text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_tipo text;
  v_tamanho text;
  v_coluna text;
  v_atual integer;
  v_diferenca integer;
  v_faltante integer;
  v_retirar integer;
  v_lote record;
  v_ajuste_id uuid;
begin
  if not (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  ) then
    raise exception 'Acesso não autorizado' using errcode = '42501';
  end if;
  if p_quantidade is null or p_quantidade < 0 or p_quantidade > 100000 then
    raise exception 'Informe uma quantidade inteira entre 0 e 100000';
  end if;
  if length(coalesce(p_observacao,'')) > 500 then
    raise exception 'A observação deve ter até 500 caracteres';
  end if;
  select tipo_produto into v_tipo from public.produtos where id = p_produto_id;
  if v_tipo is null or v_tipo not in ('marmita','sopa','complemento') then
    raise exception 'Produto incompatível com estoque da cozinha';
  end if;
  if not (
    (v_tipo = 'marmita' and p_tamanho in ('200','300','400'))
    or (v_tipo = 'sopa' and p_tamanho = '400')
    or (v_tipo = 'complemento' and p_tamanho in ('150','200'))
  ) then
    raise exception 'Tamanho incompatível com este produto';
  end if;
  v_tamanho := case when p_tamanho = '150' then '200' else p_tamanho end;
  v_coluna := 'estoque_' || v_tamanho || 'g';

  -- Ordem de bloqueio igual à importação, evitando ajuste parcial.
  lock table public.cozinha_estoque_marmitas, public.cozinha_lotes_producao
    in share row exclusive mode;
  insert into public.cozinha_estoque_marmitas(produto_id, updated_by)
    values (p_produto_id, (select auth.uid()))
    on conflict (produto_id) do nothing;
  execute format('select %I from public.cozinha_estoque_marmitas where produto_id=$1 for update', v_coluna)
    into v_atual using p_produto_id;
  if v_atual = p_quantidade then return; end if;
  v_diferenca := p_quantidade - v_atual;

  if v_diferenca > 0 then
    -- Entrada manual auditável, sem mexer nos lotes de fabricação existentes.
    insert into public.cozinha_lotes_producao
      (producao_id, produto_id, tamanho, quantidade_inicial,
       quantidade_disponivel, origem, observacao)
    values (null, p_produto_id, v_tamanho, v_diferenca,
            v_diferenca, 'importacao', 'Ajuste manual de estoque da cozinha');
  else
    -- Baixa FIFO em lotes, sem apagar histórico de produção/transferências.
    v_faltante := -v_diferenca;
    for v_lote in
      select id, quantidade_disponivel
      from public.cozinha_lotes_producao
      where produto_id=p_produto_id and tamanho=v_tamanho and quantidade_disponivel>0
      order by created_at, id for update
    loop
      exit when v_faltante = 0;
      v_retirar := least(v_faltante, v_lote.quantidade_disponivel);
      update public.cozinha_lotes_producao
        set quantidade_disponivel = quantidade_disponivel - v_retirar
        where id=v_lote.id;
      v_faltante := v_faltante - v_retirar;
    end loop;
    if v_faltante > 0 then
      raise exception 'Os lotes da cozinha não conferem com o saldo. Nenhuma alteração foi realizada.';
    end if;
  end if;
  execute format('update public.cozinha_estoque_marmitas set %I=$1,updated_at=now(),updated_by=$2 where produto_id=$3', v_coluna)
    using p_quantidade, (select auth.uid()), p_produto_id;
  insert into public.cozinha_ajustes_estoque_marmitas
    (produto_id, tamanho, quantidade_anterior, quantidade_nova, observacao, ajustado_por)
  values (p_produto_id, v_tamanho, v_atual, p_quantidade,
          nullif(btrim(p_observacao), ''), (select auth.uid()));
end;
$$;
revoke all on function public.ajustar_estoque_marmitas_cozinha(uuid,text,integer,text)
  from public, anon, authenticated;
grant execute on function public.ajustar_estoque_marmitas_cozinha(uuid,text,integer,text)
  to authenticated;
notify pgrst, 'reload schema';
