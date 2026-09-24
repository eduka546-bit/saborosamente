-- Custos padrão atuais de embalagem e etiqueta.
-- Estes registros são a fonte única usada nas fichas técnicas, Cardápio Completo e cálculos de lucro.

update public.cozinha_embalagens
set nome='Embalagem 250ml (200g)',
    custo_unitario=0.90,
    observacao='Embalagem de 250 ml usada nas marmitas de 200 g.',
    updated_at=now()
where categoria='marmita_200';

update public.cozinha_embalagens
set nome='Embalagem 500ml (300g)',
    custo_unitario=1.50,
    observacao='Embalagem de 500 ml usada nas marmitas de 300 g.',
    updated_at=now()
where categoria='marmita_300';

update public.cozinha_embalagens
set nome='Embalagem 750ml (400g)',
    custo_unitario=2.00,
    observacao='Embalagem de 750 ml usada nas marmitas de 400 g.',
    updated_at=now()
where categoria='marmita_400';

update public.cozinha_embalagens
set nome='Embalagem Sopa 500ml',
    custo_unitario=1.50,
    observacao='Embalagem de 500 ml usada nas sopas de 400 g.',
    updated_at=now()
where categoria='sopa';

update public.cozinha_embalagens
set nome='Etiqueta',
    custo_unitario=0.70,
    observacao='Custo unitário por etiqueta aplicada em cada marmita ou sopa.',
    updated_at=now()
where categoria='etiqueta';

create unique index if not exists cozinha_embalagens_categoria_unique
on public.cozinha_embalagens (categoria);
