
create or replace function public.criar_pedido_whatsapp_admin(
  p_order jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_role text := coalesce((select auth.jwt()->>'role'),'');
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_group record;
  v_product record;
  v_subtotal numeric := 0;
  v_taxa numeric := greatest(0, coalesce((p_order->>'taxa_entrega')::numeric, 0));
  v_total numeric := 0;
  v_desconto numeric := coalesce((p_order->>'desconto_aplicado')::numeric, 0);
  v_cashback numeric := coalesce((p_order->>'cashback_usado')::numeric, 0);
  v_tem_estoque boolean := false;
  v_user_id uuid := nullif(p_order->>'user_id','')::uuid;
begin
  if v_role <> 'service_role' then
    raise exception 'Acesso não autorizado' using errcode='42501';
  end if;

  if p_order is null or jsonb_typeof(p_order) <> 'object' then
    raise exception 'Pedido inválido' using errcode='22023';
  end if;

  if nullif(btrim(p_order->>'nome_cliente'),'') is null then
    raise exception 'Nome do cliente é obrigatório' using errcode='22023';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 100 then
    raise exception 'Itens inválidos' using errcode='22023';
  end if;

  if coalesce(p_order->>'metodo_entrega','') not in ('entrega','retirada') then
    raise exception 'Método de entrega inválido' using errcode='22023';
  end if;

  if coalesce(p_order->>'metodo_entrega','') = 'entrega'
     and (
       nullif(btrim(p_order->>'endereco_rua'),'') is null
       or nullif(btrim(p_order->>'endereco_bairro'),'') is null
       or nullif(btrim(p_order->>'endereco_cidade'),'') is null
     ) then
    raise exception 'Endereço, bairro e cidade são obrigatórios para entrega' using errcode='22023';
  end if;

  -- Valida preços e calcula subtotal no servidor.
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if nullif(v_item->>'produto_id','') is null then
      raise exception 'Produto inválido' using errcode='22023';
    end if;
    if coalesce((v_item->>'quantidade')::integer,0) <= 0
       or coalesce((v_item->>'quantidade')::integer,0) > 200 then
      raise exception 'Quantidade inválida' using errcode='22023';
    end if;
    if coalesce((v_item->>'preco_unitario')::numeric,-1) < 0
       or coalesce((v_item->>'preco_unitario')::numeric,0) > 10000 then
      raise exception 'Preço inválido' using errcode='22023';
    end if;
    if coalesce(v_item->>'tamanho','300g') not in ('200g','300g','400g') then
      raise exception 'Tamanho inválido' using errcode='22023';
    end if;

    select id,nome,tipo_produto,controle_estoque,ativo,
           estoque_200g,estoque_300g,estoque_400g
    into v_product
    from public.produtos
    where id=(v_item->>'produto_id')::uuid;

    if not found or coalesce(v_product.ativo,false)=false then
      raise exception 'Produto indisponível';
    end if;

    v_subtotal := v_subtotal
      + ((v_item->>'quantidade')::integer * (v_item->>'preco_unitario')::numeric);
  end loop;

  -- EXCLUSIVO DO ADMIN: permite vendas mesmo sem saldo.
  -- Saldo negativo serve de pendência para acerto posterior da produção.
  -- Mantém bloqueio de produtos inexistentes e validações de quantidade,
  -- e não altera o checkout público nem suas regras de estoque.
  for v_group in
    select (x->>'produto_id')::uuid as produto_id,
           coalesce(x->>'tamanho','300g') as tamanho,
           sum((x->>'quantidade')::integer)::integer as quantidade
    from jsonb_array_elements(p_items) x
    group by 1,2
  loop
    select id,nome,tipo_produto,controle_estoque
    into v_product
    from public.produtos
    where id=v_group.produto_id
    for update;
    if not found then raise exception 'Produto não encontrado'; end if;
    if coalesce(v_product.controle_estoque,false)
       and coalesce(v_product.tipo_produto,'marmita') <> 'combo' then
      v_tem_estoque := true;
    end if;
  end loop;

  v_subtotal := round(v_subtotal,2);
  v_desconto := round(v_desconto,2);
  v_cashback := round(v_cashback,2);
  if v_desconto < 0 or v_cashback < 0 or (v_desconto + v_cashback) > v_subtotal + v_taxa then
    raise exception 'Desconto ou cashback inválido' using errcode='22023';
  end if;
  -- Recibos externos já apresentam cashback como pagamento efetuado:
  -- registra o montante no pedido SEM debitar a carteira digital de novo.
  v_total := round(v_subtotal + v_taxa - v_desconto - v_cashback,2);

  insert into public.pedidos(
    id,user_id,nome_cliente,telefone_cliente,email_cliente,
    metodo_entrega,horario_recebimento,metodo_pagamento,observacao,
    valor_total,taxa_entrega,desconto_aplicado,cashback_usado,desconto_indicacao,
    cupom_codigo,troco,tipo_cartao,status,
    endereco_cidade,endereco_bairro,endereco_rua,endereco_numero,
    endereco_complemento,endereco_cep,
    origem,estoque_baixado
  )
  values(
    v_order_id,v_user_id,
    left(btrim(p_order->>'nome_cliente'),120),
    nullif(left(btrim(coalesce(p_order->>'telefone_cliente','')),30),''),
    nullif(left(lower(btrim(coalesce(p_order->>'email_cliente',''))),160),''),
    p_order->>'metodo_entrega',
    nullif(left(btrim(coalesce(p_order->>'horario_recebimento','')),120),''),
    nullif(left(btrim(coalesce(p_order->>'metodo_pagamento','')),80),''),
    left(coalesce(p_order->>'observacao',''),500),
    v_total,v_taxa,v_desconto,v_cashback,0,null,null,
    nullif(left(btrim(coalesce(p_order->>'tipo_cartao','')),80),''),
    'pendente',
    nullif(left(btrim(coalesce(p_order->>'endereco_cidade','')),100),''),
    nullif(left(btrim(coalesce(p_order->>'endereco_bairro','')),120),''),
    nullif(left(btrim(coalesce(p_order->>'endereco_rua','')),180),''),
    nullif(left(btrim(coalesce(p_order->>'endereco_numero','')),30),''),
    nullif(left(btrim(coalesce(p_order->>'endereco_complemento','')),120),''),
    nullif(left(btrim(coalesce(p_order->>'endereco_cep','')),20),''),
    'whatsapp',v_tem_estoque
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.pedido_itens(
      pedido_id,produto_id,nome_item,quantidade,preco_unitario,observacao
    )
    values(
      v_order_id,
      (v_item->>'produto_id')::uuid,
      null,
      (v_item->>'quantidade')::integer,
      round((v_item->>'preco_unitario')::numeric,2),
      concat_ws(' | ',
        case when (select tipo_produto from public.produtos where id=(v_item->>'produto_id')::uuid) = 'complemento'
          then 'Peso: 150g'
          else 'Peso: ' || coalesce(v_item->>'tamanho','300g') end,
        'Pedido lançado manualmente pelo WhatsApp',
        nullif(btrim(coalesce(v_item->>'observacao','')),'')
      )
    );
  end loop;

  -- Baixa de estoque somente depois de o pedido e os itens terem sido gravados.
  for v_group in
    select
      (x->>'produto_id')::uuid as produto_id,
      coalesce(x->>'tamanho','300g') as tamanho,
      sum((x->>'quantidade')::integer)::integer as quantidade
    from jsonb_array_elements(p_items) x
    group by 1,2
  loop
    select id,tipo_produto,controle_estoque
    into v_product
    from public.produtos
    where id=v_group.produto_id;

    if coalesce(v_product.controle_estoque,false)
       and coalesce(v_product.tipo_produto,'marmita') <> 'combo' then
      if v_product.tipo_produto='sopa' then
        update public.produtos
        set estoque_400g=coalesce(estoque_400g,0)-v_group.quantidade
        where id=v_product.id;
      elsif v_product.tipo_produto in ('complemento','bebida') then
        update public.produtos
        set estoque_200g=coalesce(estoque_200g,0)-v_group.quantidade
        where id=v_product.id;
      elsif v_group.tamanho='200g' then
        update public.produtos
        set estoque_200g=coalesce(estoque_200g,0)-v_group.quantidade
        where id=v_product.id;
      elsif v_group.tamanho='400g' then
        update public.produtos
        set estoque_400g=coalesce(estoque_400g,0)-v_group.quantidade
        where id=v_product.id;
      else
        update public.produtos
        set estoque_300g=coalesce(estoque_300g,0)-v_group.quantidade
        where id=v_product.id;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'id',v_order_id,
    'subtotal',v_subtotal,
    'taxa_entrega',v_taxa,
    'cashback_usado',v_cashback,
    'valor_total',v_total,
    'status','pendente',
    'origem','whatsapp'
  );
end
$function$;

revoke all on function public.criar_pedido_whatsapp_admin(jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.criar_pedido_whatsapp_admin(jsonb,jsonb)
  to service_role;
