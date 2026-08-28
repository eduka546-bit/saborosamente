-- Marmitas (200g / 300g / 400g) — busca por código TDxx no nome
UPDATE public.produtos SET estoque_200g=7, estoque_300g=5, estoque_400g=2 WHERE nome ILIKE 'TD01%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=14, estoque_400g=14 WHERE nome ILIKE 'TD02%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=11, estoque_400g=11 WHERE nome ILIKE 'TD03%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=4, estoque_400g=13 WHERE nome ILIKE 'TD04%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=15, estoque_400g=12 WHERE nome ILIKE 'TD05%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=10, estoque_400g=8 WHERE nome ILIKE 'TD06%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=13, estoque_400g=10 WHERE nome ILIKE 'TD07%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=10, estoque_400g=8 WHERE nome ILIKE 'TD08%';
UPDATE public.produtos SET estoque_200g=4, estoque_300g=8, estoque_400g=7 WHERE nome ILIKE 'TD09%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=14, estoque_400g=14 WHERE nome ILIKE 'TD10%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=10, estoque_400g=12 WHERE nome ILIKE 'TD11%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=11, estoque_400g=11 WHERE nome ILIKE 'TD12%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=11, estoque_400g=8 WHERE nome ILIKE 'TD13%';
UPDATE public.produtos SET estoque_200g=4, estoque_300g=1, estoque_400g=8 WHERE nome ILIKE 'TD14%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=14, estoque_400g=12 WHERE nome ILIKE 'TD15%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=16, estoque_400g=9 WHERE nome ILIKE 'TD16%';
UPDATE public.produtos SET estoque_200g=4, estoque_300g=10, estoque_400g=11 WHERE nome ILIKE 'TD17%';
UPDATE public.produtos SET estoque_200g=1, estoque_300g=3, estoque_400g=2 WHERE nome ILIKE 'TD18%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=10, estoque_400g=8 WHERE nome ILIKE 'TD19%';
UPDATE public.produtos SET estoque_200g=9, estoque_300g=12, estoque_400g=9 WHERE nome ILIKE 'TD20%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=10, estoque_400g=10 WHERE nome ILIKE 'TD21%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=12, estoque_400g=6 WHERE nome ILIKE 'TD22%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=7, estoque_400g=3 WHERE nome ILIKE 'TD23%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=4, estoque_400g=3 WHERE nome ILIKE 'TD24%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=14, estoque_400g=6 WHERE nome ILIKE 'TD25%';
UPDATE public.produtos SET estoque_200g=1, estoque_300g=4, estoque_400g=6 WHERE nome ILIKE 'TD26%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=10, estoque_400g=4 WHERE nome ILIKE 'TD27%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=16, estoque_400g=9 WHERE nome ILIKE 'TD28%';

-- Sopas (tamanho único 400g)
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=1 WHERE nome ILIKE 'SO01%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=2 WHERE nome ILIKE 'SO02%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=9 WHERE nome ILIKE 'SO03%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=12 WHERE nome ILIKE 'SO04%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=12 WHERE nome ILIKE 'SO05%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE 'SO06%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=4 WHERE nome ILIKE 'SO07%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=3 WHERE nome ILIKE 'SO08%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE 'SO09%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE 'SO10%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=11 WHERE nome ILIKE 'SO11%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=10 WHERE nome ILIKE 'SO12%';

-- Complementos (tamanho único, estoque em estoque_200g como UN)
UPDATE public.produtos SET estoque_200g=8, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE 'CO01%';
UPDATE public.produtos SET estoque_200g=9, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE 'CO02%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE 'CO03%';
UPDATE public.produtos SET estoque_200g=9, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE 'CO04%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE 'CO05%';
UPDATE public.produtos SET estoque_200g=12, estoque_300g=0, estoque_400g=0 WHERE nome ILIKE 'CO06%';
