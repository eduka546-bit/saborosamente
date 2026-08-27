-- ============================================================
-- Estoque por tamanho (200g / 300g / 400g)
-- Substitui o campo único estoque_atual por 3 colunas granulares.
-- ============================================================

-- Novas colunas
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS estoque_200g integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_300g integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_400g integer NOT NULL DEFAULT 0;

-- Ativa controle de estoque em todos os produtos ativos
UPDATE public.produtos SET controle_estoque = true WHERE ativo = true;

-- RPC atualizada: decrementa por tamanho específico.
CREATE OR REPLACE FUNCTION public.decrementar_estoque(p_produto_id uuid, p_qtd int, p_tamanho text DEFAULT '300g')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_tamanho = '200g' THEN
    UPDATE public.produtos SET estoque_200g = GREATEST(0, estoque_200g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  ELSIF p_tamanho = '400g' THEN
    UPDATE public.produtos SET estoque_400g = GREATEST(0, estoque_400g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  ELSE
    UPDATE public.produtos SET estoque_300g = GREATEST(0, estoque_300g - p_qtd) WHERE id = p_produto_id AND controle_estoque = true;
  END IF;
END;
$$;

-- ── Seed: valores da planilha de estoque (agosto/2026) ──────────────────────
-- Marmitas (200g / 300g / 400g)
UPDATE public.produtos SET estoque_200g=7, estoque_300g=8, estoque_400g=2 WHERE nome ILIKE '%Tiras de Alcatra ao Molho Madeira%';
UPDATE public.produtos SET estoque_200g=2, estoque_300g=4, estoque_400g=5 WHERE nome ILIKE '%Alm_ndegas%Sugo%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=7, estoque_400g=9 WHERE nome ILIKE '%Nhoque%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=5, estoque_400g=14 WHERE nome ILIKE '%Vaca Atolada%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=0, estoque_400g=6 WHERE nome ILIKE '%Arroz Carreteiro%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=1, estoque_400g=0 WHERE nome ILIKE '%Frango Grelhado%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=2, estoque_400g=2 WHERE nome ILIKE '%Sobrecoxa%Ensopada%' OR nome ILIKE '%Sob%Ensopada%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=4, estoque_400g=3 WHERE nome ILIKE '%Parmegiana%Frango%' OR nome ILIKE '%Parm%Frango%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=7, estoque_400g=3 WHERE nome ILIKE '%Parmegiana%Carne%' OR nome ILIKE '%Parm%Carne%';
UPDATE public.produtos SET estoque_200g=4, estoque_300g=8, estoque_400g=4 WHERE nome ILIKE '%Strogonoff%Frango%' OR nome ILIKE '%Est%Frango%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=13, estoque_400g=12 WHERE nome ILIKE '%Strogonoff%Carne%' OR nome ILIKE '%Est%Carne%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=13, estoque_400g=14 WHERE nome ILIKE '%Escondidinho%Frango%' OR nome ILIKE '%Esc%Frango%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=13, estoque_400g=9 WHERE nome ILIKE '%Escondidinho%Carne%' OR nome ILIKE '%Esc%Carne%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=9, estoque_400g=8 WHERE nome ILIKE '%Fil_%Til_pia%' OR nome ILIKE '%Tilapia%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=3, estoque_400g=12 WHERE nome ILIKE '%Feijoada%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=16, estoque_400g=10 WHERE nome ILIKE '%Bife ao Molho%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=10, estoque_400g=12 WHERE nome ILIKE '%Frango Americano%' AND nome NOT ILIKE '%Complemento%';
UPDATE public.produtos SET estoque_200g=5, estoque_300g=5, estoque_400g=7 WHERE nome ILIKE '%Patinho%Mo_do%' OR nome ILIKE '%Pat%Mo_do%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=2, estoque_400g=12 WHERE nome ILIKE '%Lasanha%Frango%' OR nome ILIKE '%Las%Frango%';
UPDATE public.produtos SET estoque_200g=0, estoque_300g=9, estoque_400g=12 WHERE nome ILIKE '%Lasanha%Carne%' OR nome ILIKE '%Las%Carne%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=15, estoque_400g=14 WHERE nome ILIKE '%Panqueca%Frango%' OR nome ILIKE '%Panq%Frango%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=12, estoque_400g=6 WHERE nome ILIKE '%Panqueca%Carne%' OR nome ILIKE '%Panq%Carne%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=5, estoque_400g=7 WHERE nome ILIKE '%Penne%Frango%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=16, estoque_400g=12 WHERE nome ILIKE '%Carbonara%';
UPDATE public.produtos SET estoque_200g=6, estoque_300g=14, estoque_400g=9 WHERE nome ILIKE '%Espaguete%Alm_ndega%' OR nome ILIKE '%Esp%Alm_ndega%';
UPDATE public.produtos SET estoque_200g=1, estoque_300g=6, estoque_400g=8 WHERE nome ILIKE '%Talharim%Bolonhesa%' OR nome ILIKE '%Tal%Bol%';
UPDATE public.produtos SET estoque_200g=7, estoque_300g=10, estoque_400g=5 WHERE nome ILIKE '%Penne%4 Queijos%' OR nome ILIKE '%Penne%Queijos%';
UPDATE public.produtos SET estoque_200g=8, estoque_300g=16, estoque_400g=11 WHERE nome ILIKE '%Penne%Creme%' OR nome ILIKE '%Penne Alla Creme%';

-- Sopas (tamanho único — uso 300g como referência)
UPDATE public.produtos SET estoque_300g=1 WHERE nome ILIKE '%Frango%Legumes%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=2 WHERE nome ILIKE '%Carne%Legumes%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=10 WHERE nome ILIKE '%Legumes%' AND nome NOT ILIKE '%Frango%' AND nome NOT ILIKE '%Carne%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=8 WHERE nome ILIKE '%Feij_o%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%sopa%';
UPDATE public.produtos SET estoque_300g=12 WHERE nome ILIKE '%Bucho%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Canja%';
UPDATE public.produtos SET estoque_300g=4 WHERE nome ILIKE '%Ab_bora%Caboti_%';
UPDATE public.produtos SET estoque_300g=3 WHERE nome ILIKE '%Mandioquinha%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Creme%Batata%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Caldo%Aipim%Carne%';
UPDATE public.produtos SET estoque_300g=12 WHERE nome ILIKE '%Caldo Verde%';
UPDATE public.produtos SET estoque_300g=10 WHERE nome ILIKE '%Caldo%Peixe%';

-- Complementos (tamanho único — uso 300g)
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Frango Desfiado%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=0 WHERE nome ILIKE '%Frango Americano%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=8 WHERE nome ILIKE '%Frango Ensopado%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=10 WHERE nome ILIKE '%Tiras%Bife%Molho%';
UPDATE public.produtos SET estoque_300g=6 WHERE nome ILIKE '%Carne Mo_da%' AND (SELECT nome FROM categorias WHERE id = categoria_id) ILIKE '%complemento%';
UPDATE public.produtos SET estoque_300g=11 WHERE nome ILIKE '%Carne%Panela%';

NOTIFY pgrst, 'reload schema';
