-- Ajusta rendimento operacional real do purê de batata.
-- 1 kg de batata inglesa -> aproximadamente 700 g de purê pronto.

update public.cozinha_preparacoes
set rendimento_final_g=700,
    observacao='Rendimento operacional definido em 01/10/2026: 1 kg de batata inglesa rende aproximadamente 700 g de purê pronto. Manter 200 ml de leite por kg de batata e usar este rendimento somente no preparo Purê de batata.',
    updated_at=now()
where id='6839dd0d-d60f-4054-a7ee-8f046c5a85ac';
