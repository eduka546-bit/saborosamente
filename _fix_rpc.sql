CREATE OR REPLACE FUNCTION public.decrementar_estoque(p_produto_id uuid, p_qtd int, p_tamanho text DEFAULT '300g')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_tamanho = '200g' OR p_tamanho = '150g' THEN
    UPDATE public.produtos SET estoque_200g = GREATEST(0, estoque_200g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  ELSIF p_tamanho = '400g' THEN
    UPDATE public.produtos SET estoque_400g = GREATEST(0, estoque_400g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  ELSE
    UPDATE public.produtos SET estoque_300g = GREATEST(0, estoque_300g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  END IF;
END;
$$;
