-- Adicionar campo rating à tabela produtos se não existir
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) DEFAULT 5.0;

-- Garantir que o rating está entre 3.5 e 5.0
ALTER TABLE produtos
ADD CONSTRAINT check_rating CHECK (rating >= 3.5 AND rating <= 5.0);

-- Indexar para performance
CREATE INDEX IF NOT EXISTS idx_produtos_rating ON produtos(rating);
