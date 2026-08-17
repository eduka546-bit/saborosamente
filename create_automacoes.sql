-- ============================================================
-- Sistema de Automações WhatsApp — Funil estilo RD Station
-- ============================================================

-- Tabela principal de automações (fluxos)
CREATE TABLE IF NOT EXISTS public.automacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  gatilho_tipo text NOT NULL,
  -- Tipos de gatilho:
  -- 'keyword'        → cliente enviou palavra/frase específica
  -- 'primeira_msg'   → primeira mensagem de um novo contato
  -- 'pedido_criado'  → pedido foi registrado
  -- 'status_pedido'  → status do pedido mudou para X
  -- 'sem_resposta'   → cliente não respondeu em X horas
  -- 'tag'            → cliente recebeu uma tag específica
  gatilho_valor jsonb DEFAULT '{}'::jsonb,
  -- Ex para keyword: {"palavras": ["promoção","desconto","oferta"], "modo": "any"}
  -- Ex para status_pedido: {"status": "entregue"}
  -- Ex para sem_resposta: {"horas": 2}
  nos jsonb DEFAULT '[]'::jsonb,
  -- Array de nós do fluxo em ordem de execução
  -- Cada nó: { id, tipo, config, proximo_id, proximo_sim_id, proximo_nao_id }
  execucoes_total integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Histórico de execuções por conversa
CREATE TABLE IF NOT EXISTS public.automacao_execucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automacao_id uuid REFERENCES public.automacoes(id) ON DELETE CASCADE,
  conversa_id uuid,
  telefone text,
  no_atual_id text,   -- ID do nó em execução
  status text DEFAULT 'em_andamento', -- 'em_andamento' | 'concluida' | 'cancelada'
  dados jsonb DEFAULT '{}'::jsonb,    -- dados coletados durante o fluxo
  aguardando_ate timestamptz,         -- para nós de "aguardar X horas"
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tags de contatos (para segmentação)
CREATE TABLE IF NOT EXISTS public.contato_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(telefone, tag)
);

-- RLS
ALTER TABLE public.automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automacao_execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_automacoes" ON public.automacoes;
CREATE POLICY "admin_all_automacoes" ON public.automacoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all_execucoes" ON public.automacao_execucoes;
CREATE POLICY "admin_all_execucoes" ON public.automacao_execucoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all_tags" ON public.contato_tags;
CREATE POLICY "admin_all_tags" ON public.contato_tags FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.automacoes TO authenticated, service_role;
GRANT ALL ON public.automacao_execucoes TO authenticated, service_role;
GRANT ALL ON public.contato_tags TO authenticated, service_role;
GRANT SELECT ON public.automacoes TO anon;

-- Realtime para execuções (dashboard ao vivo)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'automacao_execucoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.automacao_execucoes;
  END IF;
END $$;
