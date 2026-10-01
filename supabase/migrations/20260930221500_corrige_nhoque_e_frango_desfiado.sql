-- 30/09/2026
-- Corrige preparo do nhoque pré-cozido e o ingrediente do molho de frango desfiado.

select set_config('request.jwt.claims', '{"role":"service_role"}', true);

delete from public.cozinha_preparacao_itens
where id='71a723f5-5ea6-4a60-a987-5df7bf839445';

update public.cozinha_preparacoes
set rendimento_final_g=1000,
    modo_preparo=
'1. Separar a quantidade necessária de nhoque pré-cozido.
2. Não adicionar água e não cozinhar em água.
3. Usar diretamente na montagem conforme a ficha do prato.
4. Conferir o peso final utilizado antes de liberar a montagem.',
    observacao='Nhoque pré-cozido. Não utiliza água na preparação. Considerar 1 kg utilizado = aproximadamente 1 kg pronto para montagem.'
where id='db51a4f6-e73e-44c5-81d0-13b16023d87f';

update public.cozinha_preparacao_itens
set ingrediente_id='4f8abc35-bfaa-4d7a-8bc1-5d31c66ee6ee',
    quantidade_texto='1,1 kg de peito de frango desfiado'
where id='e0599f7e-be27-4fc5-857a-b3d33eb078f3';

update public.cozinha_preparacoes
set modo_preparo=
'1. Aquecer o óleo de soja na panela.
2. Refogar a cebola.
3. Acrescentar o peito de frango desfiado e misturar.
4. Acrescentar o Molho sugo compartilhado e misturar bem.
5. Deixar apurar e acertar o sal.
6. Conferir o peso final do Molho de Frango Desfiado antes de liberar para as montagens.',
    observacao='Preparação compartilhada e única para TD12 Escondidinho de Frango, TD19 Lasanha de Frango, TD21 Panqueca de Frango e CO01 Frango Desfiado 150 g. Usa Peito de frango desfiado, não sassami. Usa o Molho sugo compartilhado como subpreparo.'
where id='75f87903-3703-4550-940e-f20db9a66fcb';
