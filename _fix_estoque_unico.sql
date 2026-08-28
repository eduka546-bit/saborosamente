-- Sopas: tamanho único 400g. Estoque vai em estoque_400g. Zera as outras.
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=1 WHERE nome ILIKE '%Frango%Legumes%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=2 WHERE nome ILIKE '%Carne%Legumes%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=9 WHERE nome ILIKE '%Legumes%' AND nome NOT ILIKE '%Frango%' AND nome NOT ILIKE '%Carne%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=12 WHERE nome ILIKE '%Feij%o%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=12 WHERE nome ILIKE '%Bucho%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE '%Canja%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=4 WHERE nome ILIKE '%Ab%bora%Caboti%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=3 WHERE nome ILIKE '%Mandioquinha%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE '%Creme%Batata%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE '%Caldo%Aipim%Carne%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE '%Caldo Verde%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=10 WHERE nome ILIKE '%Caldo%Peixe%';

-- Complementos: tamanho único 150g. Uso estoque_200g (coluna mais próxima). Zera as outras.
UPDATE public.produtos SET estoque_200g=8, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE '%Frango Desfiado%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_200g=9, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE '%Frango Americano%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE '%Frango Ensopado%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_200g=9, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE '%Tiras%Bife%Molho%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE '%Carne Mo%da%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_200g=12, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE '%Carne%Panela%';
