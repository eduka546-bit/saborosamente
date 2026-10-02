-- Revisão SO08, TD02, TD12 e TD25: montagem -> preparo pronto -> ingredientes.
-- Bases e rendimentos operacionais atuais preservados; 6,7 kg da SO08 não é rendimento pesado.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);

-- As etiquetas nutricionais atuais são a referência; triggers legados não devem
-- sobrescrevê-las ao substituir linhas importadas por preparações estruturadas.
create temporary table revisao_produtos_0210 on commit drop as
select id,tabela_nutricional,tabela_nutricional_200g,tabela_nutricional_300g,
tabela_nutricional_400g,informacao_nutricional from produtos
where id in ('83187e77-b40c-4156-847b-86be852b50b8','d18afb7f-efe5-445e-bb3d-d1e7876a2267',
'e797b80a-da8e-40dd-8452-6eafd7bd08cb','fe6ba5ff-2c72-4b9f-9e0e-fbe9414cf8bb');

-- Fonte da montagem explícita para cada preparo, sem inferência por nome aproximado.
with vinculos(receita_id,preparacao_id,montagem_id) as (values
('efc676c3-cb92-4244-9b53-db6bcda0186d'::uuid,'1d2997d2-0cd9-4f17-9922-c7c1325ec407'::uuid,'4e320b21-9e13-4ebb-94f8-6b1112382b8d'::uuid),
('efc676c3-cb92-4244-9b53-db6bcda0186d','120ba208-e38c-4807-8529-15eeb95cb030','6d803f07-47d2-4aaf-bed0-01e1215f1403'),
('efc676c3-cb92-4244-9b53-db6bcda0186d','37e5b7cc-4e45-4a3d-bdb1-eb71e922157a','85cbc2c5-1787-4fe0-a3e2-b209bd59fb93'),
('efc676c3-cb92-4244-9b53-db6bcda0186d','75b7becb-1c43-4c76-8b57-92f19404c5c7','125ff8a3-49d4-4fb4-a17b-b11bd434fb5f'),
('24a5d45b-3b68-44de-87af-2ddbee1bf8ee','75f87903-3703-4550-940e-f20db9a66fcb','3eb2b734-a416-417c-a389-e9d7409ba656'),
('24a5d45b-3b68-44de-87af-2ddbee1bf8ee','6839dd0d-d60f-4054-a7ee-8f046c5a85ac','1f8cbcee-c910-47fb-8c6a-8f4cdb98c753'),
('4d2cd731-eb08-44a5-9d7a-4bd9008739c7','1d2997d2-0cd9-4f17-9922-c7c1325ec407','7040115c-2276-411a-89b7-4e359f547c78'),
('4d2cd731-eb08-44a5-9d7a-4bd9008739c7','37e5b7cc-4e45-4a3d-bdb1-eb71e922157a','53522b26-eb91-452e-96c9-3393eb870da4'))
update cozinha_receita_itens ri
set gramas_200=m.gramas_200,gramas_300=m.gramas_300,gramas_400=m.gramas_400,
rendimento_quebra=1,observacao='Peso pronto conforme a montagem; ingredientes calculados pelo preparo compartilhado.'
from vinculos v join cozinha_receita_montagem_itens m on m.id=v.montagem_id
where ri.receita_id=v.receita_id and ri.preparacao_id=v.preparacao_id;

-- A linha de sassami não era coberta pela preparação que usa peito desfiado,
-- por isso permanecia como ingrediente extra (dupla contagem).
update cozinha_receita_itens
set ingrediente_id='4f8abc35-bfaa-4d7a-8bc1-5d31c66ee6ee',
observacao='Peito de frango desfiado; contabilizado no Molho frango desfiado compartilhado.'
where id='63f155b1-fc08-4ee7-9e9d-cdb010d3369b'
and ingrediente_id='f3459aa8-8686-473f-8e4b-5560bf2d9b9b';

