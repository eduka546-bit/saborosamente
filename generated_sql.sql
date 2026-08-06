-- 1. Permitir que o anon (nós agora) insira produtos para completar o catálogo
-- (Remova isso após a execução por segurança)
CREATE POLICY "Temp Enable Insert for Anon" ON public.produtos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Temp Enable Update for Anon" ON public.produtos FOR UPDATE TO anon USING (true);

-- 2. Inserir Categorias que podem estar faltando
INSERT INTO public.categorias (nome, slug, ordem) VALUES
('Combos Escolha Você Mesmo', 'combos-escolha-voce-mesmo', 0),
('Combos Prontos', 'combos-prontos', 0),
('Complementos de Proteínas 150g', 'complementos-proteinas', 0),
('Linha Refeições (200g - 300g - 400g)', 'linha-refeicoes', 0),
('Sopas (400g)', 'sopas', 0)
ON CONFLICT (slug) DO NOTHING;

-- 3. Inserção massiva de produtos com URLs de imagens corretas
DO $$
DECLARE
    cat_refeicoes UUID;
    cat_sopas UUID;
    cat_combos UUID;
    cat_proteinas UUID;
BEGIN
    SELECT id INTO cat_refeicoes FROM public.categorias WHERE slug = 'linha-refeicoes';
    SELECT id INTO cat_sopas FROM public.categorias WHERE slug = 'sopas';
    SELECT id INTO cat_combos FROM public.categorias WHERE slug = 'combos-prontos';
    SELECT id INTO cat_proteinas FROM public.categorias WHERE slug = 'complementos-proteinas';

    INSERT INTO public.produtos (nome, preco, categoria_id, imagem_url, status, peso, categoria)
    VALUES
    ('TD01 - Tiras de Alcatra ao Molho Madeira e Arroz com Brócolis', 26.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD02 - Patinho Moído com Purê de Mandioquinha', 24.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '300g', 'Refeições'),
    ('TD03 - Iscas de Frango com Creme de Milho e Arroz Branco', 23.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    ('TD04 - Strogonoff de Frango com Arroz e Batata Palha', 24.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    ('TD05 - Espaguete à Bolonhesa', 22.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp', 'ativo', '300g', 'Refeições'),
    ('TD06 - Escondidinho de Frango com Mandioca', 23.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp', 'ativo', '300g', 'Refeições'),
    ('TD07 - Feijoada Light com Arroz e Couve', 26.90, cat_refeicoes, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp', 'ativo', '350g', 'Refeições'),
    ('Sopa de Lentilha com Bacon', 18.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Sopa de Mandioquinha com Frango', 19.90, cat_sopas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp', 'ativo', '400g', 'Sopas'),
    ('Combo 10 Marmitas Variadas', 239.00, cat_combos, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp', 'ativo', 'Variado', 'Combos'),
    ('Peito de Frango Grelhado 150g', 15.00, cat_proteinas, 'https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp', 'ativo', '150g', 'Proteínas')
    ON CONFLICT (nome) DO UPDATE SET
        preco = EXCLUDED.preco,
        categoria_id = EXCLUDED.categoria_id,
        imagem_url = EXCLUDED.imagem_url,
        status = EXCLUDED.status,
        peso = EXCLUDED.peso,
        categoria = EXCLUDED.categoria;
END $$;

-- 4. Limpar políticas temporárias
DROP POLICY "Temp Enable Insert for Anon" ON public.produtos;
DROP POLICY "Temp Enable Update for Anon" ON public.produtos;
