-- Atualizar todos os produtos TD para incluir as 3 opções de peso na coluna peso
-- Isso fará com que no catálogo apareça "200g, 300g, 400g" abaixo do nome
UPDATE public.produtos 
SET peso = '200g, 300g, 400g'
WHERE nome ILIKE 'TD%';

-- Garantir que todos os produtos da Linha Refeições tenham essas opções
UPDATE public.produtos 
SET peso = '200g, 300g, 400g'
WHERE categoria_id IN (SELECT id FROM public.categorias WHERE slug = 'linha-refeicoes-200g-300g-400g');
