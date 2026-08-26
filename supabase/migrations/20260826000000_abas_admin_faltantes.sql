-- ============================================================================
-- Abas admin que retornavam 404/400: tabelas e colunas faltantes.
-- Segue o padrão do projeto: RLS + policies via public.has_role(auth.uid(),'admin')
-- para escrita, e GRANTs explícitos. Idempotente (IF NOT EXISTS).
-- ============================================================================

-- ---------- acompanhamentos ----------
CREATE TABLE IF NOT EXISTS public.acompanhamentos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  descricao  text,
  preco      numeric(10, 2) NOT NULL DEFAULT 0,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- embalagens ----------
CREATE TABLE IF NOT EXISTS public.embalagens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  descricao  text,
  custo      numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- entregadores ----------
CREATE TABLE IF NOT EXISTS public.entregadores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  telefone   text,
  veiculo    text,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- unidades ----------
CREATE TABLE IF NOT EXISTS public.unidades (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  endereco   text,
  telefone   text,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- ouvidoria ----------
CREATE TABLE IF NOT EXISTS public.ouvidoria (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  mensagem   text NOT NULL,
  status     text NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- complementos (grupos + itens) ----------
CREATE TABLE IF NOT EXISTS public.complemento_grupos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  descricao    text,
  obrigatorio  boolean NOT NULL DEFAULT false,
  min_escolhas int NOT NULL DEFAULT 0,
  max_escolhas int NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.complemento_itens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id   uuid NOT NULL REFERENCES public.complemento_grupos (id) ON DELETE CASCADE,
  nome       text NOT NULL,
  preco      numeric(10, 2) NOT NULL DEFAULT 0,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- cashback (saldo + transações) ----------
CREATE TABLE IF NOT EXISTS public.cashback_saldo (
  user_id    uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  saldo      numeric(10, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.cashback_transacoes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  pedido_id  uuid,
  tipo       text NOT NULL,
  valor      numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- colunas faltantes em site_settings ----------
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS parametros_loja              jsonb,
  ADD COLUMN IF NOT EXISTS avisos_informativos          jsonb,
  ADD COLUMN IF NOT EXISTS horarios_funcionamento       jsonb,
  ADD COLUMN IF NOT EXISTS cashback_ativo               boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cashback_percentual          numeric(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cashback_validade_dias       int DEFAULT 90,
  ADD COLUMN IF NOT EXISTS cashback_minimo_uso          numeric(10, 2) DEFAULT 5,
  ADD COLUMN IF NOT EXISTS cashback_limite_desconto_pct numeric(5, 2) DEFAULT 50;

-- ============================================================================
-- GRANTs
-- ============================================================================
GRANT SELECT ON public.acompanhamentos, public.embalagens, public.complemento_grupos,
  public.complemento_itens TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.acompanhamentos, public.embalagens, public.entregadores, public.unidades,
  public.ouvidoria, public.complemento_grupos, public.complemento_itens,
  public.cashback_saldo, public.cashback_transacoes TO authenticated;
GRANT ALL ON
  public.acompanhamentos, public.embalagens, public.entregadores, public.unidades,
  public.ouvidoria, public.complemento_grupos, public.complemento_itens,
  public.cashback_saldo, public.cashback_transacoes TO service_role;

-- ============================================================================
-- RLS + policies (leitura pública onde faz sentido; escrita só admin)
-- ============================================================================
ALTER TABLE public.acompanhamentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embalagens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregadores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouvidoria           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complemento_grupos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complemento_itens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_saldo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_transacoes ENABLE ROW LEVEL SECURITY;

-- Catálogo (leitura pública, escrita admin)
DROP POLICY IF EXISTS "acompanhamentos_read" ON public.acompanhamentos;
CREATE POLICY "acompanhamentos_read" ON public.acompanhamentos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "acompanhamentos_admin" ON public.acompanhamentos;
CREATE POLICY "acompanhamentos_admin" ON public.acompanhamentos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "embalagens_read" ON public.embalagens;
CREATE POLICY "embalagens_read" ON public.embalagens FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "embalagens_admin" ON public.embalagens;
CREATE POLICY "embalagens_admin" ON public.embalagens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "complemento_grupos_read" ON public.complemento_grupos;
CREATE POLICY "complemento_grupos_read" ON public.complemento_grupos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "complemento_grupos_admin" ON public.complemento_grupos;
CREATE POLICY "complemento_grupos_admin" ON public.complemento_grupos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "complemento_itens_read" ON public.complemento_itens;
CREATE POLICY "complemento_itens_read" ON public.complemento_itens FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "complemento_itens_admin" ON public.complemento_itens;
CREATE POLICY "complemento_itens_admin" ON public.complemento_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Somente admin (dados operacionais)
DROP POLICY IF EXISTS "entregadores_admin" ON public.entregadores;
CREATE POLICY "entregadores_admin" ON public.entregadores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "unidades_admin" ON public.unidades;
CREATE POLICY "unidades_admin" ON public.unidades FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ouvidoria: cliente cria/lê a própria; admin lê e atualiza tudo
DROP POLICY IF EXISTS "ouvidoria_insert_own" ON public.ouvidoria;
CREATE POLICY "ouvidoria_insert_own" ON public.ouvidoria FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "ouvidoria_select" ON public.ouvidoria;
CREATE POLICY "ouvidoria_select" ON public.ouvidoria FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "ouvidoria_admin_update" ON public.ouvidoria;
CREATE POLICY "ouvidoria_admin_update" ON public.ouvidoria FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cashback: usuário lê o próprio; admin lê tudo; escrita via service_role/admin
DROP POLICY IF EXISTS "cashback_saldo_select" ON public.cashback_saldo;
CREATE POLICY "cashback_saldo_select" ON public.cashback_saldo FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "cashback_saldo_admin" ON public.cashback_saldo;
CREATE POLICY "cashback_saldo_admin" ON public.cashback_saldo FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "cashback_transacoes_select" ON public.cashback_transacoes;
CREATE POLICY "cashback_transacoes_select" ON public.cashback_transacoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "cashback_transacoes_admin" ON public.cashback_transacoes;
CREATE POLICY "cashback_transacoes_admin" ON public.cashback_transacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
