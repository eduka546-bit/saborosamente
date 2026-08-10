-- Cria tabela de cupons de desconto
CREATE TABLE IF NOT EXISTS cupons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      text NOT NULL UNIQUE,
  tipo        text NOT NULL DEFAULT 'Fixo',   -- 'Fixo' | 'Percentual' | 'Entrega Grátis'
  valor       numeric NOT NULL DEFAULT 0,
  regra       text,
  validade    date,
  ativo       boolean NOT NULL DEFAULT true,
  uso         integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Habilita RLS
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;

-- Admin pode fazer tudo
CREATE POLICY "admin_all" ON cupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Qualquer pessoa autenticada pode ler cupons ativos (para validar no checkout)
CREATE POLICY "read_active" ON cupons
  FOR SELECT USING (ativo = true);
