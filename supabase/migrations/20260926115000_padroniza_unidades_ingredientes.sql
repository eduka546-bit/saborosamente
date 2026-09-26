-- Padronização de unidades e unificação de ingredientes (2026-09-26)
-- Água em litros; cebola/alho em gramas; ovo/louro em unidades.
-- Unifica formas de corte que não representam ingredientes diferentes.

alter table public.cozinha_ingredientes
  drop constraint if exists cozinha_ingredientes_unidade_medida_check;
alter table public.cozinha_ingredientes
  add constraint cozinha_ingredientes_unidade_medida_check
  check (unidade_medida = any (array['g'::text,'un'::text,'L'::text]));

update public.cozinha_ingredientes
set unidade_medida='L',
    custo_por_unidade=custo_por_kg,
    observacao=concat_ws(E'\n',nullif(observacao,''),'Unidade canônica: litro (L). Quantidades de água das preparações são armazenadas em litros.'),
    updated_at=now()
where id='9ee3e0d5-5239-4396-9f0d-b8ab1556c9da';

update public.cozinha_preparacao_itens
set quantidade=quantidade/1000.0
where ingrediente_id='9ee3e0d5-5239-4396-9f0d-b8ab1556c9da'
  and quantidade>=100;

update public.cozinha_preparacao_itens
set quantidade=110, quantidade_texto='110 g de cebola (equiv. 1 cebola média)'
where id in ('6485c25b-3252-4af4-a0db-8c5ea11e92ac','71cefa43-11b6-4d15-b69e-f90e1da8b23b');

update public.cozinha_preparacao_itens
set quantidade=220, quantidade_texto='220 g de cebola (equiv. 2 cebolas médias)'
where id='b6454b96-31f7-4998-b867-60960dd99933';

update public.cozinha_preparacao_itens
set ingrediente_id='de611738-8532-4625-b8d1-811767a4529b'
where ingrediente_id='8ec237d7-5efb-4d8a-b90a-b7a66eca4a66';

delete from public.cozinha_estoque
where ingrediente_id='8ec237d7-5efb-4d8a-b90a-b7a66eca4a66'
  and coalesce(quantidade_atual,0)=0 and coalesce(quantidade_minima,0)=0;
delete from public.cozinha_ingredientes where id='8ec237d7-5efb-4d8a-b90a-b7a66eca4a66';

update public.cozinha_preparacao_itens
set quantidade=15, quantidade_texto='15 g de alho (equiv. 5 dentes)'
where id in ('7f2331b0-d55b-409a-b1ad-fef3f3665690','369b1d12-9930-4fc0-abe1-4d72b46314a6');

update public.cozinha_preparacao_itens
set quantidade=24, quantidade_texto='24 g de alho (equiv. 1 cabeça)'
where id='698da95a-3cbb-40c3-b241-8be52f87a584';

update public.cozinha_ingredientes
set unidade_medida='un',
    custo_por_unidade=round((custo_por_kg*0.050)::numeric,4),
    observacao=concat_ws(E'\n',nullif(observacao,''),'Unidade canônica: ovo (un). Conversão de referência: 1 ovo grande ≈ 50 g.'),
    updated_at=now()
where id='a816f5fd-f6ed-4faa-bbda-a35a35493cf1';

update public.cozinha_preparacao_itens
set quantidade=0.12, quantidade_texto='0,12 ovo (equiv. 6 g; referência 1 ovo grande = 50 g)'
where id='2324a517-3d44-41c7-b8ea-af4703da81f6';

update public.cozinha_preparacao_itens
set quantidade=0.10, quantidade_texto='0,10 ovo (equiv. 5 g; referência 1 ovo grande = 50 g)'
where id='df9e936a-8a89-4594-a7fb-70e86711b8b3';

update public.cozinha_ingredientes
set unidade_medida='un',
    custo_por_unidade=round((custo_por_kg*0.0005)::numeric,4),
    observacao=concat_ws(E'\n',nullif(observacao,''),'Unidade canônica: folha (un). Referência aproximada de custo: 1 folha seca ≈ 0,5 g.'),
    updated_at=now()
where id='bf1fd2d5-da1e-47ec-9424-1af1c44363bb';

update public.cozinha_preparacao_itens
set ingrediente_id='8e3b719b-3e39-4350-96db-3248800363e7'
where ingrediente_id='85be6c0c-10b3-4463-8f99-9c54e6c14e18';

delete from public.cozinha_estoque
where ingrediente_id='85be6c0c-10b3-4463-8f99-9c54e6c14e18'
  and coalesce(quantidade_atual,0)=0 and coalesce(quantidade_minima,0)=0;
delete from public.cozinha_ingredientes where id='85be6c0c-10b3-4463-8f99-9c54e6c14e18';

delete from public.cozinha_estoque
where ingrediente_id='8e8e5898-a6ea-48b7-a7c0-15fbf82e2bb7'
  and coalesce(quantidade_atual,0)=0 and coalesce(quantidade_minima,0)=0;
delete from public.cozinha_ingredientes where id='8e8e5898-a6ea-48b7-a7c0-15fbf82e2bb7';

delete from public.cozinha_estoque
where ingrediente_id='801bf2e6-4703-41d0-b978-68845701af23'
  and coalesce(quantidade_atual,0)=0 and coalesce(quantidade_minima,0)=0;
delete from public.cozinha_ingredientes where id='801bf2e6-4703-41d0-b978-68845701af23';
