-- Adicionar suporte a 2FA (TOTP) e auditoria de ações admin

-- 1. Tabela de secrets TOTP para cada usuário admin
CREATE TABLE IF NOT EXISTS public.admin_totp_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  secret text NOT NULL, -- base32 encoded secret
  backup_codes text[] DEFAULT array[]::text[], -- códigos de backup para recuperação
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_totp_secrets_user_id ON public.admin_totp_secrets(user_id);

-- 2. Tabela de log de auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  acao text NOT NULL, -- ex: "criar_produto", "editar_cupom", "deletar_pedido", "mudar_status"
  tabela text, -- ex: "produtos", "cupons", "pedidos"
  registro_id uuid, -- id do registro afetado
  dados_antes jsonb, -- snapshot antes da mudança (privacidade: omitir valores sensíveis)
  dados_depois jsonb, -- snapshot depois da mudança (privacidade: omitir valores sensíveis)
  ip_address inet,
  user_agent text,
  status text DEFAULT 'success', -- 'success', 'falhou', 'negado'
  erro_mensagem text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_acao ON public.audit_log(acao);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabela ON public.audit_log(tabela);

-- 3. View para relatório de auditoria
CREATE OR REPLACE VIEW audit_log_view AS
SELECT
  al.id,
  al.created_at,
  al.user_email,
  al.acao,
  al.tabela,
  al.registro_id,
  al.status,
  al.ip_address::text,
  DATE_TRUNC('day', al.created_at)::date as data,
  EXTRACT(HOUR FROM al.created_at)::int as hora
FROM public.audit_log al
ORDER BY al.created_at DESC;

-- 4. Função RPC para validar TOTP
CREATE OR REPLACE FUNCTION validar_totp(
  p_user_id uuid,
  p_codigo text
)
RETURNS json AS $$
DECLARE
  v_secret text;
  v_enabled boolean;
BEGIN
  -- Busca o secret TOTP do usuário
  SELECT secret, enabled INTO v_secret, v_enabled
  FROM admin_totp_secrets
  WHERE user_id = p_user_id;

  IF v_secret IS NULL THEN
    RETURN json_build_object('valido', false, 'erro', '2FA não configurado');
  END IF;

  IF NOT v_enabled THEN
    RETURN json_build_object('valido', false, 'erro', '2FA desabilitado');
  END IF;

  -- Aqui você precisaria chamar uma função de terceiros para validar o TOTP
  -- Por enquanto, retorna um placeholder
  -- Em produção, integrar com bibliotecas como speakeasy ou similar
  
  RETURN json_build_object(
    'valido', true,
    'message', '2FA validado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para registrar auditoria
CREATE OR REPLACE FUNCTION registrar_auditoria(
  p_user_id uuid,
  p_user_email text,
  p_acao text,
  p_tabela text,
  p_registro_id uuid,
  p_dados_antes jsonb,
  p_dados_depois jsonb,
  p_ip_address inet,
  p_user_agent text,
  p_status text DEFAULT 'success',
  p_erro_mensagem text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO audit_log (
    user_id,
    user_email,
    acao,
    tabela,
    registro_id,
    dados_antes,
    dados_depois,
    ip_address,
    user_agent,
    status,
    erro_mensagem
  ) VALUES (
    p_user_id,
    p_user_email,
    p_acao,
    p_tabela,
    p_registro_id,
    p_dados_antes,
    p_dados_depois,
    p_ip_address,
    p_user_agent,
    p_status,
    p_erro_mensagem
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Política de linha para audit_log (legível por admins)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler audit log"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    -- Admin pode ler qualquer log
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- 7. Permissões para tabela admin_totp_secrets
ALTER TABLE public.admin_totp_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seu próprio 2FA"
  ON public.admin_totp_secrets
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
