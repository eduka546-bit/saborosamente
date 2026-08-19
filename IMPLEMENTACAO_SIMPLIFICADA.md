# 🚀 Guia Simplificado - SEM 2FA

Você só quer **Auditoria** (registrar ações do admin). Perfeito! Muito mais simples.

---

## ✅ O QUE FAZER AGORA

### **FASE 1: Executar Migration SQL (10 min)**

**Passo 1:** Abra **Supabase Console** → SQL Editor → New Query

**Passo 2:** Copie e execute APENAS isso:

```sql
-- Tabela de log de auditoria
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

-- Função para registrar auditoria
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

-- View para relatório
CREATE OR REPLACE VIEW audit_log_view AS
SELECT
  al.id,
  al.created_at,
  al.user_email,
  al.acao,
  al.tabela,
  al.registro_id,
  al.status,
  al.ip_address::text,
  DATE_TRUNC('day', al.created_at)::date as data
FROM public.audit_log al
ORDER BY al.created_at DESC;

-- Política RLS
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

**Clique em Run** ✅

---

### **FASE 2: Adicionar Auditoria aos Endpoints (30 min)**

Você só precisa adicionar 2 coisas nos arquivos admin:

#### Passo 1: Adicionar imports
Abra cada arquivo de admin e adicione NO TOPO:

```typescript
import { registrarAuditoria } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
```

#### Passo 2: Registrar quando criar

**Em `src/routes/admin.produtos.tsx`** (procure por "criar produto"):

```typescript
// APÓS criar produto com sucesso:
const session = await supabase.auth.getSession();
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: "criar_produto",
  tabela: "produtos",
  registroId: newProduct.id,
  dadosDepois: newProduct,
  status: "success",
});
```

#### Passo 3: Registrar quando editar

```typescript
// APÓS editar produto com sucesso:
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: "editar_produto",
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: oldProduct,
  dadosDepois: updatedProduct,
  status: "success",
});
```

#### Passo 4: Registrar quando deletar

```typescript
// ANTES de deletar (pra ter snapshot):
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: "deletar_produto",
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: product,
  status: "success",
});
```

**Repetir o padrão para:**
- Cupons (criar/editar/deletar)
- Pedidos (mudar status, confirmar rascunho, cancelar, deletar)
- Clientes (editar, deletar)

---

### **FASE 3: Dashboard de Auditoria (Pronto!)**

Já criamos: `src/routes/admin/auditoria.tsx`

Você só precisa adicionar o link no menu do admin.

Abra: `src/components/admin-header.tsx`

Adicione na lista de links:

```typescript
<Link to="/admin/auditoria" className="...">
  🔍 Auditoria
</Link>
```

---

### **FASE 4: Testar (10 min)**

1. **Criar/editar/deletar um produto** → Veja em Admin → 🔍 Auditoria ✅
2. **Confirmar um pedido em rascunho** → Veja o log ✅
3. **Filtrar por ação/período** → Exporte CSV ✅

---

## 🗑️ **O QUE NÃO FAZER**

❌ **NÃO execute** `supabase/migrations/20260810_add_2fa_and_audit.sql`
- Tem 2FA nele, você não quer

❌ **NÃO instale** `speakeasy`

❌ **NÃO crie** `src/components/setup-2fa-modal.tsx`

❌ **NÃO crie** `src/lib/auth-2fa.ts`

❌ **NÃO crie** `src/routes/admin/configuracoes.tsx`

---

## ✅ **O QUE FAZER**

✅ **Executar** a migração SQL simplificada acima

✅ **Adicionar imports** nos arquivos admin

✅ **Chamar `registrarAuditoria()`** em cada operação crítica

✅ **Usar** `src/routes/admin/auditoria.tsx` (já pronto!)

✅ **Usar** `src/lib/audit.ts` (já pronto!)

✅ **Adicionar link** no menu do admin

---

## 🎯 **Seu Checklist Simplificado**

- [ ] Executei migration SQL (APENAS a simplificada acima)
- [ ] Adicionei import em admin.produtos.tsx
- [ ] Adicionei registrarAuditoria em criar/editar/deletar
- [ ] Adicionei import em admin.cupons.tsx
- [ ] Adicionei registrarAuditoria em cupons
- [ ] Adicionei import em admin.pedidos.tsx
- [ ] Adicionei registrarAuditoria em mudar status + confirmar
- [ ] Adicionei link "🔍 Auditoria" no menu
- [ ] Testei criar produto + vejo em Auditoria ✅
- [ ] Fiz push para main

---

## 🚀 **Resumo Final**

| Antes | Depois |
|-------|--------|
| ❌ 2FA | ✅ Sem 2FA |
| ❌ Nenhum log | ✅ Auditoria completa |
| ❌ Sem rastreabilidade | ✅ Sabe quem fez o quê |
| ❌ Sem proteção | ✅ Segurança via auditoria |

**Tempo total: ~40 minutos** 

Muito mais rápido! 🎉

---

## 📝 **Template Para Copiar/Colar**

Para cada endpoint admin:

```typescript
// ============================================================
// QUANDO CRIAR
// ============================================================
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: "criar_[coisa]",  // criar_produto, criar_cupom, etc
  tabela: "[tabela]",      // produtos, cupons, etc
  registroId: newItem.id,
  dadosDepois: newItem,
  status: "success",
});

// ============================================================
// QUANDO EDITAR
// ============================================================
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: "editar_[coisa]",
  tabela: "[tabela]",
  registroId: item.id,
  dadosAntes: oldItem,
  dadosDepois: updatedItem,
  status: "success",
});

// ============================================================
// QUANDO DELETAR
// ============================================================
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: "deletar_[coisa]",
  tabela: "[tabela]",
  registroId: item.id,
  dadosAntes: item,
  status: "success",
});

// ============================================================
// QUANDO MUDAR STATUS (pedidos)
// ============================================================
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: "mudar_status_pedido",
  tabela: "pedidos",
  registroId: pedido.id,
  dadosAntes: { status: oldStatus },
  dadosDepois: { status: newStatus },
  status: "success",
});
```

---

Pronto? Quer que eu ajude em algum passo específico? 🚀
