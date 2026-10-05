
create or replace function public.cupons_disponiveis_checkout()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tem_pedido boolean := false;
  v_result jsonb;
begin
  if v_user_id is not null then
    select exists(
      select 1
      from public.pedidos p
      where p.user_id = v_user_id
        and lower(coalesce(p.status,'')) <> 'cancelado'
    )
    into v_tem_pedido;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'codigo', x.codigo,
        'tipo', x.tipo,
        'valor', x.valor,
        'regra', x.regra,
        'validade', x.validade,
        'apenas_primeira_compra', x.apenas_primeira_compra,
        'substitui_desconto_progressivo', x.substitui_desconto_progressivo,
        'excluir_combo_pronto', x.excluir_combo_pronto,
        'personalizado', x.personalizado,
        'origem', case when x.personalizado then 'recuperacao' else 'campanha' end
      )
      order by x.personalizado desc, x.validade asc nulls last, x.valor desc, x.codigo
    ),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      c.codigo,
      c.tipo,
      c.valor,
      c.regra,
      c.validade,
      c.apenas_primeira_compra,
      c.substitui_desconto_progressivo,
      c.excluir_combo_pronto,
      exists(
        select 1
        from public.carrinhos_abandonados ca_owner
        where ca_owner.cupom_oferta = c.codigo
          and v_user_id is not null
          and ca_owner.user_id = v_user_id
      ) as personalizado
    from public.cupons c
    where c.ativo = true
      and (c.validade is null or c.validade >= current_date)
      and (c.max_uso is null or coalesce(c.uso,0) < c.max_uso)
      and (
        -- Cupom de recuperação: somente o dono do carrinho pode vê-lo.
        exists(
          select 1
          from public.carrinhos_abandonados ca_owner
          where ca_owner.cupom_oferta = c.codigo
            and v_user_id is not null
            and ca_owner.user_id = v_user_id
        )
        or
        -- Cupom comum de campanha: pode ser exibido no checkout.
        not exists(
          select 1
          from public.carrinhos_abandonados ca_any
          where ca_any.cupom_oferta = c.codigo
        )
      )
      and (
        coalesce(c.apenas_primeira_compra,false) = false
        or v_user_id is null
        or v_tem_pedido = false
      )
  ) x;

  return v_result;
end
$function$;

revoke all on function public.cupons_disponiveis_checkout() from public;
grant execute on function public.cupons_disponiveis_checkout() to anon, authenticated, service_role;
