-- Ajustes de produção real 01/10/2026:
-- 1) Molho de Frango Desfiado com mais Molho Sugo, mantendo ~10% menos molho
--    relativo ao frango do que a razão carne/sugo do Molho Bolonhesa.
-- 2) Rendimento do Purê de Batata recalibrado pela produção real.

update public.cozinha_preparacao_itens
set quantidade=525,
    quantidade_texto='525 g de Molho sugo pronto (47,7% do peso do frango; ~10% menos molho que a razão do Bolonhesa)'
where id='25e1f690-9faa-4f43-b1aa-087e7efc7901';

update public.cozinha_preparacoes
set rendimento_final_g=1795,
    modo_preparo='1. Aquecer o óleo de soja na panela.
2. Refogar a cebola.
3. Acrescentar o peito de frango desfiado e misturar.
4. Acrescentar o Molho sugo compartilhado na proporção de aproximadamente 47,7% do peso do frango desfiado.
5. Misturar muito bem até todo o frango ficar envolvido pelo molho, sem deixar o preparo seco.
6. Deixar apurar rapidamente, sem reduzir demais o molho.
7. Acertar o sal.
8. Conferir o peso final do Molho de Frango Desfiado antes de liberar para as montagens.',
    observacao='Preparação compartilhada e única para TD12 Escondidinho de Frango, TD19 Lasanha de Frango, TD21 Panqueca de Frango e CO01 Frango Desfiado 150 g. Ajuste de 01/10/2026 após produção real ficar seca: usar 525 g de Molho sugo para 1,1 kg de peito de frango desfiado. Razão sugo/frango = 47,7%, cerca de 10% menor que a razão do Molho Bolonhesa (53%).',
    updated_at=now()
where id='75f87903-3703-4550-940e-f20db9a66fcb';

update public.cozinha_preparacoes
set rendimento_final_g=625,
    observacao='Rendimento operacional ajustado pela produção real de 01/10/2026. O lote calculado pela receita anterior para 9,2 kg usava aproximadamente 6,815 kg de batata-base e rendeu cerca de 4,26 kg de purê pronto. Novo fator operacional: aproximadamente 625 g de purê pronto por 1 kg de batata-base. Manter 200 ml de leite por kg de batata e conferir novamente o rendimento nas próximas produções.',
    updated_at=now()
where id='6839dd0d-d60f-4054-a7ee-8f046c5a85ac';