-- Remove apenas ingredientes já cobertos pelos preparos destas três receitas.
-- Ingredientes complementares sem cobertura são preservados.
with recursive arvore as (
select ri.receita_id,ri.preparacao_id,array[ri.preparacao_id] caminho
from cozinha_receita_itens ri
where ri.receita_id in ('efc676c3-cb92-4244-9b53-db6bcda0186d','24a5d45b-3b68-44de-87af-2ddbee1bf8ee','4d2cd731-eb08-44a5-9d7a-4bd9008739c7')
and ri.preparacao_id is not null
union all
select a.receita_id,pi.preparacao_componente_id,a.caminho||pi.preparacao_componente_id
from arvore a join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id
where pi.preparacao_componente_id is not null and not pi.preparacao_componente_id=any(a.caminho)
), cobertos as (
select distinct a.receita_id,pi.ingrediente_id from arvore a
join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id
where pi.ingrediente_id is not null)
delete from cozinha_receita_itens ri using cobertos c
where ri.receita_id=c.receita_id and ri.ingrediente_id=c.ingrediente_id;

-- Espaguete e muçarela: pesos prontos da montagem, não os valores antigos importados.
update cozinha_receita_itens ri set gramas_200=m.gramas_200,gramas_300=m.gramas_300,
gramas_400=m.gramas_400,observacao='Peso pronto conforme a montagem atual.'
from cozinha_receita_montagem_itens m
where (ri.id='cd9d30fc-ed61-48b4-98a6-3d9c6cfa3d0d' and m.id='7274cdae-9307-4fde-bab1-1fc6c6a9930d')
or (ri.id='6428a04e-8a13-4dc9-9729-2af21fb5f8f2' and m.id='0e60599f-973c-4ea7-8fbb-fd1948c0c5da');

-- Água de cocção do espaguete em L: 10 L/kg de massa seca, descartada depois.
update cozinha_receita_itens ri set
gramas_200=round(m.gramas_200/i.fator_rendimento/100,6),
gramas_300=round(m.gramas_300/i.fator_rendimento/100,6),
gramas_400=round(m.gramas_400/i.fator_rendimento/100,6),
observacao='Litros de água de cocção: 10 L/kg de espaguete seco; escorrer, não compõe o peso da marmita.'
from cozinha_receita_montagem_itens m,cozinha_ingredientes i
where ri.id='9098fbf6-8ca2-4f61-9fdd-a15d184f219e'
and m.id='7274cdae-9307-4fde-bab1-1fc6c6a9930d'
and i.id='02c4f11a-7d61-4956-9739-edfbff87622c';

update cozinha_receita_itens set gramas_200=0,gramas_300=0,gramas_400=0,
observacao='QB · salsinha para finalizar, conforme a montagem.'
where receita_id in ('efc676c3-cb92-4244-9b53-db6bcda0186d','4d2cd731-eb08-44a5-9d7a-4bd9008739c7')
and ingrediente_id='7ae45021-073b-41c7-b5ce-5c523b0fd5ec';

-- Orégano já está nas montagens como QB, mas faltava no cadastro de ingredientes.
insert into cozinha_ingredientes(nome,unidade_medida,observacao,ativo)
select 'Orégano','g','QB · finalização dos pratos TD02 e TD25; custo e quantidade não pesados.',true
where not exists (select 1 from cozinha_ingredientes where translate(lower(nome),'éê','ee')='oregano');
insert into cozinha_receita_itens(receita_id,ingrediente_id,gramas_200,gramas_300,gramas_400,observacao,ordem)
select r.id,i.id,0,0,0,'QB · orégano para finalizar, conforme a montagem.',99
from cozinha_receitas r cross join cozinha_ingredientes i
where r.id in ('efc676c3-cb92-4244-9b53-db6bcda0186d','4d2cd731-eb08-44a5-9d7a-4bd9008739c7')
and translate(lower(i.nome),'éê','ee')='oregano'
and not exists(select 1 from cozinha_receita_itens ri where ri.receita_id=r.id and ri.ingrediente_id=i.id);

