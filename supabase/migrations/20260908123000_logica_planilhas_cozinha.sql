-- Regras da planilha de produção:
-- direto: a quantidade montada é a quantidade a separar;
-- acrescentar: acrescenta uma perda percentual (ex.: 0,40 = +40%);
-- dividir: usa o rendimento da preparação (ex.: 3,5 = montagem ÷ 3,5).
alter table public.cozinha_receita_itens
  add column if not exists operacao_producao text not null default 'direto'
    check (operacao_producao in ('direto', 'acrescentar', 'dividir')),
  add column if not exists fator_producao numeric(8,4) not null default 1
    check (fator_producao > 0);

comment on column public.cozinha_receita_itens.operacao_producao is
  'Regra P/G da planilha: direto, acrescentar perda ou dividir pelo rendimento.';
comment on column public.cozinha_receita_itens.fator_producao is
  'Percentual de perda (acrescentar) ou divisor de rendimento (dividir).';

-- A base de preços e quebras da planilha é carregada na implantação. Este
-- exemplo reproduz a lógica P/G no sabor TD06, sem sobrescrever uma ficha já
-- preenchida pela cozinha.
with receita as (
  insert into public.cozinha_receitas (produto_id, ingredientes, modo_preparo)
  select p.id, '[]'::jsonb,
    'Distribuir arroz, brócolis e frango; finalizar com o molho pronto.'
  from public.produtos p
  where p.id = '18db506a-cb81-4b7b-966d-756a1c81c867'
    and not exists (select 1 from public.cozinha_receitas r where r.produto_id = p.id)
  returning id
), receita_existente as (
  select id from receita
  union all
  select id from public.cozinha_receitas
  where produto_id = '18db506a-cb81-4b7b-966d-756a1c81c867'
  limit 1
), dados(nome, g200, g300, g400, operacao, fator, ordem) as (
  values
    ('Sassami', 70, 105, 140, 'acrescentar', 0.4, 0),
    ('Arroz', 60, 90, 120, 'dividir', 3.5, 1),
    ('Brócolis', 45, 67.5, 90, 'direto', 1, 2),
    ('Molho tomate', 25, 37.5, 50, 'direto', 1, 3)
)
insert into public.cozinha_receita_itens
  (receita_id, ingrediente_id, gramas_200, gramas_300, gramas_400, operacao_producao, fator_producao, ordem)
select r.id, i.id, d.g200, d.g300, d.g400, d.operacao, d.fator, d.ordem
from receita_existente r
cross join dados d
join public.cozinha_ingredientes i on i.nome = d.nome
where not exists (select 1 from public.cozinha_receita_itens x where x.receita_id = r.id);
