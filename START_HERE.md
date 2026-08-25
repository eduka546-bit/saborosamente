# 🚀 START HERE - Migration de Rating

Bem-vindo! Tudo está pronto para adicionar o campo `rating` à sua tabela de `produtos`.

---

## ⚡ TL;DR (Versão Rápida)

### Escolha UM destes 3 caminhos:

#### ⭐ Caminho 1: Dashboard (MAIS FÁCIL - Recomendado)

```
1. Abra https://app.supabase.com
2. Selecione projeto "saborosamente"
3. Vá para SQL Editor
4. Cole o SQL de "add_rating_field.sql"
5. Clique em "Run"
```

#### 🔧 Caminho 2: Script TypeScript

```bash
bun src/migrations/execute-migration.ts
```

#### 📝 Caminho 3: SQL Direto

```sql
-- Cole o conteúdo de add_rating_field.sql no SQL Editor
```

---

## 📚 Documentos Disponíveis

| Arquivo                                      | Descrição                  | Leia se...                                 |
| -------------------------------------------- | -------------------------- | ------------------------------------------ |
| **RESUMO_MIGRATION.txt**                     | Resumo visual em texto     | Quer um guia rápido e visual               |
| **EXECUTE_MIGRATION.md**                     | Passo-a-passo completo     | Quer instruções detalhadas com screenshots |
| **MIGRATION_CHECKLIST.md**                   | Checklist com verificações | Quer garantir que fez tudo correto         |
| **MIGRATION_RATING.md**                      | 3 abordagens diferentes    | Quer explorar diferentes opções            |
| **MIGRATION_RLS_SETUP.md**                   | Configuração de RLS        | Usa Row Level Security no Supabase         |
| **src/examples/use-rating-field.example.ts** | Exemplos de código         | Quer saber como usar rating no código      |
| **add_rating_field.sql**                     | Arquivo SQL puro           | Quer apenas o SQL para copiar              |

---

## ✨ O que vai ser adicionado

```sql
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 1) DEFAULT 5.0;

ALTER TABLE produtos
ADD CONSTRAINT check_rating CHECK (rating >= 3.5 AND rating <= 5.0);

CREATE INDEX IF NOT EXISTS idx_produtos_rating ON produtos(rating);
```

**Resultado:**

- ✅ Nova coluna `rating` com tipo DECIMAL(3,1)
- ✅ Valor padrão: 5.0 para novos produtos
- ✅ Validação: apenas valores entre 3.5 e 5.0
- ✅ Índice: para melhor performance em queries

---

## 🎯 Próximos Passos (Pós-Migration)

Após executar a migration com sucesso:

### 1. Atualize seus tipos TypeScript

```typescript
import { z } from "zod";

export const produtoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  rating: z.number().min(3.5).max(5.0).optional(), // ← Novo
  // ... outros campos
});
```

### 2. Atualize suas queries

```typescript
// Antes
const { data } = await supabase.from("produtos").select("id, nome, preco");

// Depois - adicione rating
const { data } = await supabase.from("produtos").select("id, nome, preco, rating");
```

### 3. Use na UI

```tsx
<div>
  <h3>{produto.nome}</h3>
  <p>Avaliação: ⭐ {produto.rating}</p>
</div>
```

---

## 🆘 Precisa de Ajuda?

### "Não sei por onde começar"

→ Leia: **RESUMO_MIGRATION.txt** (é o mais visual)

### "Quero instruções passo-a-passo"

→ Leia: **EXECUTE_MIGRATION.md** (tem prints e tudo)

### "Tenho RLS configurado"

→ Leia: **MIGRATION_RLS_SETUP.md** (explica tudo sobre RLS)

### "Quero automatizar via código"

→ Use: **src/migrations/execute-migration.ts** (e leia MIGRATION_CHECKLIST.md)

### "Quero ver exemplos de uso"

→ Leia: **src/examples/use-rating-field.example.ts** (tem código pronto)

---

## 🚀 Comece Agora!

### Opção 1: Clique no link abaixo e siga o passo-a-passo

👉 Abra: **EXECUTE_MIGRATION.md**

### Opção 2: Veja o resumo visual

👉 Abra: **RESUMO_MIGRATION.txt**

### Opção 3: Use o script automatizado

👉 Execute: `bun src/migrations/execute-migration.ts`

---

## ✅ Checklist Rápido

- [ ] Li este documento
- [ ] Escolhi uma abordagem (Dashboard, Script ou SQL)
- [ ] Executei a migration
- [ ] Verifiquei que funcionou
- [ ] Atualizei meu código TypeScript
- [ ] Fiz um teste na UI
- [ ] Fiz commit das mudanças

---

## 📊 Estrutura de Arquivos Criados

```
saborosamente/
├── START_HERE.md ......................... Este arquivo!
├── RESUMO_MIGRATION.txt ................. Guia visual rápido
├── EXECUTE_MIGRATION.md ................. Instruções detalhadas
├── MIGRATION_CHECKLIST.md ............... Verificações e checklist
├── MIGRATION_RATING.md ................. 3 abordagens diferentes
├── MIGRATION_RLS_SETUP.md .............. Configuração de RLS
├── add_rating_field.sql ................ SQL puro (original)
├── src/
│   ├── migrations/
│   │   ├── execute-migration.ts ........ Script automático
│   │   └── verify-migration.ts ........ Script de verificação
│   └── examples/
│       └── use-rating-field.example.ts  Exemplos de código
```

---

## ⏱️ Tempo Estimado

- **Via Dashboard**: 2-3 minutos
- **Via Script**: 1-2 minutos
- **Atualizar código**: 5-10 minutos
- **Total**: ~10-15 minutos

---

## 🎓 Aprenda Mais

Interessado em como funciona tudo?
→ Leia: **src/examples/use-rating-field.example.ts**

Tem dúvidas sobre o Supabase?
→ Leia: **MIGRATION_RLS_SETUP.md**

Quer explorar todas as opções?
→ Leia: **MIGRATION_RATING.md**

---

**🌟 Pronto? Comece com EXECUTE_MIGRATION.md ou RESUMO_MIGRATION.txt!**

---

Criado em: 2024  
Projeto: Saborosamente  
Campo adicionado: rating (DECIMAL 3.1)  
Status: 🟢 Pronto para usar
