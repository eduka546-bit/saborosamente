# Migration: Adicionar Campo Rating

## Opção 1: Via Supabase Dashboard (Mais Simples)

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto **saborosamente**
3. Vá para **SQL Editor** (ícone de código na barra lateral)
4. Crie uma nova query
5. Copie e cole o conteúdo do arquivo `add_rating_field.sql`:

```sql
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) DEFAULT 5.0;

ALTER TABLE produtos
ADD CONSTRAINT check_rating CHECK (rating >= 3.5 AND rating <= 5.0);

CREATE INDEX IF NOT EXISTS idx_produtos_rating ON produtos(rating);
```

6. Clique em **Run** ou use `Ctrl+Enter`
7. Verifique se a execução foi bem-sucedida (sem erros vermelhos)

## Opção 2: Via Script TypeScript

Se você tiver permissões de service role configuradas:

```bash
# Execute o script de migration
npx ts-node src/migrations/add_rating_field.ts
```

## Opção 3: Via SQL Editor Direto

Se o Supabase suporta múltiplas declarações SQL:

1. Abra o SQL Editor
2. Execute cada comando individualmente se necessário:

### Passo 1: Adicionar coluna

```sql
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) DEFAULT 5.0;
```

### Passo 2: Adicionar constraint

```sql
ALTER TABLE produtos
ADD CONSTRAINT check_rating CHECK (rating >= 3.5 AND rating <= 5.0);
```

### Passo 3: Criar índice

```sql
CREATE INDEX IF NOT EXISTS idx_produtos_rating ON produtos(rating);
```

## Verificação

Após executar a migration, verifique se tudo funcionou:

```sql
-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'produtos' AND column_name = 'rating';

-- Verificar a constraint
SELECT constraint_name, constraint_definition
FROM information_schema.table_constraints
WHERE table_name = 'produtos' AND constraint_name = 'check_rating';

-- Verificar o índice
SELECT indexname FROM pg_indexes
WHERE tablename = 'produtos' AND indexname = 'idx_produtos_rating';
```

## Detalhes da Migration

- **Campo**: `rating` (DECIMAL com 3 dígitos e 1 casa decimal)
- **Valor padrão**: 5.0
- **Restrição**: Apenas valores entre 3.5 e 5.0 são permitidos
- **Índice**: Criado para melhor performance em queries de filtro/ordenação

## Próximos Passos

Após a migration:

1. Atualize seus tipos TypeScript/Zod para incluir o campo `rating`
2. Atualize as queries que inserem/atualizam produtos
3. Atualize a UI para exibir ratings dos produtos
