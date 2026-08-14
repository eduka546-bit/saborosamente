-- ============================================================
-- SETUP COMPLETO — Saborosamente
-- Execute este arquivo no Supabase SQL Editor
-- Todas as migrações pendentes em ordem segura (IF NOT EXISTS / DROP IF EXISTS)
-- ============================================================

-- ── 1. Colunas extras em pedidos ──────────────────────────────────────────────
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS avaliacao_enviada boolean DEFAULT false;

-- ── 2. Colunas extras em whatsapp_conversas ───────────────────────────────────
ALTER TABLE public.whatsapp_conversas
  ADD COLUMN IF NOT EXISTS pedido_em_andamento jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aguardando_avaliacao uuid DEFAULT NULL;

-- ── 3. Colunas extras em profiles ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS codigo_indicacao text UNIQUE,
  ADD COLUMN IF NOT EXISTS indicado_por text;

-- ── 4. Coluna notificado_em em carrinhos_abandonados ─────────────────────────
ALTER TABLE public.carrinhos_abandonados
  ADD COLUMN IF NOT EXISTS notificado_em timestamptz DEFAULT NULL;

-- ── 5. config_impressao em site_settings ──────────────────────────────────────
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS config_impressao jsonb DEFAULT '{
    "impressao_automatica": false,
    "impressora_ip": "",
    "impressora_porta": "9100",
    "imprimir_ao_confirmar": true,
    "imprimir_ao_entregar": false,
    "copias": "1",
    "tamanho_papel": "80mm"
  }'::jsonb;

-- ── 6. Tabela avaliacoes ───────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS "admin_all_avaliacoes" ON public.avaliacoes;
CREATE POLICY "admin_all_avaliacoes" ON public.avaliacoes FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON public.avaliacoes TO anon;
GRANT ALL ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

-- ── 7. Tabela indicacoes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.indicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  indicador_telefone text,
  indicado_telefone text NOT NULL,
  indicado_email text,
  codigo text UNIQUE NOT NULL,
  status text DEFAULT 'pendente',
  pedido_indicado_id uuid,
  cashback_gerado numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  convertido_em timestamptz
);
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_indicacoes" ON public.indicacoes;
DROP POLICY IF EXISTS "user_own_indicacoes" ON public.indicacoes;
CREATE POLICY "admin_all_indicacoes" ON public.indicacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_own_indicacoes" ON public.indicacoes FOR SELECT TO authenticated
  USING (indicador_user_id = auth.uid());
GRANT SELECT ON public.indicacoes TO anon;
GRANT ALL ON public.indicacoes TO authenticated;
GRANT ALL ON public.indicacoes TO service_role;

-- ── 8. Tabela agente_arquivos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agente_arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL,
  tipo text NOT NULL,
  url text NOT NULL,
  storage_path text,
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.agente_arquivos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_agente_arquivos" ON public.agente_arquivos;
CREATE POLICY "admin_all_agente_arquivos" ON public.agente_arquivos FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON public.agente_arquivos TO anon;
GRANT ALL ON public.agente_arquivos TO authenticated;
GRANT ALL ON public.agente_arquivos TO service_role;

-- ── 9. Tabela agente_modulos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agente_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  conteudo text NOT NULL,
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.agente_modulos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_modulos" ON public.agente_modulos;
CREATE POLICY "admin_all_modulos" ON public.agente_modulos FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT ON public.agente_modulos TO anon;
GRANT ALL ON public.agente_modulos TO authenticated;
GRANT ALL ON public.agente_modulos TO service_role;

-- ── 10. Role admin para usuário principal ─────────────────────────────────────
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'anabolic.foodsbs@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- ── 11. RLS profiles — garantir INSERT e UPDATE ───────────────────────────────
GRANT INSERT ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── 12. Realtime nas tabelas principais ───────────────────────────────────────
DO $$
BEGIN
  -- pedidos (para notificações no admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;

  -- pedido_itens
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pedido_itens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_itens;
  END IF;

  -- whatsapp_conversas (para alertas de handoff)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'whatsapp_conversas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversas;
  END IF;
END $$;

-- ── 13. Garante linha única em site_settings ──────────────────────────────────
INSERT INTO public.site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- ── 14. Frete promocional SBS — delivery_rates check ─────────────────────────
-- Apenas verificação — taxa R$5,00 para SBS com 5+ itens é lógica de frontend (cart.tsx)
-- Nenhuma alteração de banco necessária aqui.

-- ── FIM ───────────────────────────────────────────────────────────────────────
SELECT 'Setup concluído com sucesso!' AS resultado;
