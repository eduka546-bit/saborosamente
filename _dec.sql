-- Decremento das vendas de hoje (01/09/2026) sobre o estoque de ontem

-- PDV 1: TD13×1 300g, TD06×1 300g, TD25×1 300g, TD16×1 300g, TD28×1 400g
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD13'), 1, '300g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD06'), 1, '300g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD25'), 1, '300g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD16'), 1, '300g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD28'), 1, '400g');

-- PDV 1: Água com Gás 510ml × 3 (bebida → estoque_200g)
UPDATE produtos SET estoque_200g = GREATEST(0, estoque_200g - 3)
WHERE tipo_produto = 'bebida' AND nome ILIKE '%gua%com%g%s%';

-- PDV 2: TD27×1 300g, TD28×1 300g, TD02×1 300g, TD03×1 300g
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD27'), 1, '300g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD28'), 1, '300g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD02'), 1, '300g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD03'), 1, '300g');

-- P10: TD18×1 400g, TD07×1 400g, TD04×1 400g
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD18'), 1, '400g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD07'), 1, '400g');
SELECT decrementar_estoque((SELECT id FROM produtos WHERE codigo_integracao='TD04'), 1, '400g');
