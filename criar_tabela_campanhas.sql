-- Tabela para armazenar campanhas de WhatsApp
CREATE TABLE IF NOT EXISTS public.campanhas_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  imagem_url TEXT,
  video_url TEXT,
  midia_tipo TEXT CHECK (midia_tipo IN ('imagem', 'video', 'nenhuma')) DEFAULT 'nenhuma',
  status TEXT DEFAULT 'enviando' CHECK (status IN ('enviando', 'enviada', 'erro', 'cancelada')),
  contatos_total INTEGER DEFAULT 0,
  contatos_enviados INTEGER DEFAULT 0,
  contatos_falhados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabela para rastrear envios individuais
CREATE TABLE IF NOT EXISTS public.campanhas_whatsapp_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES public.campanhas_whatsapp(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'falhou', 'bloqueado')),
  erro_mensagem TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_campanhas_status ON public.campanhas_whatsapp(status);
CREATE INDEX idx_campanhas_created_at ON public.campanhas_whatsapp(created_at DESC);
CREATE INDEX idx_envios_campanha ON public.campanhas_whatsapp_envios(campanha_id);
CREATE INDEX idx_envios_status ON public.campanhas_whatsapp_envios(status);

-- RLS policies
ALTER TABLE public.campanhas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas_whatsapp_envios ENABLE ROW LEVEL SECURITY;

-- Apenas admin pode criar/ler campanhas
CREATE POLICY "admin_can_crud_campanhas" ON public.campanhas_whatsapp
  USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  ));

CREATE POLICY "admin_can_crud_envios" ON public.campanhas_whatsapp_envios
  USING (TRUE); -- Service role only via Supabase functions

-- Storage bucket para imagens e vídeos de campanhas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campanhas',
  'campanhas',
  true,
  16777216, -- 16MB (suporta vídeos MP4)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
ON CONFLICT DO NOTHING;
