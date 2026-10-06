-- Regras previamente aprovadas. Não altera a composição culinária das sopas.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
declare v record;
begin
  for v in select * from (values
    ('Arroz Branco Parboilizado','ganho',2.9::numeric,0::numeric),
    ('Feijão Preto','ganho',3.0,0),
    ('Batata inglesa','perda',1,20),
    ('Calabresa','perda',1,10),
    ('Carne bovina em cubos pequenos','perda',1,30),
    ('Carne desfiada','perda',1,30),
    ('Carne moída','perda',1,30),
    ('Couve manteiga','perda',1,50),
    ('Tilápia em tiras','perda',1,30)
  ) x(nome,tipo,fator,perda)
  loop
    update public.cozinha_ingredientes
    set tipo_rendimento=v.tipo, fator_rendimento=v.fator,
        quebra_percentual=v.perda
    where nome=v.nome;
    if not found then raise exception 'Ingrediente ausente: %',v.nome; end if;
  end loop;

  -- As quantidades internas são insumos de entrada. O ganho de arroz,
  -- feijão e massa absorve a água da própria sopa; somá-lo à água integral
  -- duplicaria água no peso final. A estimativa desconta somente perdas.
  -- Ingredientes já refogados/desfiados sem perda permanecem prontos.
  update public.cozinha_preparacoes cp
  set rendimento_final_g=x.peso,
      observacao=coalesce(cp.observacao,'') ||
      ' Rendimento teórico revisado: água de cocção contada uma vez, sem duplicar absorção de grãos/massa. Pesar o lote final para ajustar evaporação.',
      updated_at=now()
  from (
    select pi.preparacao_id,
      round(sum(case
        when ci.unidade_medida='L' then pi.quantidade*1000
        when ci.unidade_medida='un' then 0
        when ci.tipo_rendimento='perda' then pi.quantidade*(1-ci.quebra_percentual/100)
        else pi.quantidade end),2) peso
    from public.cozinha_preparacao_itens pi
    join public.cozinha_ingredientes ci on ci.id=pi.ingrediente_id
    where pi.preparacao_id in (
      select ri.preparacao_id from public.cozinha_receita_itens ri
      join public.cozinha_receitas r on r.id=ri.receita_id
      join public.produtos p on p.id=r.produto_id
      where p.nome ~ '^SO(0[1-9]|1[0-2])'
    )
    group by pi.preparacao_id
  ) x
  where cp.id=x.preparacao_id;
end $$;
