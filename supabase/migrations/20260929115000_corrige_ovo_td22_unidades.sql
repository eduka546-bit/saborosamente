-- TD22: corrige ovo de gramas-equivalentes para unidades reais.
-- Referência operacional já cadastrada: 1 ovo grande ≈ 50 g.

update public.cozinha_receita_itens
set gramas_200 = round((gramas_200 / 50.0)::numeric, 6),
    gramas_300 = round((gramas_300 / 50.0)::numeric, 6),
    gramas_400 = round((gramas_400 / 50.0)::numeric, 6),
    observacao = 'Quantidade em unidades de ovo. Conversão usada: 1 ovo grande ≈ 50 g.'
where receita_id='7e442f97-a6f6-4419-8071-0421b3ae7c40'
  and ingrediente_id='a816f5fd-f6ed-4faa-bbda-a35a35493cf1'
  and gramas_300 > 1;