-- Creme: manter a base confirmada (4 kg mandioquinha, 1,5 kg bacon pronto,
-- 200 g cebola, 1 kg frango desfiado); nenhum rendimento real foi informado.
update cozinha_receita_montagem_itens set nome='Creme de mandioquinha',updated_at=now()
where id='b309e8e0-ac33-4072-98d5-0165c145a620';
update cozinha_receitas set ingredientes='[]'::jsonb,
rendimento_observacao='Base confirmada: 4 kg de mandioquinha, 1,5 kg de bacon refogado, 200 g de cebola e 1 kg de frango desfiado. Os 6,7 kg cadastrados somam ingredientes, não comprovam rendimento pronto. Água atual: 4 L, incorporada ao creme; pesar o lote pronto para calibrar porções e custos.',
updated_at=now() where id='1638c245-2d67-4111-bb59-b4efb715ccb7';
update cozinha_preparacoes set observacao='Base SO08 confirmada em 02/10/2026. RENDIMENTO A CONFERIR: 6.700 g são a soma da base sem os 4 L de água incorporada. Pesar o creme pronto; não presumir que 10.700 g sejam rendimento final (há evaporação).',
updated_at=now() where id='9afd3ed0-39aa-4e9f-b00c-616f80169cfc';

-- Recalcular a descrição pública com TODOS os ingredientes dos subpreparos.
with recursive arvore as (
select r.produto_id,ri.preparacao_id,array[ri.preparacao_id] caminho
from cozinha_receitas r join cozinha_receita_itens ri on ri.receita_id=r.id
where r.produto_id in (select id from revisao_produtos_0210) and ri.preparacao_id is not null
union all
select a.produto_id,pi.preparacao_componente_id,a.caminho||pi.preparacao_componente_id
from arvore a join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id
where pi.preparacao_componente_id is not null and not pi.preparacao_componente_id=any(a.caminho)
), ids as (
select r.produto_id,ri.ingrediente_id from cozinha_receitas r join cozinha_receita_itens ri on ri.receita_id=r.id
where r.produto_id in (select id from revisao_produtos_0210) and ri.ingrediente_id is not null
union
select a.produto_id,pi.ingrediente_id from arvore a join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id where pi.ingrediente_id is not null
), listas as (
select ids.produto_id,string_agg(distinct public.normalizar_ingrediente_publico(i.nome),', ' order by public.normalizar_ingrediente_publico(i.nome)) texto
from ids join cozinha_ingredientes i on i.id=ids.ingrediente_id and i.ativo=true group by ids.produto_id)
update produtos p set ingredientes=l.texto,updated_at=now() from listas l where p.id=l.produto_id;
update produtos p set tabela_nutricional=b.tabela_nutricional,tabela_nutricional_200g=b.tabela_nutricional_200g,
tabela_nutricional_300g=b.tabela_nutricional_300g,tabela_nutricional_400g=b.tabela_nutricional_400g,
informacao_nutricional=b.informacao_nutricional from revisao_produtos_0210 b where p.id=b.id;
commit;

-- Panquecas TD21/TD22: proporções confirmadas pelo usuário em 02/10/2026.
-- 300 g: 60 g embaixo + 2 recheios de 60 g + 60 g em cima = 240 g de molho pronto;
-- 50 g de massa e 10 g de muçarela. Mesmas proporções em 200/400 g.
-- Contagem dos discos: 1/2/3. A lista de ingredientes da massa usa lote de 30 discos/8 ovos.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
create temporary table revisao_panquecas_nutricao on commit drop as
select id,tabela_nutricional,tabela_nutricional_200g,tabela_nutricional_300g,
tabela_nutricional_400g,informacao_nutricional from produtos
where id in ('6dcf57b4-1678-4391-a696-f38a097e3bcb')
or id in (select produto_id from cozinha_receitas where id='89748be6-852f-4fc1-a0a5-5c4dce8b0fd4');

