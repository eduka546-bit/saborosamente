-- 30/09/2026
-- Revisão final de panquecas e lasanhas para a produção de 30/09 e 01/10.
-- Frango e carne usam a mesma estrutura; muda somente o molho.

update public.cozinha_preparacoes
set rendimento_final_g = 2844,
    observacao = 'Massa compartilhada entre TD21 e TD22. Referência medida: 8 ovos = aproximadamente 30 panquecas. Receita proporcional à base antiga: 8 ovos, 2 L de leite, 800 g de farinha, 32 g de óleo e 15 g de sal.'
where id='c8a64eec-81aa-4a6e-8056-ee86cec72541';

update public.cozinha_preparacao_itens set quantidade=8, quantidade_texto='8 ovos — referência medida para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ordem=0;
update public.cozinha_preparacao_itens set quantidade=2000, quantidade_texto='2 L de leite para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ordem=1;
update public.cozinha_preparacao_itens set quantidade=800, quantidade_texto='800 g de farinha de trigo para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ordem=2;
update public.cozinha_preparacao_itens set quantidade=32, quantidade_texto='32 g de óleo para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ordem=3;
update public.cozinha_preparacao_itens set quantidade=15, quantidade_texto='15 g de sal para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ordem=4;

update public.cozinha_receita_itens ri
set gramas_200=case i.nome when 'Farinha de trigo' then 26.666667 when 'Ovo' then 0.266667 when 'Leite' then 66.666667 when 'Sal' then 0.5 when 'Óleo de soja' then 1.066667 else ri.gramas_200 end,
    gramas_300=case i.nome when 'Farinha de trigo' then 53.333333 when 'Ovo' then 0.533333 when 'Leite' then 133.333333 when 'Sal' then 1 when 'Óleo de soja' then 2.133333 else ri.gramas_300 end,
    gramas_400=case i.nome when 'Farinha de trigo' then 80 when 'Ovo' then 0.8 when 'Leite' then 200 when 'Sal' then 1.5 when 'Óleo de soja' then 3.2 else ri.gramas_400 end
from public.cozinha_ingredientes i, public.cozinha_receitas r, public.produtos p
where ri.ingrediente_id=i.id and ri.receita_id=r.id and r.produto_id=p.id
  and (p.nome ilike 'TD21 - %' or p.nome ilike 'TD22 - %')
  and i.nome in ('Farinha de trigo','Ovo','Leite','Sal','Óleo de soja');

update public.cozinha_receita_montagem_itens m
set gramas_200=case when m.nome ilike '%panqueca%' then 150 when m.nome ilike '%molho frango%' then 45 when m.nome ilike '%salsinha%' then 0 when m.nome ilike '%mussarela%' or m.nome ilike '%muçarela%' then 5 else m.gramas_200 end,
    gramas_300=case when m.nome ilike '%panqueca%' then 230 when m.nome ilike '%molho frango%' then 60 when m.nome ilike '%salsinha%' then 0 when m.nome ilike '%mussarela%' or m.nome ilike '%muçarela%' then 10 else m.gramas_300 end,
    gramas_400=case when m.nome ilike '%panqueca%' then 300 when m.nome ilike '%molho frango%' then 85 when m.nome ilike '%salsinha%' then 0 when m.nome ilike '%mussarela%' or m.nome ilike '%muçarela%' then 15 else m.gramas_400 end
from public.cozinha_receitas r, public.produtos p
where m.receita_id=r.id and r.produto_id=p.id and p.nome ilike 'TD21 - %';

update public.cozinha_receita_montagem_itens m
set gramas_200=case when m.nome ilike '%molho frango%' then 65 when m.nome ilike '%molho branco%' then 65 when m.nome ilike '%massa de lasanha%' then 60 else m.gramas_200 end,
    gramas_300=case when m.nome ilike '%molho frango%' then 95 when m.nome ilike '%molho branco%' then 95 when m.nome ilike '%massa de lasanha%' then 95 else m.gramas_300 end,
    gramas_400=case when m.nome ilike '%molho frango%' then 125 when m.nome ilike '%molho branco%' then 125 when m.nome ilike '%massa de lasanha%' then 130 else m.gramas_400 end,
    observacao=case when m.nome ilike '%massa de lasanha%' then '2 camadas' else m.observacao end
from public.cozinha_receitas r, public.produtos p
where m.receita_id=r.id and r.produto_id=p.id and p.nome ilike 'TD19 - %';

insert into public.cozinha_receita_montagem_itens
(receita_id,nome,gramas_200,gramas_300,gramas_400,observacao,ordem)
select r.id,'Mussarela',10,15,20,null,3
from public.cozinha_receitas r join public.produtos p on p.id=r.produto_id
where p.nome ilike 'TD19 - %'
and not exists (
  select 1 from public.cozinha_receita_montagem_itens m
  where m.receita_id=r.id and (m.nome ilike '%mussarela%' or m.nome ilike '%muçarela%')
);

update public.cozinha_receitas r
set ingredientes='[]'::jsonb, updated_at=now()
from public.produtos p
where r.produto_id=p.id and (p.nome ilike 'TD19 - %' or p.nome ilike 'TD21 - %');

update public.cozinha_preparacoes
set rendimento_final_g=1000,
    observacao='Massa de lasanha pré-cozida. Não ferver e não cozinhar separadamente. Enquanto não houver pesagem física validada, considerar 1 kg utilizado = 1 kg consumido; não aplicar ganho 1,3x.'
where id='6d9145eb-fabc-4550-9dea-f3383ad5afeb';
