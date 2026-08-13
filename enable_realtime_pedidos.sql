-- Habilita Realtime na tabela pedidos
-- Execute no Supabase SQL Editor

-- 1. Adiciona a tabela pedidos à publicação de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;

-- 2. Garante que pedido_itens também está (para buscar itens junto)
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_itens;
