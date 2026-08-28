DO $$
DECLARE
  combo10_id uuid;
  combo20_id uuid;
BEGIN
  -- Pega os IDs corretos (Pratos Mais Vendidos)
  SELECT id INTO combo10_id FROM public.produtos WHERE nome ILIKE '%Combo Pratos Mais Vendidos%10un%' AND ativo = true LIMIT 1;
  SELECT id INTO combo20_id FROM public.produtos WHERE nome ILIKE '%Combo Pratos Mais Vendidos%20un%' AND ativo = true LIMIT 1;

  -- Limpa sabores antigos
  IF combo10_id IS NOT NULL THEN DELETE FROM public.combo_sabores WHERE combo_id = combo10_id; END IF;
  IF combo20_id IS NOT NULL THEN DELETE FROM public.combo_sabores WHERE combo_id = combo20_id; END IF;

  -- COMBO 10: 10 sabores
  IF combo10_id IS NOT NULL THEN
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 1 FROM public.produtos WHERE nome ILIKE 'TD01%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 2 FROM public.produtos WHERE nome ILIKE 'TD14%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 3 FROM public.produtos WHERE nome ILIKE 'TD20%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 4 FROM public.produtos WHERE nome ILIKE 'TD26%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 5 FROM public.produtos WHERE nome ILIKE 'TD08%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 6 FROM public.produtos WHERE nome ILIKE 'TD13%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 7 FROM public.produtos WHERE nome ILIKE 'TD10%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 8 FROM public.produtos WHERE nome ILIKE 'TD15%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 9 FROM public.produtos WHERE nome ILIKE 'TD03%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo10_id, id, 10 FROM public.produtos WHERE nome ILIKE 'TD21%' AND ativo = true LIMIT 1;
  END IF;

  -- COMBO 20: 20 sabores
  IF combo20_id IS NOT NULL THEN
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 1 FROM public.produtos WHERE nome ILIKE 'TD01%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 2 FROM public.produtos WHERE nome ILIKE 'TD13%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 3 FROM public.produtos WHERE nome ILIKE 'TD10%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 4 FROM public.produtos WHERE nome ILIKE 'TD15%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 5 FROM public.produtos WHERE nome ILIKE 'TD14%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 6 FROM public.produtos WHERE nome ILIKE 'TD20%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 7 FROM public.produtos WHERE nome ILIKE 'TD26%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 8 FROM public.produtos WHERE nome ILIKE 'TD03%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 9 FROM public.produtos WHERE nome ILIKE 'TD21%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 10 FROM public.produtos WHERE nome ILIKE 'TD08%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 11 FROM public.produtos WHERE nome ILIKE 'TD02%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 12 FROM public.produtos WHERE nome ILIKE 'TD11%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 13 FROM public.produtos WHERE nome ILIKE 'TD06%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 14 FROM public.produtos WHERE nome ILIKE 'TD19%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 15 FROM public.produtos WHERE nome ILIKE 'TD24%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 16 FROM public.produtos WHERE nome ILIKE 'TD25%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 17 FROM public.produtos WHERE nome ILIKE 'TD28%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 18 FROM public.produtos WHERE nome ILIKE 'TD22%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 19 FROM public.produtos WHERE nome ILIKE 'TD09%' AND ativo = true LIMIT 1;
    INSERT INTO public.combo_sabores (combo_id, produto_id, ordem) SELECT combo20_id, id, 20 FROM public.produtos WHERE nome ILIKE 'TD16%' AND ativo = true LIMIT 1;
  END IF;
END $$;
