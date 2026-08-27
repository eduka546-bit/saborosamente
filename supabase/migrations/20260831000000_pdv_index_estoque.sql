-- ============================================================
-- PDV: index para busca rápida por código de barras (EAN)
-- e função RPC para decrementar estoque ao finalizar venda.
-- ============================================================

-- Index para busca por codigo_integracao (EAN do leitor de barras)
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_integracao
  ON public.produtos(codigo_integracao);

-- Função para decrementar estoque (só quando controle_estoque = true).
-- Chamada após inserir itens do pedido PDV.
CREATE OR REPLACE FUNCTION public.decrementar_estoque(p_produto_id uuid, p_qtd int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.produtos
  SET estoque_atual = GREATEST(0, estoque_atual - p_qtd)
  WHERE id = p_produto_id
    AND controle_estoque = true;
END;
$$;

-- Garante que a coluna codigo_integracao exista (pode já existir manualmente)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS codigo_integracao text;

-- Garante coluna origem em pedidos (pra filtrar PDV vs site)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'site';

NOTIFY pgrst, 'reload schema';
