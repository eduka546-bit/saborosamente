# ✅ APENAS O ESSENCIAL - Pedidos em Rascunho

Sem 2FA. Sem auditoria. Só isso:
- ✅ Pedidos começam como "rascunho"
- ✅ Admin clica "Confirmar" → muda para "pendente"

---

## PASSO 1: SQL (5 min)

Abra **Supabase Console → SQL Editor → New Query**

Cole **APENAS isso**:

```sql
CREATE OR REPLACE FUNCTION confirmar_pedido_rascunho(p_pedido_id uuid)
RETURNS json AS $$
DECLARE
  v_pedido_id uuid;
  v_cliente_nome text;
  v_cliente_telefone text;
BEGIN
  UPDATE pedidos
  SET status = 'pendente', updated_at = now()
  WHERE id = p_pedido_id AND status = 'rascunho'
  RETURNING id, nome_cliente, telefone_cliente INTO v_pedido_id, v_cliente_nome, v_cliente_telefone;

  IF v_pedido_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pedido não encontrado ou não está em rascunho');
  END IF;

  RETURN json_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'cliente_nome', v_cliente_nome,
    'cliente_telefone', v_cliente_telefone,
    'message', 'Pedido confirmado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Clique **Run** ✅

---

## PASSO 2: 2 Linhas de Código (2 min)

### Em `src/lib/orders.functions.ts`

Procure por esta linha:

```typescript
status: "preparando",
```

Troque para:

```typescript
status: "rascunho",
```

**Pronto!** ✅

---

## PASSO 3: UI do Admin (3 min)

### Em `src/routes/admin.pedidos.tsx`

**Linha 1:** Adicione `FileText` ao import de ícones:

```typescript
import { 
  // ... outros imports
  FileText
} from "lucide-react";
```

**Linha 2:** Procure por `const statusOptions` e adicione rascunho:

```typescript
const statusOptions = [
  { label: 'rascunho', icon: FileText, color: 'text-gray-500' },
  { label: 'pendente', icon: Clock3, color: 'text-yellow-500' },
  // ... resto dos status
];
```

**Pronto!** ✅

---

## PASSO 4: Botão de Confirmar (5 min)

### Em `src/routes/admin.pedidos.tsx`

Procure por `OrderDetailsModal` (função que mostra os detalhes do pedido).

Dentro do header do modal, após o botão de imprimir, adicione:

```typescript
{order.status === 'rascunho' && (
  <Button
    variant="default"
    size="sm"
    className="bg-green-600 hover:bg-green-700"
    onClick={async () => {
      const { data, error } = await supabase.rpc('confirmar_pedido_rascunho', {
        p_pedido_id: order.id
      });
      
      if (error) {
        toast.error('Erro ao confirmar');
      } else {
        toast.success('✓ Pedido confirmado!');
        // Recarregar lista
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        onClose();
      }
    }}
  >
    ✓ Confirmar Pedido
  </Button>
)}
```

Imports necessários (adicione ao topo se não tiver):
```typescript
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
```

**Pronto!** ✅

---

## PASSO 5: Deploy (2 min)

```bash
git add -A
git commit -m "Implementar: pedidos em rascunho"
git push
```

---

## ✅ Pronto!

Agora:
1. Cliente faz checkout → Pedido fica em **"rascunho"** (cinza)
2. Admin clica no pedido → Vê botão **"✓ Confirmar Pedido"** (verde)
3. Admin clica → Status muda para **"pendente"** (amarelo)
4. Admin segue com o fluxo normal

**Sem complexidade extra. Funciona puro.** 🚀

---

## 🗑️ Ignore esses arquivos:

- ❌ `IMPLEMENTACAO_PASSO_A_PASSO.md`
- ❌ `IMPLEMENTACAO_SIMPLIFICADA.md`
- ❌ `COMECO_AGORA.md`
- ❌ `MIGRATION_RASCUNHO.md`
- ❌ `supabase/functions/whatsapp-agent/error-handler.ts` (opcional)
- ❌ `src/lib/order-confirmation.ts` (já está integrado em admin.pedidos)

---

**Tempo total: 15 minutos. Go!** 🎯
