-- Atualização de estoque conforme contagem da loja (24/08/2026).
-- Marmitas: 200g = estoque_200g, 300g = estoque_300g, 400g = estoque_400g.
-- Sopas: estoque único em estoque_400g.
-- Complementos: estoque único em estoque_200g.

-- ── MARMITAS ────────────────────────────────────────────────────────────────

UPDATE public.produtos SET estoque_200g=4, estoque_300g=4, estoque_400g=8, updated_at=now()
  WHERE nome ILIKE '%TD02%'; -- Almôndegas ao Molho Sugo

UPDATE public.produtos SET estoque_200g=1, estoque_300g=0, estoque_400g=5, updated_at=now()
  WHERE nome ILIKE '%TD03%'; -- Nhoque

UPDATE public.produtos SET estoque_200g=5, estoque_300g=0, estoque_400g=11, updated_at=now()
  WHERE nome ILIKE '%TD04%'; -- Vaca Atolada

UPDATE public.produtos SET estoque_200g=7, estoque_300g=10, estoque_400g=11, updated_at=now()
  WHERE nome ILIKE '%TD05%'; -- Arroz Carreteiro

UPDATE public.produtos SET estoque_200g=7, estoque_300g=5, estoque_400g=2, updated_at=now()
  WHERE nome ILIKE '%TD06%'; -- Frango Grelhado

UPDATE public.produtos SET estoque_200g=6, estoque_300g=10, estoque_400g=9, updated_at=now()
  WHERE nome ILIKE '%TD07%'; -- Sobrecoxa Ensopada

UPDATE public.produtos SET estoque_200g=3, estoque_300g=6, estoque_400g=1, updated_at=now()
  WHERE nome ILIKE '%TD08%'; -- Parmegiana de Frango

UPDATE public.produtos SET estoque_200g=2, estoque_300g=3, estoque_400g=1, updated_at=now()
  WHERE nome ILIKE '%TD09%'; -- Parmegiana de Carne

UPDATE public.produtos SET estoque_200g=5, estoque_300g=11, estoque_400g=14, updated_at=now()
  WHERE nome ILIKE '%TD10%'; -- Estrogonofe de Frango

UPDATE public.produtos SET estoque_200g=5, estoque_300g=6, estoque_400g=11, updated_at=now()
  WHERE nome ILIKE '%TD12%'; -- Escondidinho de Frango

UPDATE public.produtos SET estoque_200g=3, estoque_300g=5, estoque_400g=8, updated_at=now()
  WHERE nome ILIKE '%TD13%'; -- Escondidinho de Carne

UPDATE public.produtos SET estoque_200g=1, estoque_300g=0, estoque_400g=5, updated_at=now()
  WHERE nome ILIKE '%TD14%'; -- Filé de Tilápia

UPDATE public.produtos SET estoque_200g=3, estoque_300g=8, estoque_400g=7, updated_at=now()
  WHERE nome ILIKE '%TD16%'; -- Tiras de Bife

UPDATE public.produtos SET estoque_200g=4, estoque_300g=5, estoque_400g=7, updated_at=now()
  WHERE nome ILIKE '%TD17%'; -- Frango Empanado

UPDATE public.produtos SET estoque_200g=5, estoque_300g=10, estoque_400g=6, updated_at=now()
  WHERE nome ILIKE '%TD20%'; -- Lasanha de Carne

UPDATE public.produtos SET estoque_200g=3, estoque_300g=7, estoque_400g=10, updated_at=now()
  WHERE nome ILIKE '%TD21%'; -- Panqueca de Frango

UPDATE public.produtos SET estoque_200g=3, estoque_300g=5, estoque_400g=2, updated_at=now()
  WHERE nome ILIKE '%TD22%'; -- Panqueca de Carne

UPDATE public.produtos SET estoque_200g=6, estoque_300g=3, estoque_400g=1, updated_at=now()
  WHERE nome ILIKE '%TD23%'; -- Penne Frango Grelhado

UPDATE public.produtos SET estoque_200g=6, estoque_300g=12, estoque_400g=10, updated_at=now()
  WHERE nome ILIKE '%TD24%'; -- Espaguete Carbonara

UPDATE public.produtos SET estoque_200g=5, estoque_300g=10, estoque_400g=5, updated_at=now()
  WHERE nome ILIKE '%TD25%'; -- Espaguete Almôndegas

UPDATE public.produtos SET estoque_200g=0, estoque_300g=0, estoque_400g=2, updated_at=now()
  WHERE nome ILIKE '%TD26%'; -- Talharim Carne

UPDATE public.produtos SET estoque_200g=5, estoque_300g=4, estoque_400g=4, updated_at=now()
  WHERE nome ILIKE '%TD27%'; -- Penne 4 Queijos

UPDATE public.produtos SET estoque_200g=4, estoque_300g=4, estoque_400g=8, updated_at=now()
  WHERE nome ILIKE '%TD28%'; -- Penne Alcatra

-- ── SOPAS (estoque único em estoque_400g) ───────────────────────────────────

UPDATE public.produtos SET estoque_400g=0, updated_at=now()
  WHERE nome ILIKE '%SO01%'; -- Sopa de Frango (já 0, confirma)

UPDATE public.produtos SET estoque_400g=1, updated_at=now()
  WHERE nome ILIKE '%SO02%'; -- Sopa de Carne

UPDATE public.produtos SET estoque_400g=6, updated_at=now()
  WHERE nome ILIKE '%SO06%'; -- Canja de Galinha

UPDATE public.produtos SET estoque_400g=4, updated_at=now()
  WHERE nome ILIKE '%SO07%'; -- Creme de Abóbora

UPDATE public.produtos SET estoque_400g=8, updated_at=now()
  WHERE nome ILIKE '%SO09%'; -- Creme de Batata Inglesa

UPDATE public.produtos SET estoque_400g=10, updated_at=now()
  WHERE nome ILIKE '%SO11%'; -- Caldo Verde

-- ── COMPLEMENTOS (estoque único em estoque_200g) ────────────────────────────

UPDATE public.produtos SET estoque_200g=5, updated_at=now()
  WHERE nome ILIKE '%CO04%'; -- Tiras de Carne

UPDATE public.produtos SET estoque_200g=5, updated_at=now()
  WHERE nome ILIKE '%CO05%'; -- Carne Moída à Bolonhesa
