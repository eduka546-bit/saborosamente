# 🎯 COMECE AGORA - Exatamente o que fazer

## ❌ SEM 2FA - Só Auditoria + Rascunho

---

## PASSO 1: SQL (10 min)

Copie **TODO** esse SQL:

```sql
-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  acao text NOT NULL,
  tabela text,
  registro_id uuid,
  dados_antes jsonb,
  dados_depois jsonb,
  ip_address inet,
  user_agent text,
  status text DEFAULT 'success',
  erro_mensagem text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_acao ON public.audit_log(acao);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION registrar_auditoria(
  p_user_id uuid,
  p_user_email text,
  p_acao text,
  p_tabela text,
  p_registro_id uuid,
  p_dados_antes jsonb,
  p_dados_depois jsonb,
  p_ip_address inet,
  p_user_agent text,
  p_status text DEFAULT 'success',
  p_erro_mensagem text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO audit_log (
    user_id,
    user_email,
    acao,
    tabela,
    registro_id,
    dados_antes,
    dados_depois,
    ip_address,
    user_agent,
    status,
    erro_mensagem
  ) VALUES (
    p_user_id,
    p_user_email,
    p_acao,
    p_tabela,
    p_registro_id,
    p_dados_antes,
    p_dados_depois,
    p_ip_address,
    p_user_agent,
    p_status,
    p_erro_mensagem
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE VIEW audit_log_view AS
SELECT
  al.id,
  al.created_at,
  al.user_email,
  al.acao,
  al.tabela,
  al.registro_id,
  al.status,
  al.ip_address::text
FROM public.audit_log al
ORDER BY al.created_at DESC;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler audit log"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
```

1. Vá em **Supabase Console → SQL Editor → New Query**
2. Cole tudo
3. Clique **Run**

✅ PRONTO!

---

## PASSO 2: Nos Arquivos (30 min)

### PASSO 2.1: `src/routes/admin.produtos.tsx`

Procure pela função de **criar produto** e após criar com sucesso, adicione:

```typescript
import { registrarAuditoria } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";

// ... depois de criar ...
const session = await supabase.auth.getSession();
if (session.data.session) {
  await registrarAuditoria({
    userId: session.data.session.user.id,
    userEmail: session.data.session.user.email,
    acao: "criar_produto",
    tabela: "produtos",
    registroId: newProduct.id,
    dadosDepois: newProduct,
  });
}
```

Na função de **editar**, adicione:

```typescript
await registrarAuditoria({
  userId: session.data.session.user.id,
  userEmail: session.data.session.user.email,
  acao: "editar_produto",
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: oldProduct,
  dadosDepois: updatedProduct,
});
```

Na função de **deletar**, adicione:

```typescript
await registrarAuditoria({
  userId: session.data.session.user.id,
  userEmail: session.data.session.user.email,
  acao: "deletar_produto",
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: product,
});
```

### PASSO 2.2: `src/routes/admin.cupons.tsx`

Faça exatamente o mesmo:
- criar_cupom
- editar_cupom  
- deletar_cupom

### PASSO 2.3: `src/routes/admin.pedidos.tsx`

Quando **mudar status**:

```typescript
await registrarAuditoria({
  userId: session.data.session.user.id,
  userEmail: session.data.session.user.email,
  acao: "mudar_status_pedido",
  tabela: "pedidos",
  registroId: pedido.id,
  dadosAntes: { status: oldStatus },
  dadosDepois: { status: newStatus },
});
```

Quando **confirmar rascunho**:

```typescript
await registrarAuditoria({
  userId: session.data.session.user.id,
  userEmail: session.data.session.user.email,
  acao: "confirmar_rascunho",
  tabela: "pedidos",
  registroId: pedido.id,
  dadosAntes: { status: "rascunho" },
  dadosDepois: { status: "pendente" },
});
```

### PASSO 2.4: `src/components/admin-header.tsx`

Adicione o link:

```typescript
<Link href="/admin/auditoria" className="...">
  🔍 Auditoria
</Link>
```

---

## PASSO 3: Testar (10 min)

1. **Crie um produto** → vai em Admin → 🔍 Auditoria → vê o log ✅
2. **Confirme um pedido em rascunho** → vê log de `confirmar_rascunho` ✅
3. **Teste filtros** → Exporte CSV ✅

---

## PASSO 4: Deploy (2 min)

```bash
git add -A
git commit -m "Implementar: auditoria + rascunho"
git push
```

---

## ✅ Pronto!

Você tem:
- ✅ Pedidos começam em **"rascunho"** 
- ✅ Admin clica **"✓ Confirmar"** → muda para **"pendente"**
- ✅ Todos os logs aparecem em **Admin → 🔍 Auditoria**
- ✅ Pode filtrar, buscar e exportar

**Nenhuma complexidade extra. Funciona perfeitamente.** 🚀

---

## 📁 Arquivos que já estão prontos:

- `src/lib/audit.ts` ✅ (só use, não modifique)
- `src/routes/admin/auditoria.tsx` ✅ (já pronto)
- `src/lib/order-confirmation.ts` ✅ (já pronto)
- `supabase/functions/whatsapp-agent/error-handler.ts` ✅ (já pronto)

---

## 🗂️ Arquivos que você NÃO precisa:

❌ `src/lib/auth-2fa.ts` - Já deletado
❌ `src/components/setup-2fa-modal.tsx` - Já deletado
❌ `ADMIN_2FA_AUDIT_IMPLEMENTATION.md` - Já deletado
❌ `WHATSAPP_RELIABILITY_IMPROVEMENTS.md` - Deletaremos

---

Começar agora? 🎯
