-- Revisão das 12 sopas: receita-base escalável, água em litros e montagem única de 400 g.
-- Mantém os ingredientes já cadastrados e, portanto, seus fatores de perda/ganho e custos.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $$
declare
  v record;
  v_prep uuid;
  v_ing uuid;
begin
  for v in
    select * from (values
      ('SO01', 'Sopa de frango', 7570::numeric,
       'Refogue cebola e alho no óleo. Acrescente o frango e os legumes. Junte 4 L de água e cozinhe tampado até os legumes ficarem macios. Finalize com salsinha, ajuste o sal e pese o lote pronto.',
       'Base SO01 revisada. Rendimento de referência considera os fatores já cadastrados e 4 L de água incorporada ao caldo.'),
      ('SO02', 'Sopa de carne • SO02', 6970::numeric,
       'Sele a carne. Refogue cebola e alho no óleo, volte a carne à panela, acrescente os legumes e 4 L de água. Cozinhe até a carne e os legumes ficarem macios. Finalize com salsinha, ajuste o sal e pese o lote pronto.',
       'Base SO02 revisada. Rendimento de referência considera os fatores já cadastrados e 4 L de água incorporada ao caldo.'),
      ('SO03', 'Sopa de legumes • SO03', 3516::numeric,
       'Refogue cebola e alho no óleo. Acrescente batata, cenoura e chuchu, junte 2 L de água e cozinhe até ficarem macios. Finalize com salsinha, ajuste o sal e pese o lote pronto.',
       'Base SO03 revisada. Água cadastrada em litros; o lote escala pela quantidade planejada.'),
      ('SO04', 'sopa de feijão', 12670::numeric,
       'Cozinhe o feijão com os 6 L de água novos após o remolho, sem descartar o caldo. Bata parte dos grãos com o caldo e mantenha o restante inteiro. Refogue cebola e alho no óleo, una ao feijão, acrescente o espaguete quebrado e cozinhe. Finalize com salsinha e ajuste o sal.',
       'Base SO04 revisada. O feijão usa o ganho já cadastrado de 3,0x; água em litros.'),
      ('SO05', 'Sopa de bucho', 8569::numeric,
       'Ferva o bucho em água, descarte essa primeira água e lave. Cozinhe até ficar macio. Sele o coração; refogue cebola e alho no óleo. Una as carnes, os legumes, o demi-glace e 5 L de água. Cozinhe até os legumes ficarem macios, finalize com salsinha e ajuste o sal.',
       'Base SO05 revisada. Água de limpeza do bucho não entra na receita; entram somente os 5 L do caldo final.'),
      ('SO06', 'Canja de frango', 8320::numeric,
       'Refogue cebola e alho no óleo. Acrescente frango, batata, cenoura e chuchu. Junte 4 L de água e cozinhe até os legumes começarem a amaciar. Acrescente o arroz lavado e cozinhe até ficar macio. Finalize com salsinha e ajuste o sal.',
       'Base SO06 revisada. Arroz e demais ingredientes usam os fatores já cadastrados; água em litros.'),
      ('SO07', 'Creme de abóbora • SO07', 8053::numeric,
       'Cozinhe a carne até ficar macia e desfie. Refogue cebola e alho no óleo, acrescente a abóbora e 4 L de água. Cozinhe até desmanchar, processe até obter creme liso e volte à panela. Incorpore a carne, finalize com salsinha e ajuste o sal.',
       'Base SO07 revisada. Água em litros incorporada ao creme.'),
      ('SO08', 'Creme de mandioquinha', 10914::numeric,
       'Doure e escorra o bacon. Cozinhe o frango e desfie. Refogue cebola e alho no óleo, acrescente a mandioquinha e 4 L de água. Cozinhe até ficar macia e processe. Incorpore frango e bacon, finalize com salsinha e ajuste o sal.',
       'Base SO08 revisada conforme base confirmada: 4 kg de mandioquinha, 1,5 kg de bacon refogado, 1 kg de frango desfiado e 4 L de água.'),
      ('SO09', 'Creme de batata • SO09', 9413::numeric,
       'Cozinhe a carne até ficar macia e desfie. Refogue cebola e alho no óleo, acrescente a batata e 4 L de água. Cozinhe até a batata desmanchar, processe até formar creme liso, incorpore a carne, finalize com salsinha e ajuste o sal.',
       'Base SO09 revisada. Água em litros incorporada ao creme.'),
      ('SO10', 'Creme de aipim • SO10', 10615::numeric,
       'Cozinhe o aipim com 4 L de água até ficar macio; retire fibras e processe. Refogue cebola, alho e carne moída no óleo até a carne ficar solta. Una ao creme de aipim, finalize com salsinha e ajuste o sal.',
       'Base SO10 revisada. Água em litros incorporada ao creme.'),
      ('SO11', 'Caldo verde • SO11', 8191::numeric,
       'Doure a calabresa e escorra. Refogue cebola e alho no óleo. Acrescente batata, louro e 3,5 L de água; cozinhe até a batata ficar macia. Retire o louro, processe até formar creme, volte com a calabresa e acrescente a couve nos últimos 2 minutos. Ajuste o sal.',
       'Base SO11 revisada. Couve e calabresa usam as perdas já cadastradas; água incluída em litros.'),
      ('SO12', 'Caldo de peixe', 7034::numeric,
       'Refogue cebola e alho no óleo. Acrescente o caldo de peixe pronto, 1,5 L de água e deixe ferver. Junte a tilápia em tiras e cozinhe somente até ficar opaca e macia. Finalize com tomate e salsinha, ajuste o sal.',
       'Base SO12 revisada. Tilápia usa a perda já cadastrada; água incluída em litros.')
    ) as x(codigo, nome_prep, rendimento, modo, observacao)
  loop
    select ri.preparacao_id into v_prep
    from public.cozinha_receitas r
    join public.produtos p on p.id = r.produto_id
    join public.cozinha_receita_itens ri on ri.receita_id = r.id
    where p.nome like v.codigo || ' %' and ri.preparacao_id is not null
    order by ri.ordem
    limit 1;

    if v_prep is null then
      raise exception 'Preparação não encontrada para %', v.codigo;
    end if;

    update public.cozinha_preparacoes
       set rendimento_final_g = v.rendimento,
           modo_preparo = v.modo,
           observacao = v.observacao,
           updated_at = now()
     where id = v_prep;
  end loop;

  -- Remove somente os itens internos das doze preparações de sopa; a montagem de 400 g permanece vinculada à receita.
  delete from public.cozinha_preparacao_itens pi
   where pi.preparacao_id in (
     select ri.preparacao_id
     from public.cozinha_receitas r
     join public.produtos p on p.id=r.produto_id
     join public.cozinha_receita_itens ri on ri.receita_id=r.id
     where p.nome ~ '^SO(0[1-9]|1[0-2])' and ri.preparacao_id is not null
   );

  -- Insere os itens usando apenas ingredientes já existentes, preservando custo e perda/ganho cadastrados.
  insert into public.cozinha_preparacao_itens (preparacao_id, ingrediente_id, quantidade, rendimento_quebra, ordem, quantidade_texto)
  select prep.id, ing.id, d.quantidade, 1, d.ordem, d.texto
  from (values
    ('SO01','Peito de frango desfiado',2000::numeric,0,'2 kg de peito de frango desfiado'),('SO01','Batata inglesa',600,1,'600 g de batata inglesa em cubos'),('SO01','Cenoura',400,2,'400 g de cenoura em cubos'),('SO01','Chuchu',400,3,'400 g de chuchu em cubos'),('SO01','Cebola',200,4,'200 g de cebola picada'),('SO01','Alho',60,5,'60 g de alho picado'),('SO01','Óleo de soja',80,6,'80 g de óleo de soja'),('SO01','Salsinha',50,7,'50 g de salsinha picada'),('SO01','Sal',100,8,'100 g de sal'),('SO01','Água',4,9,'4 L de água filtrada'),
    ('SO02','Carne bovina em cubos pequenos',2000,0,'2 kg de carne bovina em cubos pequenos'),('SO02','Batata inglesa',600,1,'600 g de batata inglesa em cubos'),('SO02','Cenoura',400,2,'400 g de cenoura em cubos'),('SO02','Chuchu',400,3,'400 g de chuchu em cubos'),('SO02','Cebola',200,4,'200 g de cebola picada'),('SO02','Alho',60,5,'60 g de alho picado'),('SO02','Óleo de soja',80,6,'80 g de óleo de soja'),('SO02','Salsinha',50,7,'50 g de salsinha picada'),('SO02','Sal',100,8,'100 g de sal'),('SO02','Água',4,9,'4 L de água filtrada'),
    ('SO03','Batata inglesa',600,0,'600 g de batata inglesa em cubos'),('SO03','Cenoura',400,1,'400 g de cenoura em cubos'),('SO03','Chuchu',400,2,'400 g de chuchu em cubos'),('SO03','Cebola',200,3,'200 g de cebola picada'),('SO03','Alho',60,4,'60 g de alho picado'),('SO03','Óleo de soja',80,5,'80 g de óleo de soja'),('SO03','Salsinha',50,6,'50 g de salsinha picada'),('SO03','Sal',100,7,'100 g de sal'),('SO03','Água',2,8,'2 L de água filtrada'),
    ('SO04','Feijão Preto',2000,0,'2 kg de feijão preto seco'),('SO04','Cebola',200,1,'200 g de cebola picada'),('SO04','Alho',60,2,'60 g de alho picado'),('SO04','Macarrão espaguete',300,3,'300 g de espaguete quebrado'),('SO04','Óleo de soja',80,4,'80 g de óleo de soja'),('SO04','Salsinha',50,5,'50 g de salsinha picada'),('SO04','Sal',100,6,'100 g de sal'),('SO04','Água',6,7,'6 L de água filtrada'),
    ('SO05','Bucho bovino em tiras',2000,0,'2 kg de bucho bovino em tiras'),('SO05','Coração de boi em cubos pequenos',1000,1,'1 kg de coração bovino em cubos pequenos'),('SO05','Batata inglesa',500,2,'500 g de batata inglesa em cubos'),('SO05','Cenoura',500,3,'500 g de cenoura em cubos'),('SO05','Pimentão em cubos pequenos',100,4,'100 g de pimentão em cubos'),('SO05','Cebola',200,5,'200 g de cebola picada'),('SO05','Alho',60,6,'60 g de alho picado'),('SO05','Demi glace',100,7,'100 g de demi-glace'),('SO05','Óleo de soja',80,8,'80 g de óleo de soja'),('SO05','Salsinha',50,9,'50 g de salsinha picada'),('SO05','Sal',100,10,'100 g de sal'),('SO05','Água',5,11,'5 L de água filtrada'),
    ('SO06','Peito de frango desfiado',2000,0,'2 kg de peito de frango desfiado'),('SO06','Batata inglesa',600,1,'600 g de batata inglesa em cubos'),('SO06','Cenoura',400,2,'400 g de cenoura em cubos'),('SO06','Chuchu',400,3,'400 g de chuchu em cubos'),('SO06','Arroz Branco Parboilizado',310,4,'310 g de arroz branco parboilizado cru'),('SO06','Cebola',200,5,'200 g de cebola picada'),('SO06','Alho',60,6,'60 g de alho picado'),('SO06','Óleo de soja',80,7,'80 g de óleo de soja'),('SO06','Salsinha',50,8,'50 g de salsinha picada'),('SO06','Sal',100,9,'100 g de sal'),('SO06','Água',4,10,'4 L de água filtrada'),
    ('SO07','Abóbora paulista',4000,0,'4 kg de abóbora paulista em cubos'),('SO07','Carne desfiada',1500,1,'1,5 kg de carne desfiada'),('SO07','Cebola',200,2,'200 g de cebola picada'),('SO07','Alho',60,3,'60 g de alho picado'),('SO07','Óleo de soja',80,4,'80 g de óleo de soja'),('SO07','Salsinha',50,5,'50 g de salsinha picada'),('SO07','Sal',100,6,'100 g de sal'),('SO07','Água',4,7,'4 L de água filtrada'),
    ('SO08','Mandioquinha em cubos',4000,0,'4 kg de mandioquinha em cubos'),('SO08','Bacon em cubos refogado',1500,1,'1,5 kg de bacon em cubos refogado'),('SO08','Cebola',200,2,'200 g de cebola picada'),('SO08','Frango desfiado',1000,3,'1 kg de frango desfiado'),('SO08','Alho',60,4,'60 g de alho picado'),('SO08','Óleo de soja',50,5,'50 g de óleo de soja'),('SO08','Salsinha',50,6,'50 g de salsinha picada'),('SO08','Sal',100,7,'100 g de sal'),('SO08','Água',4,8,'4 L de água filtrada'),
    ('SO09','Batata inglesa',4000,0,'4 kg de batata inglesa em cubos'),('SO09','Carne desfiada',1500,1,'1,5 kg de carne desfiada'),('SO09','Cebola',200,2,'200 g de cebola picada'),('SO09','Alho',60,3,'60 g de alho picado'),('SO09','Óleo de soja',80,4,'80 g de óleo de soja'),('SO09','Salsinha',50,5,'50 g de salsinha picada'),('SO09','Sal',100,6,'100 g de sal'),('SO09','Água',4,7,'4 L de água filtrada'),
    ('SO10','Aipim',4000,0,'4 kg de aipim em cubos'),('SO10','Carne moída',1500,1,'1,5 kg de carne moída'),('SO10','Cebola',300,2,'300 g de cebola picada'),('SO10','Alho',60,3,'60 g de alho picado'),('SO10','Óleo de soja',80,4,'80 g de óleo de soja'),('SO10','Salsinha',50,5,'50 g de salsinha picada'),('SO10','Sal',100,6,'100 g de sal'),('SO10','Água',4,7,'4 L de água filtrada'),
    ('SO11','Batata inglesa',4000,0,'4 kg de batata inglesa em cubos'),('SO11','Cebola',100,1,'100 g de cebola picada'),('SO11','Alho',10,2,'10 g de alho picado'),('SO11','Calabresa',400,3,'400 g de calabresa em rodelas'),('SO11','Couve manteiga',250,4,'250 g de couve manteiga em tiras'),('SO11','Óleo de soja',80,5,'80 g de óleo de soja'),('SO11','Louro',3,6,'3 folhas de louro'),('SO11','Sal',100,7,'100 g de sal'),('SO11','Água',3.5,8,'3,5 L de água filtrada'),
    ('SO12','Caldo de peixe rancho bom',4000,0,'4 kg de caldo de peixe Rancho Bom'),('SO12','Tilápia em tiras',400,1,'400 g de tilápia em tiras'),('SO12','Tomate',500,2,'500 g de tomate em cubos'),('SO12','Cebola',200,3,'200 g de cebola picada'),('SO12','Alho',40,4,'40 g de alho picado'),('SO12','Óleo de soja',50,5,'50 g de óleo de soja'),('SO12','Salsinha',50,6,'50 g de salsinha picada'),('SO12','Sal',100,7,'100 g de sal'),('SO12','Água',1.5,8,'1,5 L de água filtrada')
  ) as d(codigo, ingrediente, quantidade, ordem, texto)
  join lateral (
    select ri.preparacao_id id
    from public.cozinha_receitas r join public.produtos p on p.id=r.produto_id join public.cozinha_receita_itens ri on ri.receita_id=r.id
    where p.nome like d.codigo || ' %' and ri.preparacao_id is not null
    order by ri.ordem limit 1
  ) prep on true
  join public.cozinha_ingredientes ing on lower(ing.nome)=lower(d.ingrediente);

  -- As sopas usam somente sua preparação pronta na montagem: 400 g por unidade.
  update public.cozinha_receita_itens ri
     set gramas_200=0, gramas_300=0, gramas_400=400, gramas_personalizada=0,
         rendimento_quebra=1, ordem=0, observacao='400 g de sopa pronta por pote'
   where ri.preparacao_id in (
     select ri2.preparacao_id from public.cozinha_receitas r join public.produtos p on p.id=r.produto_id join public.cozinha_receita_itens ri2 on ri2.receita_id=r.id
      where p.nome ~ '^SO(0[1-9]|1[0-2])' and ri2.preparacao_id is not null
   );

  update public.cozinha_receitas r
     set rendimento_observacao='Sopa de 400 g: a montagem usa 400 g da preparação pronta; a receita-base escala proporcionalmente no planejamento.',
         updated_at=now()
    from public.produtos p
   where p.id=r.produto_id and p.nome ~ '^SO(0[1-9]|1[0-2])';
end $$;