update cozinha_receita_montagem_itens set nome='Massa panqueca',gramas_200=33.333,gramas_300=50,
gramas_400=66.667,ordem=1,observacao='1/2/3 discos nos tamanhos 200/300/400 g. Massa unitária aproximadamente 25–30 g; ajustar o peso total das massas para manter as porcentagens e fechar a porção.',updated_at=now()
where id in ('0a7e1c6c-d374-49cb-a9f9-c22d4c23189c','de04f9d8-8ce7-4b42-a2b1-a4c7295b391c');
update cozinha_receita_montagem_itens set gramas_200=160,gramas_300=240,gramas_400=320,ordem=0,
observacao='Peso TOTAL do molho pronto (base + recheio + cobertura). 200 g: 40 g embaixo, 80 g dentro, 40 g em cima. 300 g: 60 g embaixo, 60 g em cada uma das 2 panquecas, 60 g em cima. 400 g: 80 g embaixo, 160 g divididos entre as 3 panquecas, 80 g em cima.',updated_at=now()
where id in ('9eede849-dcaf-4a4f-b4e9-b54469ea5b30','f03e3821-813c-44d6-aba1-ed9cf4c934aa');
update cozinha_receita_montagem_itens set gramas_200=6.667,gramas_300=10,gramas_400=13.333,
ordem=2,observacao='Muçarela para completar a porção, mantendo a proporção da referência de 300 g.',updated_at=now()
where id in ('53bdd326-5423-4457-bf27-3f0f188539bb','8d6089df-67bc-41fc-afa8-2556a57e006e');

update cozinha_receita_itens set gramas_200=33.333,gramas_300=50,gramas_400=66.667,
observacao='Peso pronto na montagem. Produção da massa: calcular por CONTAGEM, 1/2/3 discos; lote de 30 discos = 8 ovos.'
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
and preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541';
update cozinha_receita_itens set gramas_200=160,gramas_300=240,gramas_400=320,
observacao='Molho pronto TOTAL: embaixo + recheio + cobertura; expandir o MESMO preparo compartilhado.'
where (receita_id='7e442f97-a6f6-4419-8071-0421b3ae7c40' and preparacao_id='24651606-cf23-49e4-9a69-edb6ac187b8a')
or (receita_id='89748be6-852f-4fc1-a0a5-5c4dce8b0fd4' and preparacao_id='75f87903-3703-4550-940e-f20db9a66fcb');
update cozinha_receita_itens set gramas_200=6.667,gramas_300=10,gramas_400=13.333
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
and ingrediente_id='7f572b54-09a4-4d30-8275-502adff73413';
update cozinha_receita_itens set gramas_200=0,gramas_300=0,gramas_400=0,observacao='QB · finalização.'
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4')
and ingrediente_id='7ae45021-073b-41c7-b5ce-5c523b0fd5ec';

with recursive arvore as (
select ri.receita_id,ri.preparacao_id,array[ri.preparacao_id] caminho from cozinha_receita_itens ri
where receita_id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4') and preparacao_id is not null
union all
select a.receita_id,pi.preparacao_componente_id,a.caminho||pi.preparacao_componente_id
from arvore a join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id
where pi.preparacao_componente_id is not null and not pi.preparacao_componente_id=any(a.caminho)
), cobertos as (
select distinct a.receita_id,pi.ingrediente_id from arvore a join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id where pi.ingrediente_id is not null)
delete from cozinha_receita_itens ri using cobertos c where ri.receita_id=c.receita_id and ri.ingrediente_id=c.ingrediente_id;

update cozinha_receitas set ingredientes='[]'::jsonb,
rendimento_observacao='Montagem confirmada em 02/10/2026: 80% molho/recheio pronto, 16,6667% massas prontas e 3,3333% muçarela. Usar 1/2/3 discos por porção de 200/300/400 g; conferir o peso total das massas na balança. Receita da massa escalada por contagem (8 ovos = 30 discos).',
updated_at=now() where id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4');
update cozinha_preparacao_itens set quantidade_aproximada=4
where id='52c5542a-5f31-455a-a5ce-a6002105fce6' and quantidade=32
and aproximacao_observacao like '%8 g%';

