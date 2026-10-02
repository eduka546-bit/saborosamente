-- Pesos de massa e queijo corrigidos pelo usuário em 02/10/2026.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
create temporary table preservar_nutricional_panquecas on commit drop as
select p.id,p.tabela_nutricional,p.tabela_nutricional_200g,p.tabela_nutricional_300g,p.tabela_nutricional_400g,p.informacao_nutricional from produtos p join cozinha_receitas r on r.produto_id=p.id
where r.id in ('89748be6-852f-4fc1-a0a5-5c4dce8b0fd4','7e442f97-a6f6-4419-8071-0421b3ae7c40');
update cozinha_receita_montagem_itens set gramas_200=25,gramas_300=50,gramas_400=75,
observacao='1/2/3 discos de 25 g nos tamanhos 200/300/400 g. Lote de 30 discos = 8 ovos.',updated_at=now()
where id in ('0a7e1c6c-d374-49cb-a9f9-c22d4c23189c','de04f9d8-8ce7-4b42-a2b1-a4c7295b391c');
update cozinha_receita_montagem_itens set gramas_200=5,gramas_300=10,gramas_400=15,
observacao='Muçarela: 5 g por panqueca, conforme informado em 02/10/2026.',updated_at=now()
where id in ('53bdd326-5423-4457-bf27-3f0f188539bb','8d6089df-67bc-41fc-afa8-2556a57e006e');
update cozinha_receita_montagem_itens set gramas_200=170,gramas_300=240,gramas_400=310,
observacao='Molho pronto TOTAL (base + recheio + cobertura) para completar 200/300/400 g após descontar massa e muçarela. Referência 300 g: 60 g embaixo, 60 g dentro de cada uma das 2 panquecas, 60 g em cima.',updated_at=now()
where id in ('9eede849-dcaf-4a4f-b4e9-b54469ea5b30','f03e3821-813c-44d6-aba1-ed9cf4c934aa');
update cozinha_receita_itens set gramas_200=25,gramas_300=50,gramas_400=75
where receita_id in ('89748be6-852f-4fc1-a0a5-5c4dce8b0fd4','7e442f97-a6f6-4419-8071-0421b3ae7c40') and preparacao_id='c8a64eec-81aa-4a6e-8056-ee86cec72541';
update cozinha_receita_itens set gramas_200=5,gramas_300=10,gramas_400=15
where receita_id in ('89748be6-852f-4fc1-a0a5-5c4dce8b0fd4','7e442f97-a6f6-4419-8071-0421b3ae7c40') and ingrediente_id='7f572b54-09a4-4d30-8275-502adff73413';
update cozinha_receita_itens set gramas_200=170,gramas_300=240,gramas_400=310
where (receita_id='7e442f97-a6f6-4419-8071-0421b3ae7c40' and preparacao_id='24651606-cf23-49e4-9a69-edb6ac187b8a') or (receita_id='89748be6-852f-4fc1-a0a5-5c4dce8b0fd4' and preparacao_id='75f87903-3703-4550-940e-f20db9a66fcb');
update cozinha_receitas set rendimento_observacao='Montagem confirmada em 02/10/2026: 1/2/3 panquecas; massa 25/50/75 g; muçarela 5/10/15 g; molho pronto total 170/240/310 g para fechar a porção.',updated_at=now()
where id in ('89748be6-852f-4fc1-a0a5-5c4dce8b0fd4','7e442f97-a6f6-4419-8071-0421b3ae7c40');
update produtos p set tabela_nutricional=b.tabela_nutricional,tabela_nutricional_200g=b.tabela_nutricional_200g,tabela_nutricional_300g=b.tabela_nutricional_300g,tabela_nutricional_400g=b.tabela_nutricional_400g,informacao_nutricional=b.informacao_nutricional from preservar_nutricional_panquecas b where p.id=b.id;
commit;