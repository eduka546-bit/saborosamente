-- ============================================================
-- LIMPEZA AUTOMÁTICA DE DADOS ÓRFÃOS
-- Triggers que removem dados que não têm relacionamento válido
-- ============================================================

-- 1. DELETAR ITENS DE PEDIDO SEM PEDIDO ASSOCIADO
CREATE OR REPLACE FUNCTION cleanup_orphaned_pedido_itens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pedido_itens
  WHERE pedido_id NOT IN (SELECT id FROM public.pedidos)
  AND pedido_id IS NOT NULL;
  
  RAISE NOTICE 'Limpeza: % itens de pedido órfãos removidos', FOUND;
END;
$$ LANGUAGE plpgsql;

-- 2. DELETAR PEDIDOS MUITO ANTIGOS (> 1 ano, status cancelado/erro)
CREATE OR REPLACE FUNCTION cleanup_old_cancelled_orders()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pedidos
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND status IN ('Cancelado', 'Erro', 'Não confirmado');
  
  RAISE NOTICE 'Limpeza: % pedidos antigos removidos', FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3. DELETAR CARRINHOS ABANDONADOS MUY ANTIGOS (> 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_abandoned_carts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.carrinhos_abandonados
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Limpeza: % carrinhos abandonados removidos', FOUND;
END;
$$ LANGUAGE plpgsql;

-- 4. LIMPAR LOGS DE CONVERSA MUITO ANTIGOS (> 6 meses)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.whatsapp_conversas
  WHERE updated_at < NOW() - INTERVAL '6 months'
  AND modo = 'humano'; -- Apenas conversas encerradas
  
  RAISE NOTICE 'Limpeza: % conversas antigas removidas', FOUND;
END;
$$ LANGUAGE plpgsql;

-- 5. REMOVER ARQUIVOS ÓRFÃOS DO BANCO (referências quebradas)
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS void AS $$
BEGIN
  DELETE FROM public.agente_arquivos
  WHERE ativo = false
  AND created_at < NOW() - INTERVAL '30 days'; -- Desativados há mais de 30 dias
  
  RAISE NOTICE 'Limpeza: % arquivos órfãos removidos', FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER: Deletar itens quando pedido é deletado
CREATE OR REPLACE FUNCTION trigger_delete_pedido_itens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.pedido_itens WHERE pedido_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delete_pedido_itens ON public.pedidos;
CREATE TRIGGER trg_delete_pedido_itens
BEFORE DELETE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION trigger_delete_pedido_itens();

-- ============================================================
-- FUNCTION MASTER: Executar todas as limpezas
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_all_orphaned_data()
RETURNS TABLE(task TEXT, records_deleted INT) AS $$
DECLARE
  v_count INT;
BEGIN
  -- 1. Limpar itens órfãos
  DELETE FROM public.pedido_itens
  WHERE pedido_id NOT IN (SELECT id FROM public.pedidos)
  AND pedido_id IS NOT NULL;
  v_count := FOUND::INT;
  RETURN QUERY SELECT 'Itens de pedido órfãos'::TEXT, v_count;

  -- 2. Limpar pedidos antigos cancelados
  DELETE FROM public.pedidos
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND status IN ('Cancelado', 'Erro', 'Não confirmado');
  v_count := FOUND::INT;
  RETURN QUERY SELECT 'Pedidos antigos cancelados'::TEXT, v_count;

  -- 3. Limpar carrinhos abandonados
  DELETE FROM public.carrinhos_abandonados
  WHERE created_at < NOW() - INTERVAL '90 days';
  v_count := FOUND::INT;
  RETURN QUERY SELECT 'Carrinhos abandonados antigos'::TEXT, v_count;

  -- 4. Limpar conversas antigas
  DELETE FROM public.whatsapp_conversas
  WHERE updated_at < NOW() - INTERVAL '6 months'
  AND modo = 'humano';
  v_count := FOUND::INT;
  RETURN QUERY SELECT 'Conversas WhatsApp antigas'::TEXT, v_count;

  -- 5. Limpar arquivos órfãos
  DELETE FROM public.agente_arquivos
  WHERE ativo = false
  AND created_at < NOW() - INTERVAL '30 days';
  v_count := FOUND::INT;
  RETURN QUERY SELECT 'Arquivos órfãos desativados'::TEXT, v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EXECUTAR LIMPEZA AGORA (teste)
-- ============================================================

-- Descomente para testar:
-- SELECT * FROM cleanup_all_orphaned_data();
