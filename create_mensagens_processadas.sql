-- Deduplicação de mensagens do WhatsApp.
-- O WhatsApp Cloud reenvia o mesmo webhook se não receber 200 rapidamente.
-- Guardamos o message_id já processado para evitar processar 2x (pedido/resposta duplicados).
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens_processadas (
  message_id text PRIMARY KEY,
  telefone   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para limpeza por data (housekeeping futuro).
CREATE INDEX IF NOT EXISTS idx_wpp_msg_proc_created_at
  ON public.whatsapp_mensagens_processadas (created_at);

-- RLS: apenas service_role (a edge function) manipula. Sem acesso público.
ALTER TABLE public.whatsapp_mensagens_processadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_wpp_msg_proc" ON public.whatsapp_mensagens_processadas;
CREATE POLICY "service_role_all_wpp_msg_proc"
  ON public.whatsapp_mensagens_processadas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
