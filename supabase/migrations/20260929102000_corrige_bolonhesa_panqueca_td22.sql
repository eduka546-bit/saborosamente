-- Corrige a montagem do TD22 para usar o preparo compartilhado Molho Bolonhesa.
-- A linha estava cadastrada como "molho sugo", o que fazia o consolidado não reconhecer o Bolonhesa.

update public.cozinha_receita_montagem_itens
set nome='Molho Bolonhesa',
    observacao=coalesce(observacao,'Usar o preparo compartilhado Molho Bolonhesa.')
where id='9eede849-dcaf-4a4f-b4e9-b54469ea5b30';
