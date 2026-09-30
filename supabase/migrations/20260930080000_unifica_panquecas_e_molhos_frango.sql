-- Revisão da produção de 30/09 e 01/10/2026.
-- Panquecas: mesma massa para carne e frango.
-- Referência operacional medida na cozinha: 8 ovos = 30 panquecas.
-- Molho da panqueca de carne = Molho Bolonhesa compartilhado.
-- Molho da panqueca de frango = Molho frango desfiado compartilhado.
-- Lasanha de frango, escondidinho de frango, panqueca de frango e CO01 usam o mesmo molho de frango.

update public.cozinha_preparacoes
set rendimento_final_g = 2095,
    modo_preparo =
'1. Colocar no liquidificador o leite, os ovos, a farinha de trigo, o óleo e o sal.
2. Bater até a massa ficar totalmente lisa e homogênea, sem grumos.
3. Aquecer a frigideira e untar somente o necessário para a massa não grudar.
4. Colocar uma porção da massa e espalhar formando uma camada fina e uniforme.
5. Quando a massa firmar e soltar do fundo, virar e dourar rapidamente o outro lado.
6. Retirar e reservar as massas prontas empilhadas.
7. Deixar esfriar antes de rechear.
8. Conferir a CONTAGEM: o lote-base abaixo deve render aproximadamente 30 panquecas.',
    observacao =
'Massa compartilhada entre TD21 (Panqueca de Frango) e TD22 (Panqueca de Carne). Referência operacional medida na cozinha: 8 ovos = aproximadamente 30 panquecas. Lote-base para 30 unidades: 480 g de farinha, 1,05 L de leite, 8 ovos, 150 g de óleo e 15 g de sal. Nos tamanhos 200/300/400 g usar 1/2/3 panquecas por marmita.'
where id='c8a64eec-81aa-4a6e-8056-ee86cec72541';

update public.cozinha_preparacao_itens set quantidade=8, quantidade_texto='8 ovos — referência medida para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ingrediente_id='a816f5fd-f6ed-4faa-bbda-a35a35493cf1';

update public.cozinha_preparacao_itens set quantidade=1050, quantidade_texto='1,05 L de leite para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ingrediente_id='86ea7914-cf28-4dd2-8f65-646c820e2326';

update public.cozinha_preparacao_itens set quantidade=480, quantidade_texto='480 g de farinha de trigo para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ingrediente_id='4b10902a-dda5-4fa7-9f26-27ed2f4178a8';

update public.cozinha_preparacao_itens set quantidade=150, quantidade_texto='150 g de óleo para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ingrediente_id='10c388fa-db0f-4a7b-92c4-7e20c04029ee';

update public.cozinha_preparacao_itens set quantidade=15, quantidade_texto='15 g de sal para 30 panquecas'
where preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541' and ingrediente_id='3ae1b700-b656-4b7b-b9e7-c283225ed037';

update public.cozinha_receita_itens
set gramas_200=16, gramas_300=32, gramas_400=48,
    observacao='Massa compartilhada: 16 g de farinha por panqueca; 1/2/3 panquecas nos tamanhos 200/300/400 g.'
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
  and ingrediente_id='4b10902a-dda5-4fa7-9f26-27ed2f4178a8';

update public.cozinha_receita_itens
set gramas_200=0.266667, gramas_300=0.533333, gramas_400=0.8,
    observacao='Referência operacional medida: 8 ovos = 30 panquecas. Equivale a 0,2667 ovo por panqueca.'
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
  and ingrediente_id='a816f5fd-f6ed-4faa-bbda-a35a35493cf1';

update public.cozinha_receita_itens
set gramas_200=35, gramas_300=70, gramas_400=105,
    observacao='Massa compartilhada: 35 ml de leite por panqueca; 1/2/3 panquecas nos tamanhos 200/300/400 g.'
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
  and ingrediente_id='86ea7914-cf28-4dd2-8f65-646c820e2326';

update public.cozinha_receita_itens
set gramas_200=5, gramas_300=10, gramas_400=15,
    observacao='Massa compartilhada: 5 g de óleo por panqueca; 1/2/3 panquecas nos tamanhos 200/300/400 g.'
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
  and ingrediente_id='10c388fa-db0f-4a7b-92c4-7e20c04029ee';

