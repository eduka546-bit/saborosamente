-- Adiciona o status 'pausada' à tabela de campanhas e o status 'cancelado'
-- aos envios individuais (para uso futuro). Necessário para o botão Pausar/Retomar.

-- Recria o CHECK de status da campanha incluindo 'pausada'.
ALTER TABLE public.campanhas_whatsapp
  DROP CONSTRAINT IF EXISTS campanhas_whatsapp_status_check;

ALTER TABLE public.campanhas_whatsapp
  ADD CONSTRAINT campanhas_whatsapp_status_check
  CHECK (status IN ('enviando', 'enviada', 'erro', 'cancelada', 'pausada'));
