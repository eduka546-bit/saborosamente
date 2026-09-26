-- Medidas operacionais aproximadas + controle financeiro operacional.
-- 2026-09-26

alter table public.cozinha_preparacao_itens
  add column if not exists quantidade_aproximada numeric,
  add column if not exists unidade_aproximada text,
  add column if not exists aproximacao_observacao text;

comment on column public.cozinha_preparacao_itens.quantidade_aproximada is
  'Quantidade operacional aproximada em medida caseira/comercial, sem substituir a quantidade exata.';
comment on column public.cozinha_preparacao_itens.unidade_aproximada is
  'Unidade flexível para leitura da cozinha: maço, xícara, colher de sopa, bandeja, unidade etc.';
comment on column public.cozinha_preparacao_itens.aproximacao_observacao is
  'Referência/observação da conversão aproximada, editável conforme a realidade da cozinha.';

update public.cozinha_preparacao_itens
set quantidade=250,
    quantidade_texto='250 g de couve manteiga em tiras',
    quantidade_aproximada=1,
    unidade_aproximada='maço',
    aproximacao_observacao='Referência inicial: 1 maço ≈ 250 g. Ajustar conforme o fornecedor/maço real da SaborosaMente.'
where id='4199cedf-3f0b-40c5-95c7-6009baa32869';

update public.cozinha_preparacao_itens
set quantidade_aproximada=1,
    unidade_aproximada='maço/bandeja',
    aproximacao_observacao='Referência atual da ficha: 300 g por maço/bandeja. Editável conforme fornecedor.'
where id='d6c7dd10-48f3-4a38-9463-66e1b7c57ef1';

update public.cozinha_preparacao_itens
set quantidade_aproximada=1,
    unidade_aproximada='bandeja',
    aproximacao_observacao='Referência atual da ficha: 20 g por bandeja. Editável conforme fornecedor.'
where id='aae076f5-0ec2-43f5-900b-522d8c81e658';

update public.cozinha_preparacao_itens
set quantidade=8,
    quantidade_texto='8 g de óleo de soja',
    quantidade_aproximada=1,
    unidade_aproximada='colher de sopa rasa',
    aproximacao_observacao='Referência TBCA: 1 colher de sopa rasa de óleo de soja ≈ 8 g.'
where id='52c5542a-5f31-455a-a5ce-a6002105fce6';

update public.cozinha_preparacao_itens
set ingrediente_id='381f633b-3a64-46dc-b184-547029bea84e',
    quantidade=370,
    quantidade_texto='370 g de arroz branco parboilizado cru',
    quantidade_aproximada=2,
    unidade_aproximada='xícaras',
    aproximacao_observacao='Regra da ficha: 1/2 xícara por litro de caldo. Para 4 L: 2 xícaras. Referência inicial ≈185 g/xícara; ajustar à xícara real da cozinha.'
where id='e7d48faf-ea0f-4802-b922-c2e166754710';

delete from public.cozinha_estoque
where ingrediente_id='a2803a23-0a79-49d6-a446-2af7694c4222'
  and coalesce(quantidade_atual,0)=0 and coalesce(quantidade_minima,0)=0;
delete from public.cozinha_ingredientes
where id='a2803a23-0a79-49d6-a446-2af7694c4222'
  and not exists (select 1 from public.cozinha_preparacao_itens where ingrediente_id='a2803a23-0a79-49d6-a446-2af7694c4222')
  and not exists (select 1 from public.cozinha_receita_itens where ingrediente_id='a2803a23-0a79-49d6-a446-2af7694c4222');

create table if not exists public.financeiro_despesas_operacionais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  categoria text not null default 'operacional',
  valor_mensal numeric not null default 0 check (valor_mensal >= 0),
  ativo boolean not null default true,
  ordem integer not null default 0,
  observacao text,
  origem text not null default 'manual',
  financeiro_lancamento_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.financeiro_despesas_operacionais enable row level security;
drop policy if exists "admin gerencia despesas operacionais" on public.financeiro_despesas_operacionais;
create policy "admin gerencia despesas operacionais"
on public.financeiro_despesas_operacionais
for all to authenticated
using (has_role(auth.uid(),'admin'::app_role))
with check (has_role(auth.uid(),'admin'::app_role));

create table if not exists public.financeiro_mix_operacional (
  chave text primary key,
  nome text not null,
  percentual numeric not null default 0 check (percentual >= 0 and percentual <= 100),
  ordem integer not null default 0,
  ativo boolean not null default true,
  observacao text,
  updated_at timestamptz not null default now()
);

alter table public.financeiro_mix_operacional enable row level security;
drop policy if exists "admin gerencia mix operacional" on public.financeiro_mix_operacional;
create policy "admin gerencia mix operacional"
on public.financeiro_mix_operacional
for all to authenticated
using (has_role(auth.uid(),'admin'::app_role))
with check (has_role(auth.uid(),'admin'::app_role));

insert into public.financeiro_despesas_operacionais(nome,categoria,valor_mensal,ordem,observacao)
values
('Marketing','Marketing',2000,10,null),
('Aluguel Loja','Loja',1500,20,null),
('Condomínio Loja','Loja',200,30,'Água da loja incluída no condomínio.'),
('Aluguel Cozinha','Cozinha',1000,40,null),
('Luz Loja','Loja',1200,50,null),
('Luz Cozinha','Cozinha',500,60,null),
('Água Cozinha','Cozinha',100,70,null),
('Funcionários','Pessoal',5800,80,null),
('Contador','Administrativo',400,90,null),
('Internet e Celular','Administrativo',400,100,null),
('Sistema','Administrativo',200,110,null),
('Gastos Gerais','Operacional',2000,120,null),
('Contas','Operacional',4000,130,null),
('Impostos','Tributos',0,140,'Zerado por enquanto.'),
('Salário Vinícius','Pró-labore',5000,150,null),
('Caixa','Reserva',0,160,'Valor reservado para permanecer em caixa na SaborosaMente.')
on conflict (nome) do update
set categoria=excluded.categoria,
    valor_mensal=excluded.valor_mensal,
    ordem=excluded.ordem,
    observacao=excluded.observacao,
    updated_at=now();

insert into public.financeiro_mix_operacional(chave,nome,percentual,ordem,observacao)
values
('marmita_200','Marmitas 200g',15,10,'Participação esperada nas vendas.'),
('marmita_300','Marmitas 300g',37,20,'Participação esperada nas vendas.'),
('marmita_400','Marmitas 400g',28,30,'Participação esperada nas vendas.'),
('sopa','Sopas',15,40,'Participação esperada nas vendas.'),
('complemento_150','Complementos 150g',5,50,'Participação esperada nas vendas.')
on conflict (chave) do update
set nome=excluded.nome,
    percentual=excluded.percentual,
    ordem=excluded.ordem,
    observacao=excluded.observacao,
    updated_at=now();
