-- Adiciona a coluna imagens se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'imagens') THEN
        ALTER TABLE public.produtos ADD COLUMN imagens JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Garante que a coluna tenha um valor padrão e não seja nula para registros existentes
UPDATE public.produtos SET imagens = '[]'::jsonb WHERE imagens IS NULL;

-- Garante as permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
GRANT SELECT ON public.produtos TO anon;
