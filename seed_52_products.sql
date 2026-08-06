-- 1. Garantir categorias
INSERT INTO public.categorias (nome, slug, ordem) VALUES
('Linha Refeições (200g - 300g - 400g)', 'linha-refeicoes', 1),
('Sopas (400g)', 'sopas', 2),
('Combos Prontos', 'combos-prontos', 3),
('Complementos de Proteínas 150g', 'complementos-proteinas', 4),
('Combos Escolha Você Mesmo', 'combos-escolha-voce-mesmo', 5)
ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome;

-- 2. Inserção Massiva
DO $$
DECLARE
    cat_refeicoes UUID;
    cat_sopas UUID;
    cat_combos UUID;
    cat_proteinas UUID;
    cat_escolha UUID;
BEGIN
    SELECT id INTO cat_refeicoes FROM public.categorias WHERE slug = 'linha-refeicoes';
    SELECT id INTO cat_sopas FROM public.categorias WHERE slug = 'sopas';
    SELECT id INTO cat_combos FROM public.categorias WHERE slug = 'combos-prontos';
    SELECT id INTO cat_proteinas FROM public.categorias WHERE slug = 'complementos-proteinas';
    SELECT id INTO cat_escolha FROM public.categorias WHERE slug = 'combos-escolha-voce-mesmo';

    -- Marmitas / Refeições
    INSERT INTO public.produtos (nome, preco, categoria_id, imagem_url, status, peso, categoria) VALUES
    ('TD01 - Tiras de Alcatra ao Molho Madeira e Arroz com Brócolis', 26.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD02 - Patinho Moído com Purê de Mandioquinha', 24.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '300g', 'Refeições'),
    ('TD03 - Iscas de Frango com Creme de Milho e Arroz Branco', 23.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    ('TD04 - Strogonoff de Frango com Arroz e Batata Palha', 24.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    ('TD05 - Espaguete à Bolonhesa', 22.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD06 - Escondidinho de Frango com Mandioca', 23.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    ('TD07 - Feijoada Light com Arroz e Couve', 26.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '350g', 'Refeições'),
    ('TD08 - Nhoque de Batata Doce com Molho de Tomate', 21.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '300g', 'Refeições'),
    ('TD09 - Panqueca de Carne com Arroz e Feijão', 25.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '350g', 'Refeições'),
    ('TD10 - Salmão Grelhado com Arroz de Coco e Castanhas', 38.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '300g', 'Refeições'),
    ('TD11 - Carne Seca com Abóbora e Arroz Integral', 27.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD12 - Tilápia ao Molho de Ervas com Purê de Batata Doce', 29.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '300g', 'Refeições'),
    ('TD13 - Sobrecoxa Assada com Risoto de Legumes', 24.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '350g', 'Refeições'),
    ('TD14 - Picadinho de Carne com Farofa de Ovos e Arroz', 26.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD15 - Frango Xadrez com Arroz Colorido', 23.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    
    -- Sopas
    ('Sopa de Lentilha com Bacon', 18.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Sopa de Mandioquinha com Frango', 19.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Caldo Verde com Paio', 19.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Canja de Galinha', 17.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Sopa de Feijão com Macarrão', 16.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Creme de Milho com Frango', 18.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Sopa de Abóbora com Gengibre', 17.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Caldo de Mocotó', 21.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Sopa de Ervilha com Defumados', 18.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Creme de Palmito', 22.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),

    -- Proteínas / Complementos
    ('Peito de Frango Grelhado 150g', 15.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Patinho Moído 150g', 18.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Iscas de Alcatra 150g', 21.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Sobrecoxa Desossada 150g', 16.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Filé de Tilápia 150g', 22.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Carne Seca Desfiada 150g', 24.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Omelete de Ervas 150g', 14.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Hamburguer de Grão de Bico 150g', 17.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Frango Desfiado com Milho 150g', 15.50, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),
    ('Strogonoff de Frango 150g', 17.50, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas'),

    -- Combos Prontos
    ('Combo 10 Marmitas Variadas', 239.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo 07 Marmitas Fit', 169.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo 15 Marmitas Econômico', 339.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Detox 03 Dias', 89.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Família 20 Marmitas', 449.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Hipertrofia 10 Marmitas', 259.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Low Carb 07 Marmitas', 179.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Vegetariano 07 Marmitas', 165.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Sopas 05 Dias', 85.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Casal 14 Marmitas', 319.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),

    -- Combos Escolha Você Mesmo
    ('Combo 10 Marmitas - Escolha Livre', 249.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo 15 Marmitas - Escolha Livre', 359.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo 20 Marmitas - Escolha Livre', 469.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo 30 Marmitas - Escolha Livre', 679.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Personalizado Semanal', 189.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Personalizado Mensal', 699.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Degustação 03 Marmitas', 75.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos')

    ON CONFLICT (nome) DO UPDATE SET
        preco = EXCLUDED.preco,
        categoria_id = EXCLUDED.categoria_id,
        imagem_url = EXCLUDED.imagem_url,
        status = EXCLUDED.status,
        peso = EXCLUDED.peso,
        categoria = EXCLUDED.categoria;
END $$;