update public.cozinha_receita_itens
set gramas_200=0.5, gramas_300=1, gramas_400=1.5,
    observacao='Massa compartilhada: 0,5 g de sal por panqueca; 1/2/3 panquecas nos tamanhos 200/300/400 g.'
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
  and ingrediente_id='3ae1b700-b656-4b7b-b9e7-c283225ed037';

update public.cozinha_receita_montagem_itens
set nome='Panquecas de carne',
    observacao='Mesma massa compartilhada da panqueca de frango. Quantidade: 1 un no 200 g, 2 un no 300 g e 3 un no 400 g.'
where id='0a7e1c6c-d374-49cb-a9f9-c22d4c23189c';

update public.cozinha_receita_montagem_itens
set nome='Molho Bolonhesa',
    observacao='Usar o MESMO Molho Bolonhesa compartilhado de lasanha de carne, escondidinho de carne, nhoque e demais pratos à bolonhesa.'
where id='9eede849-dcaf-4a4f-b4e9-b54469ea5b30';

update public.cozinha_receitas
set modo_preparo=
'Usar a Massa panqueca compartilhada para formar as panquecas.
Rechear/montar a versão de carne com o Molho Bolonhesa compartilhado.
A Massa panqueca é a mesma usada na TD21; muda somente o recheio/molho.
Referência: 1 panqueca no 200 g, 2 no 300 g e 3 no 400 g.'
where id='7e442f97-a6f6-4419-8071-0421b3ae7c40';

update public.cozinha_receita_montagem_itens
set nome='Molho frango desfiado',
    gramas_200=40, gramas_300=60, gramas_400=80,
    observacao='Mesmo preparo compartilhado usado na TD19 Lasanha de Frango, TD12 Escondidinho de Frango e CO01.'
where id='f03e3821-813c-44d6-aba1-ed9cf4c934aa';

update public.cozinha_receita_montagem_itens
set nome='Panquecas de frango',
    observacao='Mesma massa compartilhada da panqueca de carne. Quantidade: 1 un no 200 g, 2 un no 300 g e 3 un no 400 g.'
where id='de04f9d8-8ce7-4b42-a2b1-a4c7295b391c';

delete from public.cozinha_receita_montagem_itens
where id='56075b91-5a36-43e5-93e2-691317c2067d';

update public.cozinha_receitas
set modo_preparo=
'Usar a Massa panqueca compartilhada para formar as panquecas.
Rechear/montar a versão de frango com o Molho frango desfiado compartilhado.
É o MESMO Molho frango desfiado usado na TD19 Lasanha de Frango, TD12 Escondidinho de Frango e CO01.
A Massa panqueca é a mesma usada na TD22; muda somente o recheio/molho.
Referência: 1 panqueca no 200 g, 2 no 300 g e 3 no 400 g.'
where id='89748be6-852f-4fc1-a0a5-5c4dce8b0fd4';

update public.cozinha_receita_montagem_itens
set nome='Molho frango desfiado',
    observacao='Mesmo preparo compartilhado usado na TD12, TD21 e CO01.'
where id='2889766f-ddfe-4d71-9a4a-d825b8e28cb3';

update public.cozinha_receitas
set preparacoes=jsonb_build_array(
  jsonb_build_object('id','b0a17b2c-7563-4fab-985c-2222954ebe0e','nome','Molho branco'),
  jsonb_build_object('id','75f87903-3703-4550-940e-f20db9a66fcb','nome','Molho frango desfiado'),
  jsonb_build_object('id','6d9145eb-fabc-4550-9dea-f3383ad5afeb','nome','Massa de lasanha')
),
modo_preparo=
'Usar o Molho frango desfiado compartilhado (mesmo da TD12, TD21 e CO01).
Usar o Molho branco compartilhado.
A massa de lasanha já vem PRÉ-COZIDA: não ferver e não cozinhar separadamente.
Montar em camadas conforme a ficha de montagem.'
where id='dae1d6cb-9244-48de-b80e-fcc93acfe736';

update public.cozinha_preparacoes
set observacao=
'Preparação compartilhada e única para TD12 Escondidinho de Frango, TD19 Lasanha de Frango, TD21 Panqueca de Frango e CO01 Frango Desfiado 150 g. Usa o Molho sugo compartilhado como subpreparo. Não criar outro molho de frango separado para esses pratos.'
where id='75f87903-3703-4550-940e-f20db9a66fcb';
