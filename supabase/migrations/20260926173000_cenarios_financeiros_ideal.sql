-- Cenários de planejamento no Controle Operacional.
-- Mantém o valor real como fonte de verdade e salva apenas metas/valores ideais separadamente.

alter table public.financeiro_mix_operacional
  add column if not exists custo_planejado numeric,
  add column if not exists venda_planejada numeric;

alter table public.financeiro_despesas_operacionais
  add column if not exists valor_ideal numeric;

update public.financeiro_despesas_operacionais
set valor_ideal = valor_mensal
where valor_ideal is null;

comment on column public.financeiro_mix_operacional.custo_planejado is
  'Custo médio manual para simulações. Null = usar custo real calculado do cardápio.';
comment on column public.financeiro_mix_operacional.venda_planejada is
  'Preço médio manual para simulações. Null = usar preço real praticado.';
comment on column public.financeiro_despesas_operacionais.valor_ideal is
  'Meta/valor ideal mensal usada no cenário planejado, sem alterar o valor atual.';
