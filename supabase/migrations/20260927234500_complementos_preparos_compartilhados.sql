-- Complementos CO01-CO06: reutilização de preparos compartilhados e estruturação das bases.
-- 2026-09-27

-- Molho frango desfiado (mesma base usada pelo TD12 e CO01)
update public.cozinha_preparacoes
set rendimento_final_g=1450,
    modo_preparo='Desfiar o frango.
Em uma panela, refogar a cebola e o frango desfiado no óleo de soja.
Acrescentar o Molho sugo compartilhado e misturar.
Deixar apurar e acertar o sal.',
    observacao='Preparação compartilhada entre TD12 e CO01. Base proporcional à montagem do TD12: 145 g prontos.',
    updated_at=now()
where id='75f87903-3703-4550-940e-f20db9a66fcb';

delete from public.cozinha_preparacao_itens
where preparacao_id='75f87903-3703-4550-940e-f20db9a66fcb';

insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
values
('75f87903-3703-4550-940e-f20db9a66fcb','f3459aa8-8686-473f-8e4b-5560bf2d9b9b',null,1100,1,0,'1,1 kg de sassami para cozinhar e desfiar'),
('75f87903-3703-4550-940e-f20db9a66fcb',null,'37e5b7cc-4e45-4a3d-bdb1-eb71e922157a',250,1,1,'250 g de Molho sugo pronto'),
('75f87903-3703-4550-940e-f20db9a66fcb','de611738-8532-4625-b8d1-811767a4529b',null,50,1,2,'50 g de cebola'),
('75f87903-3703-4550-940e-f20db9a66fcb','10c388fa-db0f-4a7b-92c4-7e20c04029ee',null,100,1,3,'100 g de óleo de soja'),
('75f87903-3703-4550-940e-f20db9a66fcb','3ae1b700-b656-4b7b-b9e7-c283225ed037',null,20,1,4,'20 g de sal');

-- Frango ensopado (mesma base usada pelo TD07 e CO03)
update public.cozinha_preparacoes
set rendimento_final_g=1700,
    modo_preparo='Refogar o filé de coxa e sobrecoxa em cubos grandes.
Acrescentar a cebola.
Adicionar o Molho sugo compartilhado até envolver o frango.
Deixar apurar até o frango ficar macio.
Acertar o sal e finalizar com salsinha.',
    observacao='Preparação compartilhada entre TD07 e CO03. Base proporcional à montagem do TD07: 170 g prontos.',
    updated_at=now()
where id='ab9147e6-e057-46a2-a393-e32604cde48f';

delete from public.cozinha_preparacao_itens
where preparacao_id='ab9147e6-e057-46a2-a393-e32604cde48f';

insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
values
('ab9147e6-e057-46a2-a393-e32604cde48f','19645666-2e46-410a-b9d1-353eee46b188',null,1000,1,0,'1 kg de filé de coxa e sobrecoxa'),
('ab9147e6-e057-46a2-a393-e32604cde48f',null,'37e5b7cc-4e45-4a3d-bdb1-eb71e922157a',500,1,1,'500 g de Molho sugo pronto'),
('ab9147e6-e057-46a2-a393-e32604cde48f','de611738-8532-4625-b8d1-811767a4529b',null,100,1,2,'100 g de cebola'),
('ab9147e6-e057-46a2-a393-e32604cde48f','3ae1b700-b656-4b7b-b9e7-c283225ed037',null,20,1,3,'20 g de sal'),
('ab9147e6-e057-46a2-a393-e32604cde48f','7ae45021-073b-41c7-b5ce-5c523b0fd5ec',null,10,1,4,'10 g de salsinha');

-- Carne ensopada: subpreparo comum a TD04 e CO06
insert into public.cozinha_preparacoes(nome,rendimento_final_g,modo_preparo,observacao,ativo)
select 'Carne ensopada',2000,
       'Refogar a carne bovina em cubos com a cebola.
