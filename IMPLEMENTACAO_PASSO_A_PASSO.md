# 🚀 Guia Passo a Passo - Implementação Fase 1

## FASE 1: Migrations SQL (Hoje - 10 minutos)

### Passo 1.1: Executar primeira migração (Pedidos Rascunho)

1. Abra **Supabase Console** → https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu esquerdo)
4. Clique em **+ New Query**
5. **Copie e cole** TODO o conteúdo de:
   ```
   supabase/migrations/20260810_add_rascunho_status.sql
   ```
6. Clique em **Run** (botão azul)
7. Veja a mensagem de sucesso ✅

**O que foi criado:**
- ✅ Funções RPC para confirmar/rejeitar rascunho
- ✅ Banco de dados pronto

### Passo 1.2: Executar segunda migração (2FA + Auditoria)

1. Clique em **+ New Query** novamente
2. **Copie e cole** TODO o conteúdo de:
   ```
   supabase/migrations/20260810_add_2fa_and_audit.sql
   ```
3. Clique em **Run**
4. Veja a mensagem de sucesso ✅

**O que foi criado:**
- ✅ Tabelas: `admin_totp_secrets`, `audit_log`
- ✅ View: `audit_log_view`
- ✅ Funções RPC: `validar_totp`, `registrar_auditoria`
- ✅ Políticas de RLS

---

## FASE 2: Instalar Dependência (5 minutos)

### Passo 2.1: Abrir terminal e instalar speakeasy

```bash
cd c:\Users\arthu\saborosamente
npm install speakeasy
```

Ou com bun:
```bash
bun add speakeasy
```

**Pronto!** ✅

---

## FASE 3: Integrar 2FA ao Login (30 minutos)

### Passo 3.1: Verificar se existe página de login do admin

1. Abra VS Code
2. Procure por arquivo que contenha login de admin
   - Geralmente: `src/routes/admin.login.tsx` ou similar
   - Ou busque por "login" na pasta `src/routes/`

**Se não encontrar**, procure por:
- Onde faz `signInWithPassword`
- Ou onde valida email/senha do admin

### Passo 3.2: Adicionar tela de 2FA após validar senha

Se houver um arquivo de login, adicione isso **APÓS** validar email/senha:

```typescript
import { obter2FAStatus, validarCodigoTOTP, usarCodigoBackup } from "@/lib/auth-2fa";

// ... após signInWithPassword bem-sucedido ...

const status2FA = await obter2FAStatus(userId);
if (status2FA.ativo) {
  // Mostrar modal para digitar código
  setMostraModal2FA(true);
  setUserIdPendente(userId);
  return; // Não faz login ainda
}

// Se não tem 2FA ativo, faz login normalmente
```

Adicione modal para validar 2FA:

```typescript
{mostraModal2FA && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg max-w-md">
      <h2>🔐 Digite seu código do autenticador</h2>
      <input
        type="text"
        placeholder="000000"
        maxLength={6}
        value={codigoTOTP}
        onChange={(e) => setCodigoTOTP(e.target.value.replace(/\D/g, ""))}
      />
      <button onClick={async () => {
        const secret = // buscar secret do banco
        const valido = await validarCodigoTOTP(secret, codigoTOTP);
        if (valido) {
          // Fazer login
        } else {
          alert("Código inválido");
        }
      }}>
        Verificar
      </button>
      
      <button onClick={() => setMostraCodigoBackup(!mostraCodigoBackup)}>
        Usar código de backup
      </button>
      
      {mostraCodigoBackup && (
        <input
          placeholder="ABC12345"
          onChange={async (e) => {
            const usado = await usarCodigoBackup(userIdPendente, e.target.value);
            if (usado) {
              // Fazer login
            }
          }}
        />
      )}
    </div>
  </div>
)}
```

**OU** se preferir algo mais simples por agora:
- Pule esse passo! O 2FA será requerido depois de logado

---

## FASE 4: Adicionar Auditoria aos Endpoints (45 minutos)

### Passo 4.1: Adicionar auditoria ao criar produto

Abra: `src/routes/admin.produtos.tsx`

Procure por onde cria novo produto (busque por `criar` ou `novo`).

**Adicione isso APÓS criar com sucesso:**

