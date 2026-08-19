# Migração: Sistema de Pedidos Rascunho

## O que foi alterado

Este update implementa um novo sistema de pedidos que cria pedidos em status **`rascunho`** até que sejam confirmados presencialmente pelo admin.

### Fluxo antigo
```
Cliente finaliza checkout → Pedido criado como "preparando" → Admin vê na lista
```

### Fluxo novo
```
Cliente finaliza checkout → Pedido criado como "rascunho" → Admin vê como "rascunho" → Clica "Confirmar Pedido" → Muda para "pendente" → Envia notificação WhatsApp ao cliente
```

## Como executar

### 1. Executar a migração SQL

Vá em **Supabase Console → SQL Editor** e execute o conteúdo do arquivo:
```
supabase/migrations/20260810_add_rascunho_status.sql
```

Este arquivo cria duas funções RPC:
- `confirmar_pedido_rascunho(pedido_id)` - Confirma um pedido de rascunho
- `rejeitar_pedido_rascunho(pedido_id)` - Rejeita e cancela um pedido de rascunho

### 2. Fazer deploy do código

Os arquivos TypeScript já foram atualizados:
- `src/lib/orders.functions.ts` - Pedidos criados como `"rascunho"`
- `src/lib/order-confirmation.ts` - Novas funções para confirmar/rejeitar
- `src/routes/admin.pedidos.tsx` - Novo status na UI + botão de confirmação

Faça `git push` e deploy normalmente.

## Testes

1. **Acesse `/checkout`** e crie um pedido
2. **Vá para Admin → Pedidos**
3. Veja o pedido com status **"🗂️ rascunho"** (cinza)
4. **Clique no pedido** para abrir o modal
5. **Clique no botão "✓ Confirmar Pedido"** (verde)
6. Veja status mudar para **"⏱️ pendente"** (amarelo)
7. **Verifique WhatsApp** - Cliente deve receber notificação de confirmação

## Rollback (se necessário)

Se precisar reverter, execute no SQL Editor:
```sql
DROP FUNCTION IF EXISTS confirmar_pedido_rascunho(uuid);
DROP FUNCTION IF EXISTS rejeitar_pedido_rascunho(uuid);

-- Converter todos os pedidos em 'rascunho' para 'pendente'
UPDATE pedidos SET status = 'pendente' WHERE status = 'rascunho';
```

## Próximas melhorias (Fase 2)

- [ ] Adicionar botão de "Rejeitar Pedido" (muda para cancelado)
- [ ] Adicionar timer de expiração (ex: pedido em rascunho há 1 dia = auto-cancela)
- [ ] Notificação WhatsApp para o cliente quando pedido criado em rascunho (link para cancelar se quiser)
- [ ] Dashboard: separar pedidos "rascunho" de "confirmados"