Acrescentar o Molho sugo compartilhado, o demi glace e a água.
Deixar cozinhar e apurar até a carne ficar macia.
Acertar o sal e finalizar com salsinha.',
       'Subpreparação compartilhada entre a Vaca Atolada (TD04) e o complemento CO06. Representa somente carne + molho, sem aipim.',
       true
where not exists (select 1 from public.cozinha_preparacoes where lower(nome)=lower('Carne ensopada'));

update public.cozinha_preparacoes
set rendimento_final_g=2000,
    modo_preparo='Refogar a carne bovina em cubos com a cebola.
Acrescentar o Molho sugo compartilhado, o demi glace e a água.
Deixar cozinhar e apurar até a carne ficar macia.
Acertar o sal e finalizar com salsinha.',
    observacao='Subpreparação compartilhada entre a Vaca Atolada (TD04) e o complemento CO06. Representa somente carne + molho, sem aipim.',
    ativo=true,updated_at=now()
where lower(nome)=lower('Carne ensopada');

delete from public.cozinha_preparacao_itens
where preparacao_id=(select id from public.cozinha_preparacoes where lower(nome)=lower('Carne ensopada') limit 1);

insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select p.id,'ef1b358e-dde2-41c6-889f-7c618391543e',null,1000,1,0,'1 kg de carne bovina em cubos pequenos'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;
insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select p.id,null,'37e5b7cc-4e45-4a3d-bdb1-eb71e922157a',500,1,1,'500 g de Molho sugo pronto'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;
insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select p.id,'de611738-8532-4625-b8d1-811767a4529b',null,100,1,2,'100 g de cebola'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;
insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select p.id,'852a0862-b7b0-4165-bed0-a8e36717a7a4',null,40,1,3,'40 g de demi glace'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;
insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select p.id,'9ee3e0d5-5239-4396-9f0d-b8ab1556c9da',null,0.33,1,4,'0,33 L de água'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;
insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select p.id,'3ae1b700-b656-4b7b-b9e7-c283225ed037',null,20,1,5,'20 g de sal'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;
insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select p.id,'7ae45021-073b-41c7-b5ce-5c523b0fd5ec',null,10,1,6,'10 g de salsinha'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;

-- Vaca Atolada = Carne ensopada compartilhada + aipim
update public.cozinha_preparacoes
set rendimento_final_g=3000,
    modo_preparo='Cozinhar o aipim e retirar a fibra.
Preparar a Carne ensopada conforme a ficha compartilhada.
Acrescentar o aipim cozido em cubos à Carne ensopada.
Misturar e deixar apurar.',
    observacao='TD04 estruturado em 2 partes: 2 kg de Carne ensopada compartilhada + 1 kg de aipim, rendendo 3 kg de Vaca Atolada.',
    updated_at=now()
where id='fb4a46be-6a0d-4f22-b239-a45d727057f5';

delete from public.cozinha_preparacao_itens
where preparacao_id='fb4a46be-6a0d-4f22-b239-a45d727057f5';

insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
select 'fb4a46be-6a0d-4f22-b239-a45d727057f5',null,p.id,2000,1,0,'2 kg de Carne ensopada pronta'
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1;
insert into public.cozinha_preparacao_itens
(preparacao_id,ingrediente_id,preparacao_componente_id,quantidade,rendimento_quebra,ordem,quantidade_texto)
values ('fb4a46be-6a0d-4f22-b239-a45d727057f5','a8b38e6b-dfc2-49e2-9445-f0335ce04e75',null,1000,1,1,'1 kg de aipim cozido em cubos');

