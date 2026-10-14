-- SO12 também calculava 30% de perda para tilápia em tiras:
-- 400g cru x 70% = 280g (antigo) vs 400g cru x 60% = 240g (cadastrado).
-- A diferença exata de 40g aparecia no rendimento teórico de 6550g.
-- Caldo de peixe 4000 + tilápia pronta 240 + tomate 380 + cebola 154
-- + alho 36 + óleo 50 + salsinha 50 + sal 100 + água 1500 = 6510g.
do $$
declare rendimento_atual numeric; perda_tilapia numeric; perda_tomate numeric;
begin
  select rendimento_final_g into strict rendimento_atual from public.cozinha_preparacoes where nome='Caldo de Peixe (Tilápia)';
  select quebra_percentual into strict perda_tilapia from public.cozinha_ingredientes where nome='Tilápia em tiras' and tipo_rendimento='perda';
  select quebra_percentual into strict perda_tomate from public.cozinha_ingredientes where nome='Tomate' and tipo_rendimento='perda';
  if rendimento_atual not in (6550,6510) or perda_tilapia<>40 or perda_tomate<>24 then
    raise exception 'Revisar SO12 antes de alterar rendimento';
  end if;
  update public.cozinha_preparacoes
  set rendimento_final_g=6510,
      observacao='Rendimento TEÓRICO revisado com perdas cadastradas. Caldo de peixe pronto 4000 g + tilápia em tiras CRUA 400 g com perda 40% = 240 g pronta + tomate cru 500 g com perda 24% = 380 g + cebola crua 200 g com perda 23% = 154 g + alho cru 40 g com perda 10% = 36 g + óleo 50 g + salsinha 50 g + sal 100 g + água 1,5 L (1500 g integralmente contabilizados) = 6510 g teóricos. A água é contada uma vez. Insumos de preparo já são CRUS, não aplicar perda novamente. Pesar lote pronto para calibrar eventuais perdas por evaporação. AUDITORIA_AGUA_INTEGRAL.',
      updated_at=now()
  where nome='Caldo de Peixe (Tilápia)';
end $$;
