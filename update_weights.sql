-- Primeiro, vamos garantir que a coluna 'peso' seja do tipo TEXT se não for
ALTER TABLE public.produtos ALTER COLUMN peso TYPE TEXT;

-- Atualizar todos os produtos TD para incluir as 3 opções de peso
UPDATE public.produtos 
SET peso = '200g, 300g, 400g'
WHERE nome ILIKE 'TD%';

-- Se você quiser que o Admin mostre algo como "Várias Opções", podemos deixar assim.
-- Mas o ideal é que no catálogo o usuário possa ESCOLHER.
