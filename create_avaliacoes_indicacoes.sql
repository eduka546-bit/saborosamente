-- Tabela de avaliações pós-pedido
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  telefone text,
  nota integer CHECK (nota BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_avaliacoes" ON public.avaliacoes FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON public.avaliacoes TO anon;
GRANT ALL ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

-- Tabela de indicações (programa de referral)
CREATE TABLE IF NOT EXISTS public.indicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  indicador_telefone text,
  indicado_telefone text NOT NULL,
  indicado_email text,
  codigo text UNIQUE NOT NULL,         -- código único de indicação (ex: IND-ABCD12)
  status text DEFAULT 'pendente',      -- 'pendente' | 'convertido' | 'pago'
  pedido_indicado_id uuid,             -- pedido que foi feito pelo indicado
  cashback_gerado numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  convertido_em timestamptz
);
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_indicacoes" ON public.indicacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_own_indicacoes" ON public.indicacoes FOR SELECT TO authenticated
  USING (indicador_user_id = auth.uid());
GRANT SELECT ON public.indicacoes TO anon;
GRANT ALL ON public.indicacoes TO authenticated;
GRANT ALL ON public.indicacoes TO service_role;

-- Adiciona coluna de código de indicação em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS codigo_indicacao text UNIQUE,
  ADD COLUMN IF NOT EXISTS indicado_por text; -- código de quem indicou

-- Adiciona coluna de avaliacao_enviada em pedidos (para não mandar duas vezes)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS avaliacao_enviada boolean DEFAULT false;
