-- Reafirma a montagem da TD19 e vincula as três camadas ao preparo correto.
alter table public.cozinha_receita_montagem_itens disable trigger user;
alter table public.cozinha_receita_itens disable trigger user;
alter table public.cozinha_receitas disable trigger user;

with lasanha as (
  select r.id
  from public.cozinha_receitas r
  join public.produtos p on p.id = r.produto_id
  where p.nome = 'TD19 - Lasanha de Frango'
)
update public.cozinha_receita_montagem_itens mi
set nome = case mi.ordem
  when 1 then 'Molho de frango desfiado'
  when 2 then 'Massa de lasanha'
  when 3 then 'Molho de frango desfiado'
  when 4 then 'Massa de lasanha'
  when 5 then 'Molho de frango desfiado'
  when 6 then 'Molho branco'
  when 7 then 'Muçarela ralada'
end
from lasanha l
where mi.receita_id = l.id
  and mi.ordem between 1 and 7;

with lasanha as (
  select r.id
  from public.cozinha_receitas r
  join public.produtos p on p.id = r.produto_id
  where p.nome = 'TD19 - Lasanha de Frango'
),
molho_frango as (
  select id from public.cozinha_preparacoes where lower(nome) = 'molho frango desfiado'
)
update public.cozinha_receita_itens ri
set preparacao_id = (select id from molho_frango),
    ingrediente_id = null
from lasanha l
where ri.receita_id = l.id
  and ri.gramas_200 = 120
  and ri.gramas_300 = 165
  and ri.gramas_400 = 225;

alter table public.cozinha_receitas enable trigger user;
alter table public.cozinha_receita_itens enable trigger user;
alter table public.cozinha_receita_montagem_itens enable trigger user;