-- Fichas dos complementos (CO02 permanece como já estava).
insert into public.cozinha_receitas(produto_id,ingredientes,preparacoes,modo_preparo,rendimento_observacao,updated_at)
values
('2af58d7a-5f1e-45ac-af7d-c50992e5e617','[]'::jsonb,jsonb_build_array(jsonb_build_object('id','75f87903-3703-4550-940e-f20db9a66fcb','nome','Molho frango desfiado')),'Utilizar a preparação compartilhada Molho frango desfiado.','Complemento composto por 150 g prontos de Molho frango desfiado.',now()),
('717d36ec-bc4c-46c1-a77c-b8d84d9ce779','[]'::jsonb,jsonb_build_array(jsonb_build_object('id','ab9147e6-e057-46a2-a393-e32604cde48f','nome','Coxa e sobrecoxa ensopada')),'Utilizar a mesma preparação de frango ensopado do TD07.','Complemento composto por 150 g prontos de Molho de frango ensopado.',now()),
('bc68d9ce-53d3-4404-a407-31f4386596de','[]'::jsonb,jsonb_build_array(jsonb_build_object('id','cd31a741-ca66-4df2-aa91-0e17ad054050','nome','Bife ao molho')),'Utilizar a mesma preparação Bife ao molho do TD16.','Complemento composto por 150 g prontos de Bife ao Molho.',now()),
('028d7c2f-38c8-4ab5-9536-cf25b941a4d7','[]'::jsonb,jsonb_build_array(jsonb_build_object('id','24651606-cf23-49e4-9a69-edb6ac187b8a','nome','Molho Bolonhesa')),'Utilizar a mesma preparação Molho Bolonhesa compartilhada.','Complemento composto por 150 g prontos de Molho Bolonhesa.',now())
on conflict(produto_id) do update set
 ingredientes=excluded.ingredientes,
 preparacoes=excluded.preparacoes,
 modo_preparo=excluded.modo_preparo,
 rendimento_observacao=excluded.rendimento_observacao,
 updated_at=now();

insert into public.cozinha_receitas(produto_id,ingredientes,preparacoes,modo_preparo,rendimento_observacao,updated_at)
select '52132978-edb7-4f45-a531-ac6c27208e35','[]'::jsonb,
       jsonb_build_array(jsonb_build_object('id',p.id::text,'nome','Carne ensopada')),
       'Utilizar a mesma Carne ensopada usada dentro da Vaca Atolada.',
       'Complemento composto por 150 g prontos de Carne ensopada.',now()
from public.cozinha_preparacoes p where lower(p.nome)=lower('Carne ensopada') limit 1
on conflict(produto_id) do update set
 ingredientes=excluded.ingredientes,
 preparacoes=excluded.preparacoes,
 modo_preparo=excluded.modo_preparo,
 rendimento_observacao=excluded.rendimento_observacao,
 updated_at=now();

delete from public.cozinha_receita_itens
where receita_id in (
 select id from public.cozinha_receitas
 where produto_id in (
 '2af58d7a-5f1e-45ac-af7d-c50992e5e617',
 '717d36ec-bc4c-46c1-a77c-b8d84d9ce779',
 'bc68d9ce-53d3-4404-a407-31f4386596de',
 '028d7c2f-38c8-4ab5-9536-cf25b941a4d7',
 '52132978-edb7-4f45-a531-ac6c27208e35'
 ));

