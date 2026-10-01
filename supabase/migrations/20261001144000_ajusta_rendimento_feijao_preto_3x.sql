-- Ajusta rendimento real do feijão preto com base na produção observada.
-- Produção real: 3 kg de feijão seco -> aproximadamente 9 kg de feijão pronto com caldo
-- (quantidade usada + 3 kg de sobra), portanto ganho operacional = 3,0x.

update public.cozinha_ingredientes
set tipo_rendimento='ganho',
    quebra_percentual=0,
    fator_rendimento=3.0,
    observacao='Rendimento ajustado pela produção real: 3 kg de feijão seco renderam aproximadamente 9 kg de feijão pronto com caldo (quantidade usada + 3 kg de sobra). Fator de ganho operacional: 3,0x.'
where id='5df333ad-833d-4286-b35a-a75ad1dd969d';

update public.cozinha_preparacoes
set rendimento_final_g=3000,
    observacao='Rendimento operacional ajustado pela produção real: 1 kg de feijão preto seco rende aproximadamente 3 kg pronto com caldo.'
where id='d413d536-5796-4825-8e2d-4830a1648691';
