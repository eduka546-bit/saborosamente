-- Ajustes operacionais validados em produção em 30/09/2026.
-- Arroz 2,7x; feijão preto 3,0x; nhoque sem ganho; purê 1,35x;
-- água de cocção explícita; molho sugo com mais tomate fresco.

update public.cozinha_ingredientes
set tipo_rendimento='ganho',
    quebra_percentual=0,
    fator_rendimento=2.7,
    observacao='Rendimento operacional ajustado pela produção real: 1 kg de arroz cru rende aproximadamente 2,7 kg de arroz pronto.'
where id='381f633b-3a64-46dc-b184-547029bea84e';

update public.cozinha_preparacoes
set rendimento_final_g=2700,
    observacao='Rendimento operacional ajustado pela produção real: 1 kg de arroz cru rende aproximadamente 2,7 kg pronto. Água de cocção cadastrada separadamente.',
    updated_at=now()
where id='75b7becb-1c43-4c76-8b57-92f19404c5c7';

update public.cozinha_ingredientes
set tipo_rendimento='ganho',
    quebra_percentual=0,
    fator_rendimento=3.0,
    observacao='Rendimento ajustado pela produção real de 30/09/2026: 3 kg de feijão seco renderam aproximadamente 9 kg de feijão pronto com caldo (6 kg usados + 3 kg de sobra). Fator de ganho operacional: 3,0x.'
where id='5df333ad-833d-4286-b35a-a75ad1dd969d';

update public.cozinha_preparacoes
set rendimento_final_g=3000,
    observacao='Rendimento operacional ajustado pela produção real de 30/09/2026: 1 kg de feijão preto seco rende aproximadamente 3 kg pronto com caldo.',
    updated_at=now()
where id='d413d536-5796-4825-8e2d-4830a1648691';

update public.cozinha_ingredientes
set tipo_rendimento='nenhum',
    quebra_percentual=0,
    fator_rendimento=1,
    observacao='Nhoque sem ganho/perda de peso operacional: considerar 1 kg utilizado = 1 kg pronto.'
where id='9fb7a71b-ce41-4e03-a97b-3a1ab30bbdda';

update public.cozinha_preparacoes
set rendimento_final_g=1000,
    modo_preparo='1. Ferver água suficiente para cozinhar o nhoque.
2. Colocar o nhoque na água fervente.
3. Retirar assim que estiver cozido/no ponto e escorrer completamente.
4. Considerar o mesmo peso do nhoque utilizado para o peso pronto; não aplicar ganho de hidratação.
5. Conferir o peso final antes de liberar para a montagem.',
    observacao='Rendimento operacional corrigido: 1 kg de nhoque = aproximadamente 1 kg pronto. A água é apenas de cocção e deve ser escorrida.',
    updated_at=now()
where id='db51a4f6-e73e-44c5-81d0-13b16023d87f';

delete from public.cozinha_preparacao_itens
where preparacao_id='db51a4f6-e73e-44c5-81d0-13b16023d87f'
  and ingrediente_id='9ee3e0d5-5239-4396-9f0d-b8ab1556c9da';

insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
values
('db51a4f6-e73e-44c5-81d0-13b16023d87f','9ee3e0d5-5239-4396-9f0d-b8ab1556c9da',null,3,1,1,'3 L de água para cocção por kg de nhoque — escorrer; não compõe o rendimento');

update public.cozinha_preparacoes
set rendimento_final_g=1350,
    modo_preparo='1. Cozinhar a batata inglesa em água até ficar bem macia.
2. Escorrer completamente a água.
3. Amassar as batatas ainda quentes.
4. Acrescentar a margarina.
5. Adicionar o leite aos poucos até atingir o ponto de purê.
6. Acertar o sal e conferir o peso final antes de liberar para a montagem.',
    observacao='Mesmo purê usado nos escondidinhos. Ajustado após produção real: usar rendimento operacional de aproximadamente 1,35 kg de purê pronto por kg de batata-base, para dar pequena margem adicional de produção.',
    updated_at=now()
where id='6839dd0d-d60f-4054-a7ee-8f046c5a85ac';

delete from public.cozinha_preparacao_itens
where preparacao_id='6839dd0d-d60f-4054-a7ee-8f046c5a85ac'
  and ingrediente_id='9ee3e0d5-5239-4396-9f0d-b8ab1556c9da';

insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
values
('6839dd0d-d60f-4054-a7ee-8f046c5a85ac','9ee3e0d5-5239-4396-9f0d-b8ab1556c9da',null,2,1,1,'2 L de água para cozinhar 1 kg de batata — escorrer; não compõe o rendimento');

update public.cozinha_preparacao_itens set ordem=0 where id='41181c7c-2e60-4e7d-9793-cc60d928f5e4';
update public.cozinha_preparacao_itens set ordem=2 where id='a1bd6d8b-a8c1-489e-b81e-ac0c1d192971';
update public.cozinha_preparacao_itens set ordem=3 where id='049a0bf8-a69a-4ed3-9cd5-96b675bd4d0a';

update public.cozinha_preparacoes
set rendimento_final_g=7099.76,
    modo_preparo='1. Cozinhar os tomates frescos até começarem a se desmanchar.
2. Passar os tomates pelo mixer até formar uma base homogênea.
3. Acrescentar o molho de tomate e o extrato industrializados nas quantidades da ficha.
4. Deixar apurar em fogo baixo até atingir o ponto do molho.
5. Acertar sal e pimenta.
6. Conferir o peso final do lote antes de liberar para as demais preparações.',
    observacao='Preparação compartilhada e única. Receita ajustada para reduzir o sabor industrializado: mais tomate fresco e 15% menos molho/extrato industrializados, mantendo o mesmo rendimento final de 7.099,76 g.',
    updated_at=now()
where id='37e5b7cc-4e45-4a3d-bdb1-eb71e922157a';

update public.cozinha_preparacao_itens
set quantidade=2631.263,
    quantidade_texto='aprox. 2,631 kg de tomate fresco (cerca de 21,4 tomates médios; separar 22)'
where id='db2392eb-117d-4397-bc61-067c9ff031be';

update public.cozinha_preparacao_itens
set quantidade=3400,
    quantidade_texto='3,4 kg de molho de tomate industrializado'
where id='b6403ca9-22e6-42ef-9009-fa76952f43be';

update public.cozinha_preparacao_itens
set quantidade=1700,
    quantidade_texto='1,7 kg de extrato de tomate industrializado'
where id='48585149-c24e-4700-b74a-35d3d29a46ec';
