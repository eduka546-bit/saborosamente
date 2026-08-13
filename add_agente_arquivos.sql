-- Tabela de arquivos do agente IA (imagens, PDFs, etc.)
CREATE TABLE IF NOT EXISTS public.agente_arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL,  -- descrição para a IA saber quando usar (ex: "Cardápio completo em PDF")
  tipo text NOT NULL,       -- 'imagem' | 'pdf' | 'documento'
  url text NOT NULL,        -- URL pública no Supabase Storage
  storage_path text,        -- caminho interno no bucket
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Permissões
ALTER TABLE public.agente_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_agente_arquivos" ON public.agente_arquivos
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT ON public.agente_arquivos TO anon;
GRANT ALL ON public.agente_arquivos TO authenticated;
GRANT ALL ON public.agente_arquivos TO service_role;

-- Bucket no Storage (execute separado se necessário)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('agente-arquivos', 'agente-arquivos', true)
-- ON CONFLICT (id) DO NOTHING;
