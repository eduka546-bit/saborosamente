-- ============================================================
-- SINCRONIZAÇÃO COMPLETA DO SCHEMA — Saborosamente
-- Script idempotente: pode ser executado quantas vezes precisar.
-- ============================================================

-- ---------- PRODUTOS ----------
CREATE TABLE IF NOT EXISTS public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS preco numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS categoria_id uuid,
  ADD COLUMN IF NOT EXISTS imagem_url text,
  ADD COLUMN IF NOT EXISTS imagens jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS peso text,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS destaque boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque integer,
  ADD COLUMN IF NOT EXISTS info_nutricional jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS restricoes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.produtos SET imagens = '[]'::jsonb WHERE imagens IS NULL;

-- ---------- CATEGORIAS ----------
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ---------- PEDIDOS ----------
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nome_cliente text,
  ADD COLUMN IF NOT EXISTS telefone_cliente text,
  ADD COLUMN IF NOT EXISTS email_cliente text,
  ADD COLUMN IF NOT EXISTS metodo_entrega text,
  ADD COLUMN IF NOT EXISTS horario_recebimento text,
  ADD COLUMN IF NOT EXISTS metodo_pagamento text,
  ADD COLUMN IF NOT EXISTS observacao text,
  ADD COLUMN IF NOT EXISTS valor_total numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxa_entrega numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_aplicado numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cupom_codigo text,
  ADD COLUMN IF NOT EXISTS troco text,
  ADD COLUMN IF NOT EXISTS tipo_cartao text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pendente',
  ADD COLUMN IF NOT EXISTS endereco_cep text,
  ADD COLUMN IF NOT EXISTS endereco_rua text,
  ADD COLUMN IF NOT EXISTS endereco_numero text,
  ADD COLUMN IF NOT EXISTS endereco_bairro text,
  ADD COLUMN IF NOT EXISTS endereco_cidade text,
  ADD COLUMN IF NOT EXISTS endereco_complemento text,
  ADD COLUMN IF NOT EXISTS endereco_referencia text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_pedidos_user_id ON public.pedidos(user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos(created_at DESC);

-- ---------- PEDIDO_ITENS ----------
CREATE TABLE IF NOT EXISTS public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id uuid,
  quantidade integer DEFAULT 1,
  preco_unitario numeric(10,2) DEFAULT 0,
  observacao text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON public.pedido_itens(pedido_id);

-- ---------- ENDEREÇOS DO CLIENTE ----------
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  apelido text,
  cep text,
  rua text,
  numero text,
  bairro text,
  cidade text,
  complemento text,
  referencia text,
  principal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- ---------- TAXAS DE ENTREGA ----------
CREATE TABLE IF NOT EXISTS public.delivery_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade text,
  bairro text,
  valor numeric(10,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ---------- CONFIGURAÇÕES DO SITE ----------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS banner_link text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS card_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS meal_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

INSERT INTO public.site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- ---------- PERFIS: colunas extras ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- GRANTS (obrigatórios para a Data API funcionar)
-- ============================================================
GRANT SELECT ON public.produtos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

GRANT SELECT ON public.categorias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;

GRANT SELECT, INSERT ON public.pedidos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;

GRANT SELECT, INSERT ON public.pedido_itens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;
GRANT ALL ON public.pedido_itens TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_addresses TO authenticated;
GRANT ALL ON public.user_addresses TO service_role;

GRANT SELECT ON public.delivery_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_rates TO authenticated;
GRANT ALL ON public.delivery_rates TO service_role;

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Catálogo público
DROP POLICY IF EXISTS "produtos_public_read" ON public.produtos;
CREATE POLICY "produtos_public_read" ON public.produtos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "produtos_admin_write" ON public.produtos;
CREATE POLICY "produtos_admin_write" ON public.produtos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "categorias_public_read" ON public.categorias;
CREATE POLICY "categorias_public_read" ON public.categorias FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "categorias_admin_write" ON public.categorias;
CREATE POLICY "categorias_admin_write" ON public.categorias FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "rates_public_read" ON public.delivery_rates;
CREATE POLICY "rates_public_read" ON public.delivery_rates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "rates_admin_write" ON public.delivery_rates;
CREATE POLICY "rates_admin_write" ON public.delivery_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "settings_public_read" ON public.site_settings;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "settings_admin_write" ON public.site_settings;
CREATE POLICY "settings_admin_write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Pedidos: cliente vê os próprios; convidado pode criar; admin vê tudo
DROP POLICY IF EXISTS "pedidos_insert_any" ON public.pedidos;
CREATE POLICY "pedidos_insert_any" ON public.pedidos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "pedidos_select_own" ON public.pedidos;
CREATE POLICY "pedidos_select_own" ON public.pedidos FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "pedidos_admin_update" ON public.pedidos;
CREATE POLICY "pedidos_admin_update" ON public.pedidos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "itens_insert_any" ON public.pedido_itens;
CREATE POLICY "itens_insert_any" ON public.pedido_itens FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "itens_select_own" ON public.pedido_itens;
CREATE POLICY "itens_select_own" ON public.pedido_itens FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid())
  );

-- Endereços: totalmente privados
DROP POLICY IF EXISTS "addresses_own_all" ON public.user_addresses;
CREATE POLICY "addresses_own_all" ON public.user_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
