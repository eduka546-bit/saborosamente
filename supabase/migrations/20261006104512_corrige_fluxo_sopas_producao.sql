-- Corrige a origem da produção das sopas.
-- Cada sopa deve ter uma única cadeia: montagem (400 g) -> preparação pronta
-- -> ingredientes da preparação. Linhas diretas antigas faziam o planejamento
-- ignorar ou somar novamente ingredientes que já pertenciam à preparação.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
declare
  v record;
begin
  for v in
    select
      r.id as receita_id,
      ri.preparacao_id,
      cp.nome as preparacao_nome
    from public.cozinha_receitas r
    join public.produtos p on p.id = r.produto_id
    join lateral (
      select x.preparacao_id
      from public.cozinha_receita_itens x
      where x.receita_id = r.id
        and x.preparacao_id is not null
      order by x.ordem, x.id
      limit 1
    ) ri on true
    join public.cozinha_preparacoes cp on cp.id = ri.preparacao_id
    where p.nome ~ '^SO(0[1-9]|1[0-2])'
  loop
    -- A montagem é a fonte de verdade: uma unidade de sopa sempre é 400 g
    -- da própria preparação pronta.
    delete from public.cozinha_receita_montagem_itens
    where receita_id = v.receita_id;

    insert into public.cozinha_receita_montagem_itens
      (receita_id, nome, gramas_150, gramas_200, gramas_300, gramas_400, observacao, ordem)
    values
      (v.receita_id, v.preparacao_nome, 0, 0, 0, 400,
       '400 g de sopa pronta por pote.', 0);

    -- Não pode haver ingrediente direto: todos já são expandidos a partir do
    -- preparo pronto, com perda/ganho aplicado uma única vez.
    delete from public.cozinha_receita_itens
    where receita_id = v.receita_id;

    insert into public.cozinha_receita_itens
      (receita_id, preparacao_id, gramas_personalizada, gramas_200, gramas_300,
       gramas_400, rendimento_quebra, observacao, ordem, operacao_producao, fator_producao)
    values
      (v.receita_id, v.preparacao_id, 0, 0, 0, 400, 1,
       '400 g de sopa pronta por pote.', 0, 'direto', 1);

    update public.cozinha_receitas
       set ingredientes = '[]'::jsonb,
           preparacoes = jsonb_build_array(
             jsonb_build_object('id', v.preparacao_id, 'nome', v.preparacao_nome)
           ),
           modo_preparo = null,
           rendimento_observacao =
             'Sopa de 400 g: a montagem usa 400 g da preparação pronta; a receita-base escala proporcionalmente no planejamento.',
           updated_at = now()
     where id = v.receita_id;
  end loop;

  if (select count(*)
      from public.cozinha_receitas r
      join public.produtos p on p.id = r.produto_id
      where p.nome ~ '^SO(0[1-9]|1[0-2])') <> 12 then
    raise exception 'Esperadas 12 receitas de sopa para a revisão';
  end if;

  if exists (
    select 1
    from public.cozinha_receitas r
    join public.produtos p on p.id = r.produto_id
    left join public.cozinha_receita_itens ri on ri.receita_id = r.id
    where p.nome ~ '^SO(0[1-9]|1[0-2])'
    group by r.id
    having count(ri.id) <> 1
       or count(ri.ingrediente_id) <> 0
       or count(ri.preparacao_id) <> 1
  ) then
    raise exception 'Cada sopa deve ficar com exatamente uma preparação e nenhum ingrediente direto';
  end if;
end $$;
