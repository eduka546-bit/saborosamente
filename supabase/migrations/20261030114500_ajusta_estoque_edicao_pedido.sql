-- Reconciliacao de saldo quando a equipe altera itens de um pedido ja criado.
-- Quantidade positiva significa consumo adicional; negativa, devolucao ao saldo.
create or replace function public.ajustar_estoque_edicao_pedido(
  p_stock_ops jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text := coalesce((select auth.jwt()->>'role'), '');
  v_stock jsonb;
  v_product record;
  v_qtd integer;
  v_tamanho text;
begin
  if v_role <> 'service_role' then
    raise exception 'Acesso não autorizado' using errcode = '42501';
  end if;

  for v_stock in select value from jsonb_array_elements(coalesce(p_stock_ops, '[]'::jsonb))
  loop
    v_qtd := coalesce((v_stock->>'quantity')::integer, 0);
    v_tamanho := coalesce(v_stock->>'weight', '300g');
    if v_qtd = 0 then
      continue;
    end if;

    select id, tipo_produto, controle_estoque
      into v_product
      from public.produtos
      where id = (v_stock->>'productId')::uuid
      for update;

    if not found or not coalesce(v_product.controle_estoque, false)
      or coalesce(v_product.tipo_produto, 'marmita') = 'combo' then
      continue;
    end if;

    if v_product.tipo_produto = 'sopa' then
      update public.produtos set estoque_400g = coalesce(estoque_400g, 0) - v_qtd where id = v_product.id;
    elsif v_product.tipo_produto in ('complemento', 'bebida') then
      update public.produtos set estoque_200g = coalesce(estoque_200g, 0) - v_qtd where id = v_product.id;
    elsif v_tamanho = '200g' then
      update public.produtos set estoque_200g = coalesce(estoque_200g, 0) - v_qtd where id = v_product.id;
    elsif v_tamanho = '400g' then
      update public.produtos set estoque_400g = coalesce(estoque_400g, 0) - v_qtd where id = v_product.id;
    else
      update public.produtos set estoque_300g = coalesce(estoque_300g, 0) - v_qtd where id = v_product.id;
    end if;
  end loop;
end;
$$;

revoke execute on function public.ajustar_estoque_edicao_pedido(jsonb) from public, anon, authenticated;
grant execute on function public.ajustar_estoque_edicao_pedido(jsonb) to service_role;
