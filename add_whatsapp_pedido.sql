-- Adiciona coluna para identificar pedidos originados pelo WhatsApp
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'site';

-- Adiciona coluna para manter estado do pedido em andamento no WhatsApp
ALTER TABLE public.whatsapp_conversas
  ADD COLUMN IF NOT EXISTS pedido_em_andamento jsonb DEFAULT NULL;

-- 'site' = pedido feito pelo site
-- 'whatsapp' = pedido feito pelo agente IA no WhatsApp
