# 🚀 Como Executar a Migration do Campo Rating

## ✅ Opção Recomendada: Via Supabase Dashboard (Mais Simples)

Esta é a forma mais direta e confiável:

### Passo 1: Acesse o Supabase

1. Abra https://app.supabase.com
2. Faça login na sua conta
3. Selecione o projeto **saborosamente**

### Passo 2: Acesse o SQL Editor

1. Na barra lateral esquerda, procure por **SQL Editor** (ícone de chaves `</>`)
2. Clique em **"New query"** para criar uma nova query

### Passo 3: Execute o SQL

1. Copie todo o conteúdo abaixo:

```sql
-- Step 1: Adicionar coluna rating
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) DEFAULT 5.0;

-- Step 2: Adicionar constraint de validação
ALTER TABLE produtos
ADD CONSTRAINT check_rating CHECK (rating >= 3.5 AND rating <= 5.0);

-- Step 3: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_produtos_rating ON produtos(rating);
```

2. Cole na janela do SQL Editor
3. Clique no botão **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### Passo 4: Verifique o Resultado

Você deve ver uma mensagem de sucesso. Se houver erro, verifique:

- Se a tabela `produtos` existe (pode estar em plural ou singular)
- Se você tem permissões de admin

---

## 🔧 Opção Alternativa: Via Script TypeScript

Se preferir automatizar via código:

```bash
# Executar com bun (recomendado para este projeto)
bun src/migrations/execute-migration.ts

# Ou com npx (requer ter tsx instalado)
npx tsx src/migrations/execute-migration.ts
```

⚠️ **Pré-requisito**: Suas variáveis de ambiente devem estar configuradas:

- `.env` deve ter `VITE_SUPABASE_URL` e `SB_SERVICE_ROLE_KEY`

---

## 📋 O que esta Migration faz:

| Componente     | Descrição                                                     |
| -------------- | ------------------------------------------------------------- |
| **Coluna**     | Adiciona `rating DECIMAL(3,1)` com valor padrão de 5.0        |
| **Constraint** | Garante que ratings ficam entre 3.5 e 5.0                     |
| **Índice**     | Melhora performance em queries que filtram/ordenam por rating |

---

## ✅ Verificação Pós-Execução

Após rodar a migration, você pode verificar se tudo funcionou:

```sql
-- Verificar se a coluna foi criada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'produtos' AND column_name = 'rating';

-- Verificar um produto de exemplo
SELECT id, nome, rating FROM produtos LIMIT 5;
```

---

## 🐛 Troubleshooting

### Erro: "Table 'produtos' not found"

- A tabela pode estar com nome diferente (em inglês: `products`)
- Modifique o SQL para usar o nome correto

### Erro: "Constraint check_rating already exists"

- A constraint já foi criada anteriormente
- Isto é normal, o `IF NOT EXISTS` evita erros em re-execuções

### Erro: "Index idx_produtos_rating already exists"

- O índice já foi criado
- Isto é normal, o `CREATE INDEX IF NOT EXISTS` evita erros

---

## 📝 Próximos Passos no Código

Após a migration, atualize seu código TypeScript:

### 1. Atualize os tipos Zod (se existirem)

```typescript
// src/schemas/produto.ts (exemplo)
import { z } from "zod";

export const produtoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  preco: z.number(),
  rating: z.number().min(3.5).max(5.0), // ← Novo campo
  // ... outros campos
});
```

### 2. Use o campo em suas queries

```typescript
// Selecionar com rating
const { data: produtos } = await supabase
  .from("produtos")
  .select("*, rating")
  .order("rating", { ascending: false });
```

### 3. Exiba na UI

```tsx
<div>
  <h3>{produto.nome}</h3>
  <p>Avaliação: ⭐ {produto.rating}</p>
</div>
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se está usando a conta com permissões corretas
2. Confirme que as variáveis de ambiente estão carregadas
3. Tente executar um comando simples primeiro (`SELECT 1`)
