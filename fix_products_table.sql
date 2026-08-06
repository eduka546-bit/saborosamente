-- Adicionar colunas para suporte a estoque e promoções na tabela de produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS controle_estoque BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estoque_atual INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS preco_promocional DECIMAL(10,2);

-- Garantir que as permissões de RLS permitam que o admin atualize estas novas colunas
-- (Assumindo que as políticas de UPDATE para 'authenticated' já existem, 
-- caso contrário, o usuário deve rodar o script de setup inicial novamente)

GRANT ALL ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
