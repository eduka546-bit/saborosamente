-- Tabela para rastrear carrinhos abandonados
CREATE TABLE IF NOT EXISTS carrinhos_abandonados (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text NOT NULL,                -- identificador anônimo (localStorage)
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome          text,
  telefone      text,
  email         text,
  itens         jsonb NOT NULL DEFAULT '[]',  -- snapshot dos itens do carrinho
  valor_total   numeric NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'abandonado', -- 'abandonado' | 'recuperado' | 'convertido'
  cupom_oferta  text,                         -- cupom gerado pelo exit intent
  origem        text DEFAULT 'exit_intent',   -- 'exit_intent' | 'timeout' | 'manual'
  convertido_em timestamptz,                  -- quando virou pedido
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_carrinhos_user_id ON carrinhos_abandonados(user_id);
CREATE INDEX IF NOT EXISTS idx_carrinhos_status ON carrinhos_abandonados(status);
CREATE INDEX IF NOT EXISTS idx_carrinhos_created ON carrinhos_abandonados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carrinhos_session ON carrinhos_abandonados(session_id);

-- RLS
ALTER TABLE carrinhos_abandonados ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "admin_all_carrinhos" ON carrinhos_abandonados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Usuário logado pode inserir/atualizar o próprio carrinho
CREATE POLICY "user_own_carrinho" ON carrinhos_abandonados
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- Service role (anon) pode inserir
CREATE POLICY "anon_insert_carrinho" ON carrinhos_abandonados
  FOR INSERT WITH CHECK (true);
