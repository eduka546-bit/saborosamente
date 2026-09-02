-- Security hardening, phase 1 (backwards compatible).
--
-- This migration closes exposed customer/admin data, restricts privileged RPCs,
-- and prepares a private authenticated path for abandoned-cart automation.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- Shared authorization predicate for privileged database functions.
CREATE OR REPLACE FUNCTION private.is_admin_or_service()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT auth.jwt() ->> 'role') = 'service_role', false)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'::public.app_role
    );
$$;

REVOKE ALL ON FUNCTION private.is_admin_or_service() FROM PUBLIC, anon, authenticated;

-- Keep the existing helper API compatible with RLS policies, but prevent users
-- from probing the role of arbitrary user IDs.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        _user_id = (SELECT auth.uid())
        OR COALESCE((SELECT auth.jwt() ->> 'role') = 'service_role', false)
      )
  );
$$;

-- This helper is referenced by existing public-read policies, so keep EXECUTE
-- available while ensuring it can only answer for the current caller.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (new.id, new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'telefone');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user'::public.app_role);

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.confirmar_pedido_rascunho(p_pedido_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pedido_id uuid;
  v_cliente_nome text;
  v_cliente_telefone text;
BEGIN
  IF NOT private.is_admin_or_service() THEN
    RAISE EXCEPTION 'Acesso não autorizado' USING ERRCODE = '42501';
  END IF;

  UPDATE public.pedidos
  SET status = 'pendente', updated_at = now()
  WHERE id = p_pedido_id AND status = 'rascunho'
  RETURNING id, nome_cliente, telefone_cliente
  INTO v_pedido_id, v_cliente_nome, v_cliente_telefone;

  IF v_pedido_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pedido não encontrado ou não está em rascunho');
  END IF;

  RETURN json_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'cliente_nome', v_cliente_nome,
    'cliente_telefone', v_cliente_telefone,
    'message', 'Pedido confirmado com sucesso'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_pedido_rascunho(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirmar_pedido_rascunho(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rejeitar_pedido_rascunho(p_pedido_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pedido_id uuid;
BEGIN
  IF NOT private.is_admin_or_service() THEN
    RAISE EXCEPTION 'Acesso não autorizado' USING ERRCODE = '42501';
  END IF;

  UPDATE public.pedidos
  SET status = 'cancelado', updated_at = now()
  WHERE id = p_pedido_id AND status = 'rascunho'
  RETURNING id INTO v_pedido_id;

  IF v_pedido_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pedido não encontrado ou não está em rascunho');
  END IF;

  RETURN json_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'message', 'Pedido rejeitado e cancelado'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rejeitar_pedido_rascunho(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rejeitar_pedido_rascunho(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.incrementar_uso_cupom(p_codigo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_admin_or_service() THEN
    RAISE EXCEPTION 'Acesso não autorizado' USING ERRCODE = '42501';
  END IF;

  UPDATE public.cupons
  SET uso = COALESCE(uso, 0) + 1
  WHERE codigo = p_codigo;
END;
$$;

REVOKE ALL ON FUNCTION public.incrementar_uso_cupom(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.incrementar_uso_cupom(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.decrementar_estoque(p_produto_id uuid, p_qtd integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_admin_or_service() THEN
    RAISE EXCEPTION 'Acesso não autorizado' USING ERRCODE = '42501';
  END IF;
  IF p_qtd IS NULL OR p_qtd <= 0 OR p_qtd > 1000 THEN
    RAISE EXCEPTION 'Quantidade inválida' USING ERRCODE = '22023';
  END IF;

  UPDATE public.produtos
  SET estoque_atual = GREATEST(0, estoque_atual - p_qtd)
  WHERE id = p_produto_id AND controle_estoque = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrementar_estoque(
  p_produto_id uuid,
  p_qtd integer,
  p_tamanho text DEFAULT '300g'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tipo text;
BEGIN
  IF NOT private.is_admin_or_service() THEN
    RAISE EXCEPTION 'Acesso não autorizado' USING ERRCODE = '42501';
  END IF;
  IF p_qtd IS NULL OR p_qtd <= 0 OR p_qtd > 1000 THEN
    RAISE EXCEPTION 'Quantidade inválida' USING ERRCODE = '22023';
  END IF;
  IF p_tamanho NOT IN ('200g', '300g', '400g') THEN
    RAISE EXCEPTION 'Tamanho inválido' USING ERRCODE = '22023';
  END IF;

  SELECT tipo_produto INTO v_tipo
  FROM public.produtos
  WHERE id = p_produto_id;

  IF v_tipo = 'combo' THEN RETURN; END IF;

  IF v_tipo = 'sopa' THEN
    UPDATE public.produtos
    SET estoque_400g = GREATEST(0, estoque_400g - p_qtd)
    WHERE id = p_produto_id AND controle_estoque = true;
    RETURN;
  END IF;

  IF v_tipo IN ('complemento', 'bebida') THEN
    UPDATE public.produtos
    SET estoque_200g = GREATEST(0, estoque_200g - p_qtd)
    WHERE id = p_produto_id AND controle_estoque = true;
    RETURN;
  END IF;

  IF p_tamanho = '200g' THEN
    UPDATE public.produtos SET estoque_200g = GREATEST(0, estoque_200g - p_qtd)
    WHERE id = p_produto_id AND controle_estoque = true;
  ELSIF p_tamanho = '400g' THEN
    UPDATE public.produtos SET estoque_400g = GREATEST(0, estoque_400g - p_qtd)
    WHERE id = p_produto_id AND controle_estoque = true;
  ELSE
    UPDATE public.produtos SET estoque_300g = GREATEST(0, estoque_300g - p_qtd)
    WHERE id = p_produto_id AND controle_estoque = true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.decrementar_estoque(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decrementar_estoque(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrementar_estoque(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrementar_estoque(uuid, integer, text) TO authenticated, service_role;

-- Public tracking remains available, but requires the full 8-character token
-- emitted by the application and exposes no customer contact information.
CREATE OR REPLACE FUNCTION public.rastrear_pedido(p_protocolo text)
RETURNS TABLE(
  id uuid,
  status text,
  created_at timestamptz,
  metodo_entrega text,
  metodo_pagamento text,
  endereco_bairro text,
  endereco_cidade text,
  valor_total numeric,
  taxa_entrega numeric,
  desconto_aplicado numeric,
  itens jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.status,
    p.created_at,
    p.metodo_entrega,
    p.metodo_pagamento,
    p.endereco_bairro,
    p.endereco_cidade,
    p.valor_total,
    p.taxa_entrega,
    p.desconto_aplicado,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'quantidade', pi.quantidade,
          'preco_unitario', pi.preco_unitario,
          'produto_id', pi.produto_id,
          'produtos', jsonb_build_object('nome', pr.nome)
        ))
        FROM public.pedido_itens pi
        LEFT JOIN public.produtos pr ON pr.id = pi.produto_id
        WHERE pi.pedido_id = p.id
      ),
      '[]'::jsonb
    )
  FROM public.pedidos p
  WHERE length(regexp_replace(p_protocolo, '[^0-9a-fA-F]', '', 'g')) = 8
    AND p.id::text ILIKE regexp_replace(p_protocolo, '[^0-9a-fA-F]', '', 'g') || '%'
  ORDER BY p.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.rastrear_pedido(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rastrear_pedido(text) TO anon, authenticated, service_role;

-- Remove policies that exposed every guest order (user_id IS NULL) and collapse
-- duplicated policies into one policy per access path.
DROP POLICY IF EXISTS "user_can_view_own_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "user_select_own_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_select_own" ON public.pedidos;
DROP POLICY IF EXISTS "Qualquer um pode criar pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "anyone_can_insert_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_insert_any" ON public.pedidos;
DROP POLICY IF EXISTS "Admins gerenciam pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "admin_all_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "admin_email_select_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "admin_select_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_admin_update" ON public.pedidos;
DROP POLICY IF EXISTS pedidos_admin_all ON public.pedidos;

CREATE POLICY pedidos_insert_any
ON public.pedidos FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()));

CREATE POLICY pedidos_select_own
ON public.pedidos FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
);

CREATE POLICY pedidos_admin_all
ON public.pedidos FOR ALL
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

REVOKE ALL ON public.pedidos FROM anon;
GRANT INSERT ON public.pedidos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;

-- Tables used exclusively by the admin UI and service-role Edge Functions.
DO $$
DECLARE
  table_name text;
  policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'agente_arquivos',
    'campanhas_whatsapp',
    'campanhas_whatsapp_envios',
    'listas_contatos',
    'contatos_lista'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    policy_name := table_name || '_admin_all';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role((SELECT auth.uid()), ''admin''::public.app_role)) WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::public.app_role))',
      policy_name,
      table_name
    );
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
  END LOOP;
END;
$$;

-- Idempotency guard for order-status notifications. It also limits the impact
-- of retries or a leaked order UUID.
CREATE TABLE IF NOT EXISTS public.whatsapp_notificacoes_enviadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  status text NOT NULL,
  enviado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pedido_id, status)
);

ALTER TABLE public.whatsapp_notificacoes_enviadas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_notificacoes_admin_read ON public.whatsapp_notificacoes_enviadas;
CREATE POLICY whatsapp_notificacoes_admin_read
ON public.whatsapp_notificacoes_enviadas FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
REVOKE ALL ON public.whatsapp_notificacoes_enviadas FROM anon;
GRANT SELECT ON public.whatsapp_notificacoes_enviadas TO authenticated;
GRANT ALL ON public.whatsapp_notificacoes_enviadas TO service_role;

-- Guest carts are written through narrow RPCs so the underlying table can be
-- removed from anonymous Data API access in phase 2.
CREATE OR REPLACE FUNCTION public.save_abandoned_cart(
  p_session_id text,
  p_itens jsonb,
  p_valor_total numeric,
  p_origem text DEFAULT 'timeout'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_user_id uuid := (SELECT auth.uid());
  v_email text := NULLIF((SELECT auth.jwt() ->> 'email'), '');
BEGIN
  IF p_session_id IS NULL
     OR length(p_session_id) NOT BETWEEN 20 AND 128
     OR p_session_id !~ '^sess_[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Sessão inválida' USING ERRCODE = '22023';
  END IF;
  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) > 100 THEN
    RAISE EXCEPTION 'Itens inválidos' USING ERRCODE = '22023';
  END IF;
  IF p_valor_total IS NULL OR p_valor_total < 0 OR p_valor_total > 100000 THEN
    RAISE EXCEPTION 'Valor inválido' USING ERRCODE = '22023';
  END IF;
  IF p_origem NOT IN ('timeout', 'exit_intent', 'manual') THEN
    RAISE EXCEPTION 'Origem inválida' USING ERRCODE = '22023';
  END IF;

  SELECT c.id INTO v_id
  FROM public.carrinhos_abandonados c
  WHERE c.session_id = p_session_id
    AND (c.user_id IS NULL OR c.user_id = v_user_id)
  ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.carrinhos_abandonados (
      session_id, user_id, email, itens, valor_total, status, origem, updated_at
    ) VALUES (
      p_session_id, v_user_id, v_email, p_itens, p_valor_total, 'abandonado', p_origem, now()
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.carrinhos_abandonados
    SET user_id = COALESCE(v_user_id, user_id),
        email = COALESCE(v_email, email),
        itens = p_itens,
        valor_total = p_valor_total,
        status = 'abandonado',
        origem = p_origem,
        updated_at = now()
    WHERE id = v_id;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_abandoned_cart_state(
  p_session_id text,
  p_status text DEFAULT NULL,
  p_cupom_oferta text DEFAULT NULL,
  p_origem text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_updated integer;
BEGIN
  IF p_session_id IS NULL
     OR length(p_session_id) NOT BETWEEN 20 AND 128
     OR p_session_id !~ '^sess_[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Sessão inválida' USING ERRCODE = '22023';
  END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('abandonado', 'convertido') THEN
    RAISE EXCEPTION 'Status inválido' USING ERRCODE = '22023';
  END IF;
  IF p_cupom_oferta IS NOT NULL AND p_cupom_oferta !~ '^VOLTA[A-Z0-9]{4,6}$' THEN
    RAISE EXCEPTION 'Cupom inválido' USING ERRCODE = '22023';
  END IF;
  IF p_origem IS NOT NULL AND p_origem NOT IN ('timeout', 'exit_intent', 'manual') THEN
    RAISE EXCEPTION 'Origem inválida' USING ERRCODE = '22023';
  END IF;

  UPDATE public.carrinhos_abandonados
  SET status = COALESCE(p_status, status),
      convertido_em = CASE WHEN p_status = 'convertido' THEN now() ELSE convertido_em END,
      cupom_oferta = COALESCE(p_cupom_oferta, cupom_oferta),
      origem = COALESCE(p_origem, origem),
      updated_at = now()
  WHERE id = (
    SELECT c.id
    FROM public.carrinhos_abandonados c
    WHERE c.session_id = p_session_id
      AND (c.user_id IS NULL OR c.user_id = v_user_id)
    ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
    LIMIT 1
  );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_abandoned_cart_coupon(p_session_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_cart_id uuid;
  v_existing_code text;
  v_existing_discount numeric;
  v_code text;
  v_candidate text;
  v_discount numeric := 5;
  v_attempt integer;
BEGIN
  IF p_session_id IS NULL
     OR length(p_session_id) NOT BETWEEN 20 AND 128
     OR p_session_id !~ '^sess_[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'Sessão inválida' USING ERRCODE = '22023';
  END IF;

  SELECT c.id, c.cupom_oferta
  INTO v_cart_id, v_existing_code
  FROM public.carrinhos_abandonados c
  WHERE c.session_id = p_session_id
    AND c.valor_total > 0
    AND jsonb_array_length(COALESCE(c.itens, '[]'::jsonb)) > 0
    AND (c.user_id IS NULL OR c.user_id = v_user_id)
  ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Carrinho não encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF v_existing_code IS NOT NULL THEN
    SELECT c.valor
    INTO v_existing_discount
    FROM public.cupons AS c
    WHERE c.codigo = v_existing_code AND c.ativo = true;

    IF v_existing_discount IS NOT NULL THEN
      RETURN jsonb_build_object('codigo', v_existing_code, 'desconto', v_existing_discount);
    END IF;
  END IF;

  SELECT LEAST(15, GREATEST(1, COALESCE(s.exit_intent_discount, 5)))
  INTO v_discount
  FROM public.site_settings s
  LIMIT 1;
  v_discount := COALESCE(v_discount, 5);

  FOR v_attempt IN 1..10 LOOP
    v_candidate := 'VOLTA' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    v_code := NULL;
    INSERT INTO public.cupons (
      codigo, tipo, valor, regra, validade, ativo, uso, max_uso, apenas_primeira_compra
    ) VALUES (
      v_candidate,
      'Percentual',
      v_discount,
      'Cupom de carrinho abandonado — uso único',
      current_date + 7,
      true,
      0,
      1,
      false
    )
    ON CONFLICT (codigo) DO NOTHING
    RETURNING codigo INTO v_code;

    EXIT WHEN v_code IS NOT NULL;
  END LOOP;

  IF v_code IS NULL THEN
    RAISE EXCEPTION 'Não foi possível gerar cupom' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.carrinhos_abandonados
  SET cupom_oferta = v_code,
      origem = 'exit_intent',
      updated_at = now()
  WHERE id = v_cart_id;

  RETURN jsonb_build_object('codigo', v_code, 'desconto', v_discount);
END;
$$;

REVOKE ALL ON FUNCTION public.save_abandoned_cart(text, jsonb, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_abandoned_cart_state(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.issue_abandoned_cart_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_abandoned_cart(text, jsonb, numeric, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_abandoned_cart_state(text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.issue_abandoned_cart_coupon(text) TO anon, authenticated, service_role;

-- Private rotating cron credential. The plaintext never enters source control;
-- pg_cron reads it at execution time and the Edge Function validates its hash.
CREATE TABLE IF NOT EXISTS private.edge_cron_secrets (
  name text PRIMARY KEY,
  secret_value text NOT NULL,
  secret_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON private.edge_cron_secrets FROM PUBLIC, anon, authenticated;

INSERT INTO private.edge_cron_secrets (name, secret_value, secret_hash)
SELECT 'whatsapp-cart-recovery', value, encode(extensions.digest(value, 'sha256'), 'hex')
FROM (SELECT encode(extensions.gen_random_bytes(32), 'hex') AS value) generated
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.validate_edge_cron_secret(p_name text, p_secret text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.edge_cron_secrets s
    WHERE s.name = p_name
      AND s.secret_hash = encode(extensions.digest(COALESCE(p_secret, ''), 'sha256'), 'hex')
  );
$$;

REVOKE ALL ON FUNCTION public.validate_edge_cron_secret(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_edge_cron_secret(text, text) TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('recuperar-carrinhos');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule(
  'recuperar-carrinhos',
  '0 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-cart-recovery',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          SELECT secret_value
          FROM private.edge_cron_secrets
          WHERE name = 'whatsapp-cart-recovery'
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cron$
);

NOTIFY pgrst, 'reload schema';
