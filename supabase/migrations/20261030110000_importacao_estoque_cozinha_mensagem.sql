-- Estoque pronto: importação por mensagem, separada do estoque da loja.
-- Lotes importados não correspondem a uma produção (não descontar ingredientes).
ALTER TABLE public.cozinha_lotes_producao
  ALTER COLUMN producao_id DROP NOT NULL;

ALTER TABLE public.cozinha_lotes_producao
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'producao';
ALTER TABLE public.cozinha_lotes_producao
  DROP CONSTRAINT IF EXISTS cozinha_lotes_producao_origem_check;
ALTER TABLE public.cozinha_lotes_producao
  ADD CONSTRAINT cozinha_lotes_producao_origem_check CHECK (origem IN ('producao','importacao'));

CREATE TABLE IF NOT EXISTS public.cozinha_importacoes_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modo text NOT NULL CHECK (modo IN ('substituir','somar')),
  itens jsonb NOT NULL,
  importado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cozinha_importacoes_estoque ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cozinha consulta importacoes estoque" ON public.cozinha_importacoes_estoque;
CREATE POLICY "cozinha consulta importacoes estoque" ON public.cozinha_importacoes_estoque
  FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'::public.app_role)
    OR public.has_role((select auth.uid()), 'cozinha'::public.app_role));
REVOKE ALL ON public.cozinha_importacoes_estoque FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cozinha_importacoes_estoque TO authenticated;

CREATE OR REPLACE FUNCTION public.importar_estoque_cozinha(
  p_itens jsonb, p_modo text DEFAULT 'substituir'
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  item record;
  tipo text;
  coluna text;
  tamanho_real text;
  total integer := 0;
  importacao uuid;
BEGIN
  IF NOT (
    public.has_role((select auth.uid()), 'admin'::public.app_role)
    OR public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Acesso não autorizado' USING errcode = '42501';
  END IF;
  IF p_modo IS NULL OR p_modo NOT IN ('substituir','somar') THEN
    RAISE EXCEPTION 'Modo de importação inválido';
  END IF;
  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array'
     OR jsonb_array_length(p_itens) = 0 OR jsonb_array_length(p_itens) > 300 THEN
    RAISE EXCEPTION 'Informe entre 1 e 300 itens válidos';
  END IF;
  -- A cozinha só aceita produtos existentes e tamanhos compatíveis.
  -- O complemento 150g ocupa a coluna estoque_200g do cadastro legado.
  FOR item IN
    SELECT x.produto_id, x.tamanho, x.quantidade
    FROM jsonb_to_recordset(p_itens) AS x(produto_id uuid, tamanho text, quantidade integer)
  LOOP
    IF item.produto_id IS NULL OR item.quantidade IS NULL OR
       item.quantidade < 0 OR item.quantidade > 100000 THEN
      RAISE EXCEPTION 'Produto ou quantidade inválida na lista';
    END IF;
    SELECT p.tipo_produto INTO tipo FROM public.produtos p WHERE p.id = item.produto_id;
    IF tipo IS NULL OR tipo NOT IN ('marmita','sopa','complemento') THEN
      RAISE EXCEPTION 'Produto inexistente ou incompatível com estoque da cozinha: %', item.produto_id;
    END IF;
    IF NOT (
      (tipo = 'marmita' AND item.tamanho IN ('200','300','400')) OR
      (tipo = 'sopa' AND item.tamanho = '400') OR
      (tipo = 'complemento' AND item.tamanho IN ('150','200'))
    ) THEN
      RAISE EXCEPTION 'Tamanho incompatível para o produto %: %', item.produto_id, item.tamanho;
    END IF;
  END LOOP;
  IF EXISTS (
    SELECT 1 FROM (
      SELECT x.produto_id,
        CASE WHEN x.tamanho = '150' THEN '200' ELSE x.tamanho END tamanho_real
      FROM jsonb_to_recordset(p_itens) AS x(produto_id uuid, tamanho text, quantidade integer)
    ) z GROUP BY produto_id, tamanho_real HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'A lista contém produtos e tamanhos repetidos';
  END IF;

  -- Serializa contra transferências e conclusões de produção.
  LOCK TABLE public.cozinha_estoque_marmitas, public.cozinha_lotes_producao
    IN SHARE ROW EXCLUSIVE MODE;
  INSERT INTO public.cozinha_importacoes_estoque(modo, itens, importado_por)
    VALUES(p_modo, p_itens, (select auth.uid())) RETURNING id INTO importacao;
  IF p_modo = 'substituir' THEN
    UPDATE public.cozinha_estoque_marmitas SET
      estoque_200g = 0, estoque_300g = 0, estoque_400g = 0,
      updated_at = now(), updated_by = (select auth.uid());
    -- Preserva os lotes e transferências históricos, mas não seus saldos antigos.
    UPDATE public.cozinha_lotes_producao SET quantidade_disponivel = 0
      WHERE quantidade_disponivel > 0;
  END IF;
  FOR item IN
    SELECT x.produto_id, x.tamanho, x.quantidade
    FROM jsonb_to_recordset(p_itens) AS x(produto_id uuid, tamanho text, quantidade integer)
  LOOP
    tamanho_real := CASE WHEN item.tamanho = '150' THEN '200' ELSE item.tamanho END;
    coluna := CASE tamanho_real
      WHEN '200' THEN 'estoque_200g'
      WHEN '300' THEN 'estoque_300g'
      WHEN '400' THEN 'estoque_400g'
      ELSE NULL END;
    INSERT INTO public.cozinha_estoque_marmitas(produto_id, updated_by)
      VALUES(item.produto_id,(select auth.uid()))
      ON CONFLICT(produto_id) DO NOTHING;
    EXECUTE format(
      'UPDATE public.cozinha_estoque_marmitas SET %I = %I + $1, updated_at = now(), updated_by = $2 WHERE produto_id = $3',
      coluna, coluna
    ) USING item.quantidade, (select auth.uid()), item.produto_id;
    IF item.quantidade > 0 THEN
      INSERT INTO public.cozinha_lotes_producao
        (producao_id, produto_id, tamanho, quantidade_inicial,
         quantidade_disponivel, origem, observacao)
      VALUES
        (NULL, item.produto_id, tamanho_real, item.quantidade,
         item.quantidade, 'importacao', 'Saldo manual da importação ' || importacao::text);
    END IF;
    total := total + item.quantidade;
  END LOOP;
  RETURN total;
END;
$$;
REVOKE ALL ON FUNCTION public.importar_estoque_cozinha(jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.importar_estoque_cozinha(jsonb,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
