-- Atualização de estoque completa - valores do dia
-- Marmitas (200g / 300g / 400g)
UPDATE public.produtos SET estoque_200g=7, estoque_300g=5, estoque_400g=2 WHERE nome ILIKE '%Tiras de Alcatra ao Molho Madeira%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=14, estoque_400g=14 WHERE nome ILIKE '%Alm%ndegas%Sugo%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=11, estoque_400g=11 WHERE nome ILIKE '%Nhoque%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=4, estoque_400g=13 WHERE nome ILIKE '%Vaca Atolada%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=15, estoque_400g=12 WHERE nome ILIKE '%Arroz Carreteiro%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=10, estoque_400g=8 WHERE nome ILIKE '%Frango Grelhado%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=13, estoque_400g=10 WHERE nome ILIKE '%Sobrecoxa%Ensopada%' OR nome ILIKE '%Sob%Ensopada%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=10, estoque_400g=8 WHERE nome ILIKE '%Parm%Frango%';
UPDATE public.produtos SET estoque_200g=4, estoque_300g=8, estoque_400g=7 WHERE nome ILIKE '%Parm%Carne%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=14, estoque_400g=14 WHERE nome ILIKE '%Strogonoff%Frango%' OR nome ILIKE '%Est%Frango%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=10, estoque_400g=12 WHERE nome ILIKE '%Strogonoff%Carne%' OR nome ILIKE '%Est%Carne%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=11, estoque_400g=11 WHERE nome ILIKE '%Escondidinho%Frango%' OR nome ILIKE '%Esc%Frango%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=11, estoque_400g=8 WHERE nome ILIKE '%Escondidinho%Carne%' OR nome ILIKE '%Esc%Carne%';
UPDATE public.produtos SET estoque_200g=4, estoque_300g=1, estoque_400g=8 WHERE nome ILIKE '%Fil%Til%pia%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=14, estoque_400g=12 WHERE nome ILIKE '%Feijoada%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=16, estoque_400g=9 WHERE nome ILIKE '%Bife ao Molho%';
UPDATE public.produtos SET estoque_200g=4, estoque_300g=10, estoque_400g=11 WHERE nome ILIKE '%Frango Americano%' AND nome NOT ILIKE '%Complemento%';
UPDATE public.produtos SET estoque_200g=1, estoque_300g=3, estoque_400g=2 WHERE nome ILIKE '%Patinho%Mo%do%' OR nome ILIKE '%Pat%Mo%do%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=10, estoque_400g=8 WHERE nome ILIKE '%Lasanha%Frango%' OR nome ILIKE '%Las%Frango%';
UPDATE public.produtos SET estoque_200g=9, estoque_300g=12, estoque_400g=9 WHERE nome ILIKE '%Lasanha%Carne%' OR nome ILIKE '%Las%Carne%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=10, estoque_400g=10 WHERE nome ILIKE '%Panqueca%Frango%' OR nome ILIKE '%Panq%Frango%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=12, estoque_400g=6 WHERE nome ILIKE '%Panqueca%Carne%' OR nome ILIKE '%Panq%Carne%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=7, estoque_400g=3 WHERE nome ILIKE '%Penne%Frango%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=4, estoque_400g=3 WHERE nome ILIKE '%Carbonara%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=14, estoque_400g=6 WHERE nome ILIKE '%Espaguete%Alm%ndega%';
UPDATE public.produtos SET estoque_200g=1, estoque_300g=4, estoque_400g=6 WHERE nome ILIKE '%Talharim%Bolonhesa%' OR nome ILIKE '%Tal%Bol%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=10, estoque_400g=4 WHERE nome ILIKE '%Penne%4 Queijos%' OR nome ILIKE '%Penne%Queijos%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=16, estoque_400g=9 WHERE nome ILIKE '%Penne%Creme%' OR nome ILIKE '%Penne Alla Creme%';

-- Sopas (tamanho unico, uso 300g)
UPDATE public.produtos SET estoque_300g=1 WHERE nome ILIKE '%Frango%Legumes%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=2 WHERE nome ILIKE '%Carne%Legumes%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=9 WHERE nome ILIKE '%Legumes%' AND nome NOT ILIKE '%Frango%' AND nome NOT ILIKE '%Carne%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=12 WHERE nome ILIKE '%Feij%o%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=12 WHERE nome ILIKE '%Bucho%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Canja%';
UPDATE public.produtos SET estoque_300g=4 WHERE nome ILIKE '%Ab%bora%Caboti%';
UPDATE public.produtos SET estoque_300g=3 WHERE nome ILIKE '%Mandioquinha%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Creme%Batata%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Caldo%Aipim%Carne%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Caldo Verde%';
UPDATE public.produtos SET estoque_300g=10 WHERE nome ILIKE '%Caldo%Peixe%';

-- Complementos (tamanho unico, uso 300g)
UPDATE public.produtos SET estoque_300g=8 WHERE nome ILIKE '%Frango Desfiado%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=9 WHERE nome ILIKE '%Frango Americano%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=8 WHERE nome ILIKE '%Frango Ensopado%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=9 WHERE nome ILIKE '%Tiras%Bife%Molho%';
UPDATE public.produtos SET estoque_300g=6 WHERE nome ILIKE '%Carne Mo%da%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=12 WHERE nome ILIKE '%Carne%Panela%';
