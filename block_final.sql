DO $$
DECLARE
    cat_refeicoes UUID;
    cat_sopas UUID;
    cat_prontos UUID;
    cat_escolha UUID;
    cat_prot UUID;
BEGIN
    SELECT id INTO cat_refeicoes FROM public.categorias WHERE slug = 'linha-refeicoes';
    SELECT id INTO cat_sopas FROM public.categorias WHERE slug = 'sopas';
    SELECT id INTO cat_prontos FROM public.categorias WHERE slug = 'combos-prontos';
    SELECT id INTO cat_escolha FROM public.categorias WHERE slug = 'combos-escolha-voce-mesmo';
    SELECT id INTO cat_prot FROM public.categorias WHERE slug = 'complementos-proteinas';

    INSERT INTO public.produtos (nome, preco, categoria_id, imagem_url, status, peso, categoria) VALUES
    -- Refeições restantes
    ('TD11 - Carne Seca com Abóbora e Arroz Integral', 27.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD12 - Tilápia ao Molho de Ervas com Purê de Batata Doce', 29.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '300g', 'Refeições'),
    ('TD13 - Sobrecoxa Assada com Risoto de Legumes', 24.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '350g', 'Refeições'),
    ('TD14 - Picadinho de Carne com Farofa de Ovos e Arroz', 26.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD15 - Frango Xadrez com Arroz Colorido', 23.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    
    -- Sopas restantes
    ('Caldo de Mocotó', 21.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Sopa de Ervilha com Defumados', 18.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    
    -- Combos restantes
    ('Combo Família 20 Marmitas', 449.00, cat_prontos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Sopas 05 Dias', 85.00, cat_prontos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Casal 14 Marmitas', 319.00, cat_prontos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    
    -- Escolha você mesmo restante
    ('Combo Personalizado Semanal', 189.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Combo Personalizado Mensal', 699.00, cat_escolha, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos')
    ON CONFLICT (nome) DO UPDATE SET 
        preco = EXCLUDED.preco, 
        imagem_url = EXCLUDED.imagem_url,
        categoria_id = EXCLUDED.categoria_id,
        status = EXCLUDED.status,
        peso = EXCLUDED.peso;
END $$;
