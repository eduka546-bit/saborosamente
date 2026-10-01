-- 01/10/2026
-- Padroniza a muçarela ralada nas famílias de lasanha, escondidinho e panqueca.
-- A montagem é a fonte de verdade para a quantidade final usada em cada marmita.

select set_config('request.jwt.claims', '{"role":"service_role"}', true);

update public.cozinha_receita_montagem_itens m
set nome='Muçarela ralada'
from public.cozinha_receitas r, public.produtos p
where m.receita_id=r.id
  and r.produto_id=p.id
  and (
    p.nome ilike '%Lasanha%'
    or p.nome ilike '%Escondidinho%'
    or p.nome ilike '%Panqueca%'
  )
  and (
    m.nome ilike '%mussarela%'
    or m.nome ilike '%muçarela%'
    or m.nome ilike '%queijo mussarela%'
  );

update public.cozinha_receita_itens ri
set gramas_200 = case
      when p.nome ilike '%Panqueca%' then 5
      when p.nome ilike '%Lasanha%' or p.nome ilike '%Escondidinho%' then 10
      else ri.gramas_200 end,
    gramas_300 = case
      when p.nome ilike '%Panqueca%' then 10
      when p.nome ilike '%Lasanha%' or p.nome ilike '%Escondidinho%' then 15
      else ri.gramas_300 end,
    gramas_400 = case
      when p.nome ilike '%Panqueca%' then 15
      when p.nome ilike '%Lasanha%' or p.nome ilike '%Escondidinho%' then 20
      else ri.gramas_400 end,
    observacao = 'Muçarela ralada usada na finalização/montagem.'
from public.cozinha_receitas r, public.produtos p, public.cozinha_ingredientes i
where ri.receita_id=r.id
  and r.produto_id=p.id
  and ri.ingrediente_id=i.id
  and i.nome='Muçarela'
  and (
    p.nome ilike '%Lasanha%'
    or p.nome ilike '%Escondidinho%'
    or p.nome ilike '%Panqueca%'
  );
