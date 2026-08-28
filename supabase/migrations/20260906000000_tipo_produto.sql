-- ============================================================
-- tipo_produto: define o comportamento de cada produto no sistema.
-- Valores: marmita, sopa, complemento, combo, bebida
-- Determina: colunas de estoque, tamanhos disponíveis, visibilidade, decremento.
-- ============================================================

-- Coluna tipo_produto (default 'marmita' pra não quebrar nada existente)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS tipo_produto text NOT NULL DEFAULT 'marmita';

-- Popula automaticamente baseado nas categorias atuais
UPDATE public.produtos p SET tipo_produto = 'sopa'
FROM public.categorias c WHERE p.categoria_id = c.id AND c.nome ILIKE '%sopa%';

UPDATE public.produtos p SET tipo_produto = 'complemento'
FROM public.categorias c WHERE p.categoria_id = c.id AND c.nome ILIKE '%complemento%';

UPDATE public.produtos p SET tipo_produto = 'combo'
FROM public.categorias c WHERE p.categoria_id = c.id AND c.nome ILIKE '%combo%';

UPDATE public.produtos SET tipo_produto = 'bebida'
WHERE visivel_online = false AND ativo = true AND tipo_produto = 'marmita';

-- Index pra filtrar por tipo
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON public.produtos(tipo_produto);

-- RPC atualizada: usa tipo_produto pra saber qual coluna decrementar.
-- marmita: decrementa por tamanho (200g/300g/400g)
-- sopa: sempre estoque_400g
-- complemento/bebida: sempre estoque_200g (coluna "unidade")
-- combo: não decrementa (o estoque é dos sabores individuais)
CREATE OR REPLACE FUNCTION public.decrementar_estoque(p_produto_id uuid, p_qtd int, p_tamanho text DEFAULT '300g')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tipo text;
BEGIN
  SELECT tipo_produto INTO v_tipo FROM public.produtos WHERE id = p_produto_id;

  -- Combo não tem estoque próprio (decrementa dos sabores)
  IF v_tipo = 'combo' THEN RETURN; END IF;

  -- Sopa: sempre 400g (tamanho único)
  IF v_tipo = 'sopa' THEN
    UPDATE public.produtos SET estoque_400g = GREATEST(0, estoque_400g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
    RETURN;
  END IF;

  -- Complemento e Bebida: sempre estoque_200g (unidade)
  IF v_tipo = 'complemento' OR v_tipo = 'bebida' THEN
    UPDATE public.produtos SET estoque_200g = GREATEST(0, estoque_200g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
    RETURN;
  END IF;

  -- Marmita: decrementa por tamanho
  IF p_tamanho = '200g' THEN
    UPDATE public.produtos SET estoque_200g = GREATEST(0, estoque_200g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  ELSIF p_tamanho = '400g' THEN
    UPDATE public.produtos SET estoque_400g = GREATEST(0, estoque_400g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  ELSE
    UPDATE public.produtos SET estoque_300g = GREATEST(0, estoque_300g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
