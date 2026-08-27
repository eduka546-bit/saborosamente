-- ============================================================================
-- Colunas e tabelas faltantes para as telas do admin salvarem corretamente.
-- Idempotente: CREATE TABLE / ADD COLUMN IF NOT EXISTS. Seguro re-rodar.
-- Padrão do projeto: RLS + policies via public.has_role(auth.uid(),'admin').
-- ============================================================================

-- ── categorias: faltava a coluna 'descricao' (erro no admin de categorias) ──
ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS descricao text;

-- ── faq: perguntas frequentes (admin/config/faq) ──
CREATE TABLE IF NOT EXISTS public.faq (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta   text NOT NULL,
  resposta   text NOT NULL,
  ordem      int NOT NULL DEFAULT 0,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faq
  ADD COLUMN IF NOT EXISTS pergunta text,
  ADD COLUMN IF NOT EXISTS resposta text,
  ADD COLUMN IF NOT EXISTS ordem int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ── automacoes: fluxos de WhatsApp (admin/automacoes) ──
CREATE TABLE IF NOT EXISTS public.automacoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL DEFAULT 'Nova automação',
  descricao       text,
  ativo           boolean NOT NULL DEFAULT false,
  gatilho_tipo    text,
  gatilho_valor   jsonb,
  nos             jsonb NOT NULL DEFAULT '[]'::jsonb,
  execucoes_total int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automacoes
  ADD COLUMN IF NOT EXISTS nome text DEFAULT 'Nova automação',
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gatilho_tipo text,
  ADD COLUMN IF NOT EXISTS gatilho_valor jsonb,
  ADD COLUMN IF NOT EXISTS nos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS execucoes_total int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── Reforça colunas das tabelas criadas antes (garante que existem) ──
ALTER TABLE public.acompanhamentos
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS preco numeric(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

ALTER TABLE public.embalagens
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS custo numeric(10, 2) DEFAULT 0;

ALTER TABLE public.entregadores
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS veiculo text,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

ALTER TABLE public.unidades
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- ── avaliacoes: feedbacks dos pedidos (admin/avaliacoes) ──
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id  uuid,
  user_id    uuid,
  nota       int,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- GRANTs
-- ============================================================================
GRANT SELECT ON public.faq, public.categorias TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.faq, public.automacoes, public.avaliacoes TO authenticated;
GRANT ALL ON public.faq, public.automacoes, public.avaliacoes TO service_role;

-- ============================================================================
-- RLS + policies
-- ============================================================================
ALTER TABLE public.faq        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- FAQ: leitura pública, escrita admin
DROP POLICY IF EXISTS "faq_read" ON public.faq;
CREATE POLICY "faq_read" ON public.faq FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "faq_admin" ON public.faq;
CREATE POLICY "faq_admin" ON public.faq FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Automações: só admin
DROP POLICY IF EXISTS "automacoes_admin" ON public.automacoes;
CREATE POLICY "automacoes_admin" ON public.automacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Avaliações: cliente cria a sua; admin lê/gerencia todas
DROP POLICY IF EXISTS "avaliacoes_insert" ON public.avaliacoes;
CREATE POLICY "avaliacoes_insert" ON public.avaliacoes FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "avaliacoes_select" ON public.avaliacoes;
CREATE POLICY "avaliacoes_select" ON public.avaliacoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "avaliacoes_admin" ON public.avaliacoes;
CREATE POLICY "avaliacoes_admin" ON public.avaliacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Força o PostgREST a recarregar o schema cache (resolve "could not find column").
NOTIFY pgrst, 'reload schema';
