-- Complementos de 150 g usam exatamente a mesma embalagem física de 250 ml das marmitas de 200 g.
-- Mantemos uma única linha de custo para evitar divergência futura.

update public.cozinha_embalagens
set nome='Embalagem 250ml (150g e 200g)',
    custo_unitario=0.90,
    updated_at=now()
where categoria='marmita_200';

delete from public.cozinha_embalagens
where categoria='complemento_150';
