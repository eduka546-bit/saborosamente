-- SO01 usa peito em cubos. SO06 mantém o peito desfiado.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare v_cubos uuid; v_prep uuid;
begin
  select id into v_cubos from public.cozinha_ingredientes
  where lower(nome)=lower('Peito de frango em cubos') limit 1;
  if v_cubos is null then
    insert into public.cozinha_ingredientes
      (nome,unidade_medida,custo_por_kg,tipo_rendimento,quebra_percentual,fator_rendimento,observacao)
    select 'Peito de frango em cubos','g',custo_por_kg,'perda',20,1,
      'Peito cru cortado em cubos. Perda padrão de frango: 20%. Custo de referência do cadastro existente de peito.'
    from public.cozinha_ingredientes where nome='Peito de frango desfiado'
    returning id into v_cubos;
  end if;
  if v_cubos is null then raise exception 'Cadastro de peito não encontrado'; end if;
  select ri.preparacao_id into v_prep
  from public.cozinha_receita_itens ri
  join public.cozinha_receitas r on r.id=ri.receita_id
  join public.produtos p on p.id=r.produto_id
  where p.nome like 'SO01 %';
  if v_prep is null then raise exception 'Preparação SO01 ausente'; end if;

  -- Preserva os 2 kg prontos da base: 2,5 kg crus após perda de 20%.
  update public.cozinha_preparacao_itens pi
  set ingrediente_id=v_cubos,quantidade=pi.quantidade/0.8,
      quantidade_texto='2,5 kg de peito de frango cru em cubos (aproximadamente 2 kg após cocção)'
  from public.cozinha_ingredientes ci
  where pi.preparacao_id=v_prep and ci.id=pi.ingrediente_id
    and ci.nome='Peito de frango desfiado';
  update public.cozinha_preparacoes
  set modo_preparo='Refogue cebola e alho no óleo. Acrescente o peito de frango cortado em cubos e sele. Adicione os legumes e 4 L de água. Cozinhe tampado até o frango ficar completamente cozido e os legumes ficarem macios. Finalize com salsinha, ajuste o sal e pese o lote pronto.',
      updated_at=now()
  where id=v_prep;
  update public.produtos set ingredientes=replace(ingredientes,'Peito de frango desfiado','Peito de frango em cubos')
  where nome like 'SO01 %';
end $$;
