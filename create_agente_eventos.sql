-- Tabela de eventos/observabilidade do agente de WhatsApp.
-- Registra escalações para humano, falhas ao criar pedido e outros incidentes,
-- para dar visibilidade sobre quando e por que o agente precisou de intervenção.
CREATE TABLE IF NOT EXISTS public.agente_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,            -- ex: 'escalacao_humano' | 'pedido_falhou' | 'area_nao_atendida'
  telefone text,
  conversa_id uuid,
  detalhe jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agente_eventos_tipo ON public.agente_eventos (tipo);
CREATE INDEX IF NOT EXISTS idx_agente_eventos_created_at ON public.agente_eventos (created_at DESC);

ALTER TABLE public.agente_eventos ENABLE ROW LEVEL SECURITY;

-- Só admin pode ler os eventos. A edge function usa service_role (ignora RLS) para inserir.
DROP POLICY IF EXISTS "admin_read_eventos" ON public.agente_eventos;
CREATE POLICY "admin_read_eventos" ON public.agente_eventos
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
