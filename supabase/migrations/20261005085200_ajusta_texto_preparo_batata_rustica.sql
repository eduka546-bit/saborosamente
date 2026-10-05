select set_config('request.jwt.claims', '{"role":"service_role"}', true);

update public.cozinha_preparacoes
set modo_preparo = concat_ws(E'\n',
  'Descascar a batata inglesa.',
  'Cortar uma batata média em 4 pedaços.',
  'Cozinhar em água com sal até ficar al dente.',
  'Escorrer bem.',
  'Fritar por imersão a 180 °C até dourar.',
  'Escorrer o excesso de óleo e conferir o peso pronto.'
),
updated_at=now()
where nome='Batata rústica';