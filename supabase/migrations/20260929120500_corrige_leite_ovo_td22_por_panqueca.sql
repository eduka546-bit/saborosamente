-- TD22 - Panqueca de Carne com Queijo a Bolonhesa
-- Corrige leite e ovo pela quantidade real de panquecas.
-- Fonte-base (300 g): 70 g de leite + 10 g de ovo para 2 panquecas.
-- Montagem atual: 1 / 2 / 3 panquecas nos tamanhos 200 / 300 / 400 g.

update public.cozinha_receita_itens
set gramas_200=35,
    gramas_300=70,
    gramas_400=105,
    observacao='Escala por quantidade de panquecas: 35 g de leite por panqueca (1/2/3 unidades nos tamanhos 200/300/400 g).'
where receita_id='7e442f97-a6f6-4419-8071-0421b3ae7c40'
  and ingrediente_id='86ea7914-cf28-4dd2-8f65-646c820e2326';

update public.cozinha_receita_itens
set gramas_200=0.1,
    gramas_300=0.2,
    gramas_400=0.3,
    observacao='Escala por quantidade de panquecas. Fonte-base: 10 g de ovo para 2 panquecas; referência 1 ovo grande ≈ 50 g.'
where receita_id='7e442f97-a6f6-4419-8071-0421b3ae7c40'
  and ingrediente_id='a816f5fd-f6ed-4faa-bbda-a35a35493cf1';
