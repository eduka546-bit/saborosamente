-- Adicionar status 'rascunho' aos pedidos
-- Este status representa pedidos criados mas ainda não confirmados presencialmente

-- Criar função para confirmar pedido de rascunho
CREATE OR REPLACE FUNCTION confirmar_pedido_rascunho(p_pedido_id uuid)
RETURNS json AS $$
DECLARE
  v_pedido_id uuid;
  v_cliente_nome text;
  v_cliente_telefone text;
BEGIN
  -- Atualizar pedido de 'rascunho' para 'pendente'
  UPDATE pedidos
  SET status = 'pendente', updated_at = now()
  WHERE id = p_pedido_id AND status = 'rascunho'
  RETURNING id, nome_cliente, telefone_cliente INTO v_pedido_id, v_cliente_nome, v_cliente_telefone;

  -- Se não encontrou pedido em rascunho, retornar erro
  IF v_pedido_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pedido não encontrado ou não está em rascunho');
  END IF;

  -- Retornar sucesso com dados do pedido confirmado
  RETURN json_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'cliente_nome', v_cliente_nome,
    'cliente_telefone', v_cliente_telefone,
    'message', 'Pedido confirmado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para rejeitar pedido de rascunho (deletar ou mover para cancelado)
CREATE OR REPLACE FUNCTION rejeitar_pedido_rascunho(p_pedido_id uuid)
RETURNS json AS $$
DECLARE
  v_pedido_id uuid;
BEGIN
  -- Atualizar pedido de 'rascunho' para 'cancelado'
  UPDATE pedidos
  SET status = 'cancelado', updated_at = now()
  WHERE id = p_pedido_id AND status = 'rascunho'
  RETURNING id INTO v_pedido_id;

  -- Se não encontrou pedido em rascunho, retornar erro
  IF v_pedido_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pedido não encontrado ou não está em rascunho');
  END IF;

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'message', 'Pedido rejeitado e cancelado'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
