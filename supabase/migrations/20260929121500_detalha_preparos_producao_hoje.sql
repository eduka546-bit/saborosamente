-- Produção 29/09/2026: deixa os preparos operacionais explícitos para a equipe da cozinha.

update public.cozinha_preparacoes
set modo_preparo =
'1. Colocar no liquidificador o leite, os ovos, a farinha de trigo, o óleo e o sal.
2. Bater até a massa ficar totalmente lisa e homogênea, sem grumos.
3. Aquecer a frigideira e untar somente o necessário para a massa não grudar.
4. Colocar uma porção da massa e espalhar formando uma camada fina e uniforme.
5. Quando a massa firmar e soltar do fundo, virar e dourar rapidamente o outro lado.
6. Retirar e reservar as massas prontas empilhadas.
7. Deixar esfriar antes de rechear e montar as panquecas.
8. Conferir o rendimento/peso final da massa pronta antes de liberar para a montagem.',
    observacao =
'Receita-base da massa de panqueca: 2 ovos + 500 ml de leite + 200 g de farinha de trigo + 8 g de óleo + 1 pitada de sal. Rendimento cadastrado: 711 g de massa pronta. Para a TD22, a montagem é por quantidade de panquecas: 1 un no 200 g, 2 un no 300 g e 3 un no 400 g.'
where id='c8a64eec-81aa-4a6e-8056-ee86cec72541';

update public.cozinha_preparacoes
set modo_preparo =
'1. A massa de lasanha utilizada já vem PRÉ-COZIDA.
2. NÃO ferver e NÃO cozinhar a massa separadamente.
3. Separar somente a quantidade necessária para a produção do dia.
4. Usar a massa diretamente na montagem, entre as camadas de molho, conforme a ficha da lasanha.
5. Garantir que a massa fique em contato com molho suficiente para hidratar corretamente durante o processo.
6. Conferir o peso/rendimento final considerado pela ficha antes de concluir a montagem.',
    observacao =
'Massa de lasanha pré-cozida. Não confundir com massa de panqueca. O rendimento operacional continua cadastrado como 1 kg de massa = aproximadamente 1,3 kg no produto pronto após hidratação com os molhos; não é um ganho obtido por fervura ou cozimento separado.'
where id='6d9145eb-fabc-4550-9dea-f3383ad5afeb';

update public.cozinha_preparacoes
set modo_preparo =
'1. Derreter a margarina em uma panela.
2. Acrescentar a farinha de trigo e misturar bem até formar uma pasta uniforme.
3. Adicionar o leite aos poucos, mexendo continuamente para não empelotar.
4. Continuar mexendo até o molho ficar liso e atingir o ponto de molho branco.
5. Conferir o peso final produzido antes de liberar para a montagem.'
where id='b0a17b2c-7563-4fab-985c-2222954ebe0e';

update public.cozinha_preparacoes
set modo_preparo =
'1. Aquecer o óleo de soja na panela.
2. Refogar a cebola.
3. Acrescentar a carne moída e cozinhar, soltando bem a carne para não formar blocos.
4. Acrescentar o Molho Sugo compartilhado já pronto.
5. Misturar bem e deixar apurar até o molho ficar homogêneo.
6. Acertar o sal.
7. Conferir o peso final do Molho Bolonhesa antes de liberar para as montagens.'
where id='24651606-cf23-49e4-9a69-edb6ac187b8a';
