-- Revisão tripla dos rendimentos: TD14 tinha rendimento calculado com 30%
-- apesar de os ingredientes Tilápia e Tilápia em tiras estarem em 40% no cadastro.
-- Os 1000g da base são crus. NÃO aplicar 40% outra vez no insumo!
do $$
declare v_yield numeric; v_loss numeric; v_tomato_loss numeric;
begin
  select rendimento_final_g into strict v_yield from public.cozinha_preparacoes where nome='Tilápia assada';
  select quebra_percentual into strict v_loss from public.cozinha_ingredientes where nome='Tilápia' and tipo_rendimento='perda';
  select quebra_percentual into strict v_tomato_loss from public.cozinha_ingredientes where nome='Tomate' and tipo_rendimento='perda';
  if v_loss<>40 or v_tomato_loss<>24 then
    raise exception 'As perdas cadastradas mudaram; auditar o rendimento antes de aplicar';
  end if;
  -- Idempotente: migração já aplicada via Supabase deve ser reexecutável.
  if v_yield not in (928,828) then
    raise exception 'Rendimento divergente %: não sobrescrever medição sem revisão', v_yield;
  end if;
  update public.cozinha_preparacoes
  set rendimento_final_g=828,
      observacao='Rendimento TEÓRICO com perdas atuais cadastradas: 1000 g de filé de tilápia CRU com perda de 40% = 600 g prontos + 300 g de tomate cru com perda de 24% = 228 g prontos. Total teórico da preparação (tilápia + tomate): 828 g. Insumos da lista são CRUS; não aplicar a perda uma segunda vez. Confirmar pesagem após assar e recalibrar se houver rendimento medido.',
      updated_at=now()
  where nome='Tilápia assada';
  update public.cozinha_ingredientes
  set observacao='Filé cru para assar. Perda cadastrada de 40% (mesma taxa da Tilápia em tiras); usada no rendimento teórico da preparação Tilápia assada. Não aplicar novamente a perda aos insumos crus da preparação.',
      updated_at=now()
  where nome='Tilápia';
end $$;
