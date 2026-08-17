-- Modo Treino da IA Saborosa
ALTER TABLE public.agente_config
  ADD COLUMN IF NOT EXISTS modo_treino boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS treinador_telefone text DEFAULT NULL;
-- treinador_telefone: número do WhatsApp do admin que vai treinar a IA
-- Ex: '5547997391514'
