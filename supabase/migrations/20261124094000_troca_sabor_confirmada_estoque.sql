-- Troca de sabor somente depois de confirmação do cliente.
-- Pedido, baixa anterior, nova baixa e auditoria na mesma transação do banco.
create table if not exists public.pedido_trocas_sabor (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  item_anterior_id uuid not null,
  item_resultante_id uuid not null,
  produto_anterior_id uuid not null references public.produtos(id),
  produto_novo_id uuid not null references public.produtos(id),
  produto_anterior_nome text not null,
  produto_novo_nome text not null,
  quantidade integer not null check (quantidade > 0 and quantidade <= 500),
  tamanho text not null,
  confirmado_com_cliente boolean not null default true check (confirmado_com_cliente),
  confirmado_por uuid not null,
  confirmado_em timestamptz not null default now()
);

create index if not exists pedido_trocas_sabor_pedido_idx on public.pedido_trocas_sabor (pedido_id, confirmado_em desc);
alter table public.pedido_trocas_sabor enable row level security;
revoke all on public.pedido_trocas_sabor from anon, authenticated;
grant select on public.pedido_trocas_sabor to authenticated;
create policy pedido_trocas_sabor_admin_select on public.pedido_trocas_sabor
  for select to authenticated
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

create or replace function public.trocar_sabor_pedido_confirmado(
  p_pedido_id uuid,
  p_item_id uuid,
  p_novo_produto_id uuid,
  p_quantidade integer,
  p_confirmado boolean,
  p_ator_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item public.pedido_itens%rowtype;
  v_antigo public.produtos%rowtype;
  v_novo public.produtos%rowtype;
  v_lock record;
  v_tamanho text;
  v_captura text[];
  v_saldo integer;
  v_resultado_id uuid;
begin
  if coalesce((select auth.jwt()->>'role'), '') <> 'service_role' then
    raise exception 'Acesso restrito ao serviço administrativo' using errcode = '42501';
  end if;
  if not coalesce(p_confirmado,false) then
    raise exception 'Confirme com o cliente antes de substituir um sabor';
  end if;
  if p_quantidade is null or p_quantidade < 1 or p_quantidade > 500 then
    raise exception 'Quantidade inválida para a troca';
  end if;
  if p_ator_id is null then
    raise exception 'Administrador responsável não informado';
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if lower(coalesce(v_pedido.status,'')) not in ('pendente','preparando') then
    raise exception 'Trocas só são permitidas antes de separar ou despachar o pedido';
  end if;
  if not coalesce(v_pedido.estoque_baixado,false) then
    raise exception 'A baixa original do pedido ainda não foi concluída. Confira o estoque antes de trocar o sabor';
  end if;

  select * into v_item
  from public.pedido_itens
  where id = p_item_id and pedido_id = p_pedido_id
  for update;
  if not found then raise exception 'O item do pedido não foi encontrado ou já foi alterado'; end if;
  if v_item.produto_id is null then
    raise exception 'Este item não possui produto de estoque para substituir';
  end if;
  if coalesce(v_item.quantidade,0) < p_quantidade then
    raise exception 'A quantidade selecionada ultrapassa a quantidade atual do item';
  end if;
  if v_item.produto_id = p_novo_produto_id then
    raise exception 'Escolha um sabor diferente do atual';
  end if;

  -- Trava os dois produtos em ordem determinística para impedir baixas concorrentes.
  for v_lock in
    select id from public.produtos
    where id in (v_item.produto_id, p_novo_produto_id)
    order by id for update
  loop
    null;
  end loop;
  select * into v_antigo from public.produtos where id = v_item.produto_id;
  select * into v_novo from public.produtos where id = p_novo_produto_id;
  if v_antigo.id is null or v_novo.id is null or not coalesce(v_novo.ativo,false) then
    raise exception 'O sabor selecionado não está disponível no cardápio';
  end if;
  if v_antigo.tipo_produto not in ('marmita','sopa','complemento')
    or v_novo.tipo_produto is distinct from v_antigo.tipo_produto then
    raise exception 'Só é possível trocar por outro sabor da mesma categoria';
  end if;
  if not coalesce(v_antigo.controle_estoque,false)
    or not coalesce(v_novo.controle_estoque,false) then
    raise exception 'A troca requer dois produtos com controle de estoque';
  end if;

  if v_antigo.tipo_produto = 'sopa' then
    v_tamanho := '400g';
  elsif v_antigo.tipo_produto = 'complemento' then
    v_tamanho := '200g';
  else
    v_captura := regexp_match(coalesce(v_item.observacao,''), '(200|300|400)[[:space:]]*g', 'i');
    if v_captura is null then
      raise exception 'Não foi possível identificar o tamanho deste item. Confira a observação antes da troca';
    end if;
    v_tamanho := v_captura[1] || 'g';
  end if;

  v_saldo := case v_tamanho
    when '200g' then coalesce(v_novo.estoque_200g,0)
    when '300g' then coalesce(v_novo.estoque_300g,0)
    else coalesce(v_novo.estoque_400g,0)
  end;
  if v_saldo < p_quantidade then
    raise exception 'Estoque insuficiente para a troca: disponível % unidade(s), solicitado %', v_saldo, p_quantidade;
  end if;

  -- Se uma operação falhar, o Postgres reverte tudo: estoque, itens e histórico.
  update public.produtos set
    estoque_200g = estoque_200g + case when v_tamanho = '200g' then p_quantidade else 0 end,
    estoque_300g = estoque_300g + case when v_tamanho = '300g' then p_quantidade else 0 end,
    estoque_400g = estoque_400g + case when v_tamanho = '400g' then p_quantidade else 0 end
  where id = v_antigo.id;

  update public.produtos set
    estoque_200g = estoque_200g - case when v_tamanho = '200g' then p_quantidade else 0 end,
    estoque_300g = estoque_300g - case when v_tamanho = '300g' then p_quantidade else 0 end,
    estoque_400g = estoque_400g - case when v_tamanho = '400g' then p_quantidade else 0 end
  where id = v_novo.id;

  if v_item.quantidade = p_quantidade then
    update public.pedido_itens set produto_id = v_novo.id, nome_item = null
    where id = v_item.id returning id into v_resultado_id;
  else
    update public.pedido_itens
      set quantidade = quantidade - p_quantidade
      where id = v_item.id;
    insert into public.pedido_itens (
      pedido_id, produto_id, nome_item, quantidade, preco_unitario, observacao
    ) values (
      p_pedido_id, v_novo.id, null, p_quantidade, v_item.preco_unitario, v_item.observacao
    ) returning id into v_resultado_id;
  end if;

  insert into public.pedido_trocas_sabor (
    pedido_id, item_anterior_id, item_resultante_id,
    produto_anterior_id, produto_novo_id, produto_anterior_nome, produto_novo_nome, quantidade, tamanho,
    confirmado_com_cliente, confirmado_por
  ) values (
    p_pedido_id, v_item.id, v_resultado_id,
    v_antigo.id, v_novo.id, v_antigo.nome, v_novo.nome, p_quantidade,
    case when v_antigo.tipo_produto = 'complemento' then '150g' else v_tamanho end,
    true, p_ator_id
  );
  update public.pedidos set updated_at = now() where id = p_pedido_id;

  return jsonb_build_object(
    'pedido_id', p_pedido_id, 'item_id', v_resultado_id,
    'sabor_anterior', v_antigo.nome, 'sabor_novo', v_novo.nome,
    'quantidade', p_quantidade, 'tamanho',
    case when v_antigo.tipo_produto = 'complemento' then '150g' else v_tamanho end,
    'preco_preservado', true, 'estoque_ajustado', true
  );
end;
$$;

revoke all on function public.trocar_sabor_pedido_confirmado(uuid,uuid,uuid,integer,boolean,uuid)
  from public, anon, authenticated;
grant execute on function public.trocar_sabor_pedido_confirmado(uuid,uuid,uuid,integer,boolean,uuid)
  to service_role;