```typescript
import { registrarAuditoria, AUDIT_ACTIONS } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";

// Após inserir produto no banco:
const session = await supabase.auth.getSession();
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: AUDIT_ACTIONS.CRIAR_PRODUTO,
  tabela: "produtos",
  registroId: newProduct.id,
  dadosDepois: newProduct,
  status: "success",
});
```

### Passo 4.2: Adicionar auditoria ao editar produto

No mesmo arquivo, procure por onde **edita** produto.

**Adicione APÓS atualizar:**

```typescript
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: AUDIT_ACTIONS.EDITAR_PRODUTO,
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: oldProduct, // snapshot antes
  dadosDepois: updatedProduct, // snapshot depois
  status: "success",
});
```

### Passo 4.3: Adicionar auditoria ao deletar produto

**Procure por onde deleta**, adicione:

```typescript
await registrarAuditoria({
  userId: session.data.session?.user.id,
  userEmail: session.data.session?.user.email,
  acao: AUDIT_ACTIONS.DELETAR_PRODUTO,
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: product,
  status: "success",
});
```

### Passo 4.4: Repetir para Cupons, Pedidos, Clientes

Faça o mesmo nos arquivos:
- `src/routes/admin.cupons.tsx` (criar/editar/deletar)
- `src/routes/admin.pedidos.tsx` (mudar status, cancelar, confirmar rascunho)
- `src/routes/admin.clientes.tsx` (editar, deletar)

**Template para cada ação:**

```typescript
// CRIAR
acao: AUDIT_ACTIONS.CRIAR_CUPOM,
registroId: newCupom.id,
dadosDepois: newCupom,

// EDITAR
acao: AUDIT_ACTIONS.EDITAR_CUPOM,
registroId: cupom.id,
dadosAntes: oldCupom,
dadosDepois: updatedCupom,

// DELETAR
acao: AUDIT_ACTIONS.DELETAR_CUPOM,
registroId: cupom.id,
dadosAntes: cupom,

// MUDAR STATUS (pedidos)
acao: AUDIT_ACTIONS.MUDAR_STATUS_PEDIDO,
registroId: pedido.id,
dadosAntes: { status: oldStatus },
dadosDepois: { status: newStatus },

// CONFIRMAR RASCUNHO
acao: AUDIT_ACTIONS.CONFIRMAR_RASCUNHO,
registroId: pedido.id,
dadosAntes: { status: "rascunho" },
dadosDepois: { status: "pendente" },
```

---

## FASE 5: Testar Tudo Localmente (20 minutos)

### Passo 5.1: Fazer um teste manual - CRIAR PRODUTO

1. Abra seu app: `http://localhost:3000` (ou porta que está rodando)
2. Vá em **Admin → Produtos**
3. Clique em **Novo Produto**
4. Preencha os dados e salve
5. Vá em **Admin → 🔍 Auditoria**
6. Veja se aparece um log com ação `criar_produto` ✅

### Passo 5.2: Teste CRIAR PEDIDO (Rascunho)

1. Abra `/checkout` (em abas anônimas se possível)
2. Adicione produtos ao carrinho
3. Finalize o checkout
4. Veja na página de confirmação o protocolo
5. Vá em **Admin → Pedidos**
6. Procure pelo pedido
7. Deve estar com status **"rascunho"** (cinza) ✅
8. Clique no pedido
9. Veja o botão **"✓ Confirmar Pedido"** (verde) ✅
10. Clique para confirmar
11. Status deve mudar para **"pendente"** (amarelo) ✅
12. Verifique se aparece log de `confirmar_rascunho` em **Auditoria** ✅

### Passo 5.3: Teste EDITAR CUPOM

1. Vá em **Admin → Cupons**
2. Edite um cupom qualquer
3. Salve
4. Vá em **Admin → 🔍 Auditoria**
5. Veja se aparece log com ação `editar_cupom` ✅

### Passo 5.4: Verificar Dashboard de Auditoria

1. Vá em **Admin → 🔍 Auditoria**
2. Veja a tabela com seus logs ✅
3. Teste os filtros:
   - Período: "Últimos 7 dias"
   - Ação: "Criar"
   - Status: "Success"
4. Clique em **Exportar CSV** ✅

---

## FASE 6: Configurar Setup 2FA (15 minutos)

