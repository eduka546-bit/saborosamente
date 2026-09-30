-- Ajusta o rendimento real do feijão preto com base na produção de 30/09/2026.
-- Produção TD18: 6 kg de feijão pronto utilizados + 3 kg de sobra = 9 kg prontos.
-- Foram preparados 3 kg de feijão seco, portanto ganho operacional = 3,0x.

update public.cozinha_ingredientes
set tipo_rendimento='ganho',
    quebra_percentual=0,
    fator_rendimento=3.0,
    observacao='Rendimento ajustado pela produção real de 30/09/2026: 3 kg de feijão seco renderam aproximadamente 9 kg de feijão pronto com caldo (6 kg usados + 3 kg de sobra). Fator de ganho operacional: 3,0x.',
    updated_at=now()
where id='5df333ad-833d-4286-b35a-a75ad1dd969d';

update public.cozinha_preparacoes
set rendimento_final_g=3000,
    observacao='Rendimento operacional ajustado pela produção real de 30/09/2026: 1 kg de feijão preto seco rende aproximadamente 3 kg pronto com caldo.',
    updated_at=now()
where id='d413d536-5796-4825-8e2d-4830a1648691';
