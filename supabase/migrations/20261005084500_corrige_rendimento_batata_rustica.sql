select set_config('request.jwt.claims', '{"role":"service_role"}', true);

-- Batata rústica: 1 kg de batata inglesa crua (com casca) -> 600 g pronta.
-- Perda operacional total de 40%, contemplando descascamento, cocção e fritura por imersão.

update public.cozinha_preparacoes
set
  rendimento_final_g = 600,
  modo_preparo = 'Descascar a batata inglesa.\nCortar uma batata média em 4 pedaços.\nCozinhar em água com sal até ficar al dente.\nEscorrer bem.\nFritar por imersão a 180 °C até dourar.\nEscorrer o excesso de óleo e conferir o peso pronto.',
  observacao = 'Rendimento operacional: 1 kg de batata inglesa crua, antes de descascar, rende aproximadamente 600 g de batata rústica pronta (40% de perda total entre descascamento, cocção e fritura).',
  updated_at = now()
where lower(nome)=lower('Batata rústica');

update public.cozinha_receita_itens cri
set
  gramas_200 = 50,
  gramas_300 = 75,
  gramas_400 = 100,
  observacao = concat_ws(' · ', nullif(cri.observacao,''), 'Batata rústica: rendimento 60% (40% de perda total)')
where cri.ingrediente_id = (
    select id from public.cozinha_ingredientes
    where lower(nome)=lower('Batata inglesa')
    limit 1
  )
  and cri.receita_id in (
    select r.id
    from public.cozinha_receitas r
    join public.produtos p on p.id=r.produto_id
    where p.nome ilike 'TD08 %'
       or p.nome ilike 'TD09 %'
  );