### Passo 6.1: Adicionar menu nas configurações do admin

Abra: `src/components/admin-header.tsx` (ou similar onde tem menu)

**Adicione um link:**

```typescript
<Link href="/admin/configuracoes" className="...">
  ⚙️ Configurações
</Link>
```

### Passo 6.2: Criar página de configurações (se não existir)

Se não existir `src/routes/admin/configuracoes.tsx`, crie:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Setup2FAModal } from "@/components/setup-2fa-modal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { obter2FAStatus } from "@/lib/auth-2fa";

export const Route = createFileRoute("/admin/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [show2FAModal, setShow2FAModal] = useState(false);
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: status2FA } = useQuery({
    queryKey: ["2fa-status", session.data?.user.id],
    queryFn: () => obter2FAStatus(session.data?.user.id || ""),
    enabled: !!session.data?.user.id,
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">⚙️ Configurações</h1>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-semibold">🔐 Segurança</h2>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Autenticação em Dois Fatores (2FA)</p>
            <p className="text-sm text-muted-foreground">
              {status2FA?.ativo ? "✅ Ativado" : "❌ Desativado"}
            </p>
          </div>
          <Button
            onClick={() => setShow2FAModal(true)}
            variant={status2FA?.ativo ? "outline" : "default"}
          >
            {status2FA?.ativo ? "Reconfigurar" : "Ativar"} 2FA
          </Button>
        </div>
      </div>

      <Setup2FAModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        userId={session.data?.user.id || ""}
        onSuccess={() => {
          // Recarregar status
          window.location.reload();
        }}
      />
    </div>
  );
}
```

### Passo 6.3: Testar Setup 2FA

1. Vá em **Admin → ⚙️ Configurações**
2. Clique em **Ativar 2FA**
3. Modal abre com QR code
4. Instale **Google Authenticator** no seu celular (ou Authy)
5. Abra o app e escaneie o QR code
6. Digite os 6 dígitos que aparecem no app
7. Guarde os **códigos de backup**
8. Pronto! ✅

---

## FASE 7: Deploy (5 minutos)

### Passo 7.1: Fazer commit e push

```bash
git add -A
git commit -m "Fase 1 implementação: pedidos rascunho, WhatsApp reliability, 2FA+auditoria"
git push origin main
```

**OBS:** Lovable sincroniza automaticamente! ✅

### Passo 7.2: Verificar se tudo está funcionando

Depois de 2-3 minutos:
1. Acesse seu site em produção
2. Teste criar um pedido (deve ficar em "rascunho")
3. Teste editar um produto (deve registrar em auditoria)
4. Teste 2FA (se já implementou no login)

---

## ⚠️ Checklist Final

- [ ] Executou migration de rascunho SQL ✅
- [ ] Executou migration de 2FA+auditoria SQL ✅
- [ ] Instalou `speakeasy` (npm install)
- [ ] Testou criar pedido (deve estar em rascunho)
- [ ] Testou confirmar pedido
- [ ] Testou criar/editar/deletar produto
- [ ] Viu logs em Admin → Auditoria
- [ ] Testou setup 2FA
- [ ] Fez push para main

---

## 🆘 Se der erro em algum passo

### Erro ao executar SQL
- ❌ "relation already exists"
  - **Solução:** Migrations já foram executadas antes. Tudo certo!
- ❌ "syntax error"
  - **Solução:** Copie o arquivo TODO de uma vez, não copie aos poucos

### Erro ao criar auditoria
- ❌ "function registrar_auditoria does not exist"
  - **Solução:** Verifique se executou a migration de 2FA+auditoria

### Erro no 2FA
- ❌ "speakeasy not found"
  - **Solução:** Execute `npm install speakeasy`

### Pedido não aparece em rascunho
- ❌ "Status é 'preparando' ao invés de 'rascunho'"
  - **Solução:** Verifique se fez reload do código (Ctrl+Shift+R)

---

## 📞 Próximo passo após tudo funcionar

1. Implementar **alertas por email** quando muitas falhas de login
2. Implementar **rotação de logs** (arquivar após 6 meses)
3. Adicionar **2FA ao login** (se ainda não fez)
4. Treinamento com sua equipe sobre como usar

---

**Tempo total estimado: 1-2 horas**

Boa sorte! 🚀
