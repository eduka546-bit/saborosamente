# ✅ Migration Rating - Checklist Completo

## 📋 Arquivos Preparados

- [x] `add_rating_field.sql` - Arquivo SQL original (já existia)
- [x] `MIGRATION_RATING.md` - Guia detalhado com 3 opções
- [x] `EXECUTE_MIGRATION.md` - Instruções passo-a-passo (recomendado)
- [x] `src/migrations/execute-migration.ts` - Script automatizado
- [x] `src/migrations/verify-migration.ts` - Script de verificação
- [x] `MIGRATION_CHECKLIST.md` - Este arquivo

---

## 🚀 Como Executar (3 Opções)

### ⭐ OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)

**Tempo**: ~2 minutos | **Dificuldade**: Fácil

```
1. Acesse https://app.supabase.com
2. Selecione projeto "saborosamente"
3. Vá para SQL Editor (ícone </>)
4. Cole o SQL do arquivo "add_rating_field.sql"
5. Clique em "Run" ou Ctrl+Enter
```

✅ Leia as instruções completas em: `EXECUTE_MIGRATION.md`

---

### 🔧 OPÇÃO 2: Via Script TypeScript (Para Código)

**Tempo**: ~1 minuto | **Dificuldade**: Médio

```bash
# Certifique-se de que as env vars estão configuradas
bun src/migrations/execute-migration.ts

# OU com npx
npx tsx src/migrations/execute-migration.ts
```

---

### 📝 OPÇÃO 3: SQL Direto via Arquivo

**Tempo**: ~3 minutos | **Dificuldade**: Médio

1. Copie o conteúdo de `add_rating_field.sql`
2. No Supabase Dashboard → SQL Editor
3. Execute cada comando separadamente se necessário

---

## ✨ Após Executar a Migration

### Verifique o Sucesso

```bash
# Use o script de verificação
bun src/migrations/verify-migration.ts

# OU manualmente no SQL Editor do Supabase
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'produtos' AND column_name = 'rating';
```

### Atualize seu Código TypeScript

1. **Atualize tipos Zod** (se usar validação):
   ```typescript
   export const produtoSchema = z.object({
     rating: z.number().min(3.5).max(5.0).optional(),
     // ... outros campos
   });
   ```

2. **Atualize queries que selecionam produtos**:
   ```typescript
   .select('id, nome, preco, rating') // Adicione rating
   ```

3. **Use rating na UI**:
   ```tsx
   <span>Avaliação: ⭐ {produto.rating}</span>
   ```

---

## 🔍 Verificação Rápida

| Passo | Verificação | Status |
|-------|-------------|---------|
| 1 | Coluna `rating` adicionada | ? |
| 2 | Tipo DECIMAL(3,1) com default 5.0 | ? |
| 3 | Constraint check_rating (3.5-5.0) | ? |
| 4 | Índice idx_produtos_rating criado | ? |
| 5 | Tipos TypeScript atualizados | ? |
| 6 | Queries atualizadas com rating | ? |

**Para marcar como completo**, execute:
```bash
bun src/migrations/verify-migration.ts
```

---

## 🐛 Se Algo Falhar

### Erro: "Table 'produtos' not found"
- Verifique se a tabela está em plural (`produtos`) ou singular (`produto`)
- Atualize o SQL conforme necessário

### Erro: "Constraint check_rating already exists"
- Esto é ok! Significa que já foi executado antes
- O `IF NOT EXISTS` evita erros em re-execuções

### Erro: "Permission denied"
- Use a conta com role `ADMIN` no Supabase
- Ou use `SB_SERVICE_ROLE_KEY` se executar via script

### Script Typescript não funciona
```bash
# Instale tsx globalmente
bun install -g tsx

# Ou use npx
npx tsx src/migrations/execute-migration.ts
```

---

## 📚 Documentação Adicional

- `MIGRATION_RATING.md` - 3 abordagens diferentes com detalhes
- `EXECUTE_MIGRATION.md` - Passo-a-passo completo + troubleshooting
- `add_rating_field.sql` - O SQL puro
- `src/migrations/execute-migration.ts` - Script TypeScript
- `src/migrations/verify-migration.ts` - Verificação automática

---

## ✅ Resumo

1. **Escolha uma opção** (Dashboard é a mais fácil)
2. **Execute a migration**
3. **Verifique com** `verify-migration.ts` ou SQL query
4. **Atualize seu código** TypeScript/Zod conforme necessário
5. **Teste na UI**

---

**⏱️ Tempo total esperado**: 5-10 minutos

**🎯 Resultado**: Campo `rating` DECIMAL(3,1) com validação e índice para melhor performance
