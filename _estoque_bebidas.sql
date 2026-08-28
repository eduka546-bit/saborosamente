-- Bebidas (estoque em estoque_200g como UN)
UPDATE public.produtos SET estoque_200g=3 WHERE nome ILIKE '%Coca Cola 350%' AND nome NOT ILIKE '%Zero%';
UPDATE public.produtos SET estoque_200g=2 WHERE nome ILIKE '%Coca%350%Zero%' OR nome ILIKE '%Coca Cola Zero 350%';
UPDATE public.produtos SET estoque_200g=0 WHERE nome ILIKE '%Laranjinha%';
UPDATE public.produtos SET estoque_200g=2 WHERE nome ILIKE '%gua T_nica%';
UPDATE public.produtos SET estoque_200g=2 WHERE nome ILIKE '%Coca Cola 600%' AND nome NOT ILIKE '%Zero%';
UPDATE public.produtos SET estoque_200g=2 WHERE nome ILIKE '%Coca%Zero 600%' OR nome ILIKE '%Coca Cola Zero 600%';
UPDATE public.produtos SET estoque_200g=1 WHERE nome ILIKE '%Guaran_ 350%' AND nome NOT ILIKE '%Zero%';
UPDATE public.produtos SET estoque_200g=2 WHERE nome ILIKE '%Guaran_%Zero%350%';
UPDATE public.produtos SET estoque_200g=1 WHERE nome ILIKE '%Monster%473%' AND nome NOT ILIKE '%Zero%' AND nome NOT ILIKE '%Ultra%';
UPDATE public.produtos SET estoque_200g=1 WHERE nome ILIKE '%Monster%Zero%473%';
UPDATE public.produtos SET estoque_200g=1 WHERE nome ILIKE '%Monster%Ultra%473%';
UPDATE public.produtos SET estoque_200g=2 WHERE nome ILIKE '%Gatorade%';
UPDATE public.produtos SET estoque_200g=2 WHERE nome ILIKE '%H2O%';
UPDATE public.produtos SET estoque_200g=12 WHERE nome ILIKE '%gua Sem G%';
UPDATE public.produtos SET estoque_200g=10 WHERE nome ILIKE '%gua Com G%';
-- Ativa controle de estoque nas bebidas
UPDATE public.produtos SET controle_estoque=true WHERE tipo_produto='bebida' AND ativo=true;
