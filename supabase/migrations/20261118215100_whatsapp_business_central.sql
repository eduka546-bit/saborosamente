-- Organização do atendimento WhatsApp sem alterar histórico/IA/checkout.
CREATE TABLE IF NOT EXISTS public.whatsapp_etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE CHECK (char_length(btrim(nome)) BETWEEN 2 AND 40),
  cor text NOT NULL DEFAULT '#00a884' CHECK (cor ~ '^#[0-9a-fA-F]{6}$'),
  criada_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.whatsapp_atendimento_estado (
  conversa_id uuid PRIMARY KEY REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
  fixada boolean NOT NULL DEFAULT false,
  arquivada boolean NOT NULL DEFAULT false,
  marcada_nao_lida boolean NOT NULL DEFAULT false,
  ultima_leitura timestamptz,
  etiquetas uuid[] NOT NULL DEFAULT '{}'::uuid[],
  anotacoes text NOT NULL DEFAULT '' CHECK (length(anotacoes) <= 10000),
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lembrete_em timestamptz,
  lembrete_texto text CHECK (length(lembrete_texto) <= 500),
  resolvida_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_atendimento_estado_lembrete ON public.whatsapp_atendimento_estado(lembrete_em) WHERE lembrete_em IS NOT NULL;
CREATE INDEX IF NOT EXISTS whatsapp_atendimento_estado_responsavel ON public.whatsapp_atendimento_estado(responsavel_id) WHERE responsavel_id IS NOT NULL;
ALTER TABLE public.whatsapp_etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_atendimento_estado ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_etiquetas, public.whatsapp_atendimento_estado FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_etiquetas, public.whatsapp_atendimento_estado TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_etiquetas, public.whatsapp_atendimento_estado TO service_role;
CREATE POLICY whatsapp_etiquetas_admin_select ON public.whatsapp_etiquetas FOR SELECT TO authenticated USING (public.usuario_tem_role(ARRAY['admin'::text]));
CREATE POLICY whatsapp_etiquetas_admin_insert ON public.whatsapp_etiquetas FOR INSERT TO authenticated WITH CHECK (public.usuario_tem_role(ARRAY['admin'::text]));
CREATE POLICY whatsapp_etiquetas_admin_update ON public.whatsapp_etiquetas FOR UPDATE TO authenticated USING (public.usuario_tem_role(ARRAY['admin'::text])) WITH CHECK (public.usuario_tem_role(ARRAY['admin'::text]));
CREATE POLICY whatsapp_etiquetas_admin_delete ON public.whatsapp_etiquetas FOR DELETE TO authenticated USING (public.usuario_tem_role(ARRAY['admin'::text]));
CREATE POLICY whatsapp_estado_admin_select ON public.whatsapp_atendimento_estado FOR SELECT TO authenticated USING (public.usuario_tem_role(ARRAY['admin'::text]));
CREATE POLICY whatsapp_estado_admin_insert ON public.whatsapp_atendimento_estado FOR INSERT TO authenticated WITH CHECK (public.usuario_tem_role(ARRAY['admin'::text]));
CREATE POLICY whatsapp_estado_admin_update ON public.whatsapp_atendimento_estado FOR UPDATE TO authenticated USING (public.usuario_tem_role(ARRAY['admin'::text])) WITH CHECK (public.usuario_tem_role(ARRAY['admin'::text]));
CREATE POLICY whatsapp_estado_admin_delete ON public.whatsapp_atendimento_estado FOR DELETE TO authenticated USING (public.usuario_tem_role(ARRAY['admin'::text]));
INSERT INTO public.whatsapp_etiquetas(nome,cor) VALUES
('Aguardando pagamento','#f59e0b'),('Pedido confirmado','#22c55e'),('Entrega agendada','#3b82f6'),('Cliente VIP','#a855f7'),('Urgente','#ef4444')
ON CONFLICT(nome) DO NOTHING;
