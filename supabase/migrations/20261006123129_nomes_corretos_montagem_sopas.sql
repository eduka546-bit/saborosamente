-- Cada sopa pronta é identificada pelo nome do próprio produto, sem o código.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare v record;
begin
  for v in
    select r.id receita_id, ri.preparacao_id,
      regexp_replace(p.nome,'^SO[0-9]{2}\s*[-–—:]?\s*','') nome
    from public.produtos p
    join public.cozinha_receitas r on r.produto_id=p.id
    join public.cozinha_receita_itens ri on ri.receita_id=r.id
    where p.nome ~ '^SO(0[1-9]|1[0-2])' and ri.preparacao_id is not null
  loop
    update public.cozinha_receita_montagem_itens set nome=v.nome
    where receita_id=v.receita_id;
    update public.cozinha_preparacoes set nome=v.nome,updated_at=now()
    where id=v.preparacao_id;
    update public.cozinha_receitas
    set preparacoes=jsonb_build_array(jsonb_build_object('id',v.preparacao_id,'nome',v.nome)),updated_at=now()
    where id=v.receita_id;
  end loop;
end $$;
