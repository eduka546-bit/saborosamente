-- Corrige a montagem em camadas das lasanhas e deixa o bolonhesa mais molhado.
alter table public.cozinha_preparacao_itens disable trigger user;
alter table public.cozinha_receita_itens disable trigger user;

with bolonhesa as (
  select id from public.cozinha_preparacoes where nome = 'Molho Bolonhesa'
), sugo_item as (
  select pi.id from public.cozinha_preparacao_itens pi
  join bolonhesa b on b.id = pi.preparacao_id
  join public.cozinha_preparacoes pc on pc.id = pi.preparacao_componente_id
  where pc.nome = 'Molho sugo'
)
update public.cozinha_preparacao_itens pi
set quantidade = 636, quantidade_texto = '636 g de Molho sugo pronto (+20%)'
from sugo_item si where pi.id = si.id;

update public.cozinha_preparacoes
set rendimento_final_g = 1483,
    observacao = coalesce(nullif(observacao, '') || E'\n', '') || 'Molho sugo aumentado em 20% para deixar as preparações com carne moída bolonhesa mais molhadas.',
    updated_at = now()
where nome = 'Molho Bolonhesa';

with receitas as (
  select r.id, p.nome from public.cozinha_receitas r join public.produtos p on p.id = r.produto_id
  where p.nome in ('TD19 - Lasanha de Frango', 'TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa')
), dados as (
  select 'TD19 - Lasanha de Frango'::text produto, 'Molho frango desfiado'::text preparacao, 120::numeric g200,165::numeric g300,225::numeric g400 union all
  select 'TD19 - Lasanha de Frango','Molho branco',50,70,95 union all
  select 'TD19 - Lasanha de Frango','Massa de lasanha',30,50,60 union all
  select 'TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Molho Bolonhesa',120,165,225 union all
  select 'TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Molho branco',50,70,95 union all
  select 'TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Massa de lasanha',30,50,60
)
update public.cozinha_receita_itens ri
set gramas_200 = d.g200, gramas_300 = d.g300, gramas_400 = d.g400,
    observacao = case when d.produto = 'TD19 - Lasanha de Frango' then 'Total da montagem em camadas da lasanha de frango.' else 'Total da montagem em camadas da lasanha de carne.' end
from receitas r join dados d on d.produto = r.nome join public.cozinha_preparacoes pr on pr.nome = d.preparacao
where ri.receita_id = r.id and ri.preparacao_id = pr.id;

with receitas as (
  select r.id from public.cozinha_receitas r join public.produtos p on p.id = r.produto_id
  where p.nome in ('TD19 - Lasanha de Frango', 'TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa')
)
delete from public.cozinha_receita_montagem_itens mi using receitas r where mi.receita_id = r.id;

with receitas as (
  select r.id,p.nome from public.cozinha_receitas r join public.produtos p on p.id = r.produto_id
  where p.nome in ('TD19 - Lasanha de Frango', 'TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa')
), m(produto,nome,g200,g300,g400,observacao,ordem) as (
  values
  ('TD19 - Lasanha de Frango','Molho de frango desfiado',40::numeric,55::numeric,75::numeric,'1ª camada de molho',1),
  ('TD19 - Lasanha de Frango','Massa de lasanha',15,25,30,'1ª folha de massa; 2 folhas por unidade, próprias de cada tamanho',2),
  ('TD19 - Lasanha de Frango','Molho de frango desfiado',40,55,75,'2ª camada de molho',3),
  ('TD19 - Lasanha de Frango','Massa de lasanha',15,25,30,'2ª folha de massa; 2 folhas por unidade, próprias de cada tamanho',4),
  ('TD19 - Lasanha de Frango','Molho de frango desfiado',40,55,75,'3ª camada de molho',5),
  ('TD19 - Lasanha de Frango','Molho branco',50,70,95,'Cobertura',6),
  ('TD19 - Lasanha de Frango','Muçarela ralada',10,15,20,'Finalização',7),
  ('TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Carne moída bolonhesa',40,55,75,'1ª camada de molho',1),
  ('TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Massa de lasanha',15,25,30,'1ª folha de massa; 2 folhas por unidade, próprias de cada tamanho',2),
  ('TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Carne moída bolonhesa',40,55,75,'2ª camada de molho',3),
  ('TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Massa de lasanha',15,25,30,'2ª folha de massa; 2 folhas por unidade, próprias de cada tamanho',4),
  ('TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Carne moída bolonhesa',40,55,75,'3ª camada de molho',5),
  ('TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Molho branco',50,70,95,'Cobertura',6),
  ('TD20 - Lasanha de Carne Moída de Patinho à Bolonhesa','Muçarela ralada',10,15,20,'Finalização',7)
)
insert into public.cozinha_receita_montagem_itens (receita_id,nome,gramas_200,gramas_300,gramas_400,observacao,ordem)
select r.id,m.nome,m.g200,m.g300,m.g400,m.observacao,m.ordem from receitas r join m on m.produto = r.nome;

alter table public.cozinha_receita_itens enable trigger user;
alter table public.cozinha_preparacao_itens enable trigger user;