insert into public.cozinha_receita_itens
(receita_id,ingrediente_id,preparacao_id,gramas_personalizada,gramas_200,gramas_300,gramas_400,rendimento_quebra,observacao,ordem,operacao_producao,fator_producao)
select id,null,'75f87903-3703-4550-940e-f20db9a66fcb',150,0,0,0,1,'CO01 usa a mesma preparação compartilhada do TD12.',0,'direto',1 from public.cozinha_receitas where produto_id='2af58d7a-5f1e-45ac-af7d-c50992e5e617';
insert into public.cozinha_receita_itens
(receita_id,ingrediente_id,preparacao_id,gramas_personalizada,gramas_200,gramas_300,gramas_400,rendimento_quebra,observacao,ordem,operacao_producao,fator_producao)
select id,null,'ab9147e6-e057-46a2-a393-e32604cde48f',150,0,0,0,1,'CO03 usa a mesma preparação compartilhada do TD07.',0,'direto',1 from public.cozinha_receitas where produto_id='717d36ec-bc4c-46c1-a77c-b8d84d9ce779';
insert into public.cozinha_receita_itens
(receita_id,ingrediente_id,preparacao_id,gramas_personalizada,gramas_200,gramas_300,gramas_400,rendimento_quebra,observacao,ordem,operacao_producao,fator_producao)
select id,null,'cd31a741-ca66-4df2-aa91-0e17ad054050',150,0,0,0,1,'CO04 usa a mesma preparação Bife ao molho do TD16.',0,'direto',1 from public.cozinha_receitas where produto_id='bc68d9ce-53d3-4404-a407-31f4386596de';
insert into public.cozinha_receita_itens
(receita_id,ingrediente_id,preparacao_id,gramas_personalizada,gramas_200,gramas_300,gramas_400,rendimento_quebra,observacao,ordem,operacao_producao,fator_producao)
select id,null,'24651606-cf23-49e4-9a69-edb6ac187b8a',150,0,0,0,1,'CO05 usa a mesma preparação Molho Bolonhesa.',0,'direto',1 from public.cozinha_receitas where produto_id='028d7c2f-38c8-4ab5-9536-cf25b941a4d7';
insert into public.cozinha_receita_itens
(receita_id,ingrediente_id,preparacao_id,gramas_personalizada,gramas_200,gramas_300,gramas_400,rendimento_quebra,observacao,ordem,operacao_producao,fator_producao)
select r.id,null,p.id,150,0,0,0,1,'CO06 usa a mesma Carne ensopada compartilhada da Vaca Atolada.',0,'direto',1
from public.cozinha_receitas r
cross join lateral (select id from public.cozinha_preparacoes where lower(nome)=lower('Carne ensopada') limit 1) p
where r.produto_id='52132978-edb7-4f45-a531-ac6c27208e35';

delete from public.cozinha_receita_montagem_itens
where receita_id in (
 select id from public.cozinha_receitas
 where produto_id in (
 '2af58d7a-5f1e-45ac-af7d-c50992e5e617',
 '717d36ec-bc4c-46c1-a77c-b8d84d9ce779',
 'bc68d9ce-53d3-4404-a407-31f4386596de',
 '028d7c2f-38c8-4ab5-9536-cf25b941a4d7',
 '52132978-edb7-4f45-a531-ac6c27208e35'
 ));

insert into public.cozinha_receita_montagem_itens(receita_id,nome,gramas_150,gramas_200,gramas_300,gramas_400,observacao,ordem)
select id,'Molho frango desfiado',150,0,0,0,'150 g prontos',0 from public.cozinha_receitas where produto_id='2af58d7a-5f1e-45ac-af7d-c50992e5e617';
insert into public.cozinha_receita_montagem_itens(receita_id,nome,gramas_150,gramas_200,gramas_300,gramas_400,observacao,ordem)
select id,'Molho de frango ensopado',150,0,0,0,'150 g prontos da mesma preparação do TD07',0 from public.cozinha_receitas where produto_id='717d36ec-bc4c-46c1-a77c-b8d84d9ce779';
insert into public.cozinha_receita_montagem_itens(receita_id,nome,gramas_150,gramas_200,gramas_300,gramas_400,observacao,ordem)
select id,'Bife ao Molho',150,0,0,0,'150 g prontos da mesma preparação do TD16',0 from public.cozinha_receitas where produto_id='bc68d9ce-53d3-4404-a407-31f4386596de';
insert into public.cozinha_receita_montagem_itens(receita_id,nome,gramas_150,gramas_200,gramas_300,gramas_400,observacao,ordem)
select id,'Molho Bolonhesa',150,0,0,0,'150 g prontos',0 from public.cozinha_receitas where produto_id='028d7c2f-38c8-4ab5-9536-cf25b941a4d7';
insert into public.cozinha_receita_montagem_itens(receita_id,nome,gramas_150,gramas_200,gramas_300,gramas_400,observacao,ordem)
select id,'Carne ensopada',150,0,0,0,'150 g prontos da mesma carne + molho usada na Vaca Atolada',0 from public.cozinha_receitas where produto_id='52132978-edb7-4f45-a531-ac6c27208e35';