with recursive arvore as (
select r.produto_id,ri.preparacao_id,array[ri.preparacao_id] caminho from cozinha_receitas r join cozinha_receita_itens ri on ri.receita_id=r.id
where r.id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4') and ri.preparacao_id is not null
union all select a.produto_id,pi.preparacao_componente_id,a.caminho||pi.preparacao_componente_id
from arvore a join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id
where pi.preparacao_componente_id is not null and not pi.preparacao_componente_id=any(a.caminho)
), ids as (
select r.produto_id,ri.ingrediente_id from cozinha_receitas r join cozinha_receita_itens ri on ri.receita_id=r.id
where r.id in ('7e442f97-a6f6-4419-8071-0421b3ae7c40','89748be6-852f-4fc1-a0a5-5c4dce8b0fd4') and ri.ingrediente_id is not null
union select a.produto_id,pi.ingrediente_id from arvore a join cozinha_preparacao_itens pi on pi.preparacao_id=a.preparacao_id where pi.ingrediente_id is not null
), listas as (
select ids.produto_id,string_agg(distinct public.normalizar_ingrediente_publico(i.nome),', ' order by public.normalizar_ingrediente_publico(i.nome)) texto
from ids join cozinha_ingredientes i on i.id=ids.ingrediente_id and i.ativo=true group by ids.produto_id)
update produtos p set ingredientes=l.texto,updated_at=now() from listas l where p.id=l.produto_id;
update produtos p set tabela_nutricional=b.tabela_nutricional,tabela_nutricional_200g=b.tabela_nutricional_200g,
tabela_nutricional_300g=b.tabela_nutricional_300g,tabela_nutricional_400g=b.tabela_nutricional_400g,
informacao_nutricional=b.informacao_nutricional from revisao_panquecas_nutricao b where p.id=b.id;
commit;
-- Complementos presentes no modo de preparo, sem inventar quantidades.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
insert into cozinha_ingredientes(nome,unidade_medida,observacao,ativo)
select 'Pimenta','g','A gosto; quantidade operacional ainda não medida.',true
where not exists(select 1 from cozinha_ingredientes where lower(nome)='pimenta');
with faltantes(preparacao_id,ingrediente_id,texto) as (values
('6839dd0d-d60f-4054-a7ee-8f046c5a85ac'::uuid,'3ae1b700-b656-4b7b-b9e7-c283225ed037'::uuid,'QB · sal para acertar o purê'),
('120ba208-e38c-4807-8529-15eeb95cb030','3ae1b700-b656-4b7b-b9e7-c283225ed037','QB · sal na água de cocção'),
('120ba208-e38c-4807-8529-15eeb95cb030','9ee3e0d5-5239-4396-9f0d-b8ab1556c9da','QB · água de cocção, descartada'),
('120ba208-e38c-4807-8529-15eeb95cb030','10c388fa-db0f-4a7b-92c4-7e20c04029ee','QB · óleo para fritura por imersão; consumo precisa ser medido'))
insert into cozinha_preparacao_itens(preparacao_id,ingrediente_id,quantidade,quantidade_texto,ordem)
select f.preparacao_id,f.ingrediente_id,0,f.texto,99 from faltantes f
where not exists(select 1 from cozinha_preparacao_itens p where p.preparacao_id=f.preparacao_id and p.ingrediente_id=f.ingrediente_id);
insert into cozinha_preparacao_itens(preparacao_id,ingrediente_id,quantidade,quantidade_texto,ordem)
select '37e5b7cc-4e45-4a3d-bdb1-eb71e922157a',i.id,0,'QB · pimenta para acertar o molho',99 from cozinha_ingredientes i
where lower(i.nome)='pimenta' and not exists(select 1 from cozinha_preparacao_itens p where p.preparacao_id='37e5b7cc-4e45-4a3d-bdb1-eb71e922157a' and p.ingrediente_id=i.id);
commit;
