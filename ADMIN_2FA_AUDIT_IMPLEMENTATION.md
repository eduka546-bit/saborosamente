# Task #3: Admin 2FA + Auditoria - Implementação

## Status

✅ **Componentes criados:**
- Migração SQL com tables e functions
- Biblioteca TypeScript para 2FA (TOTP)
- Biblioteca TypeScript para auditoria
- Modal de setup 2FA
- Dashboard de auditoria

## O que foi implementado

### 1. **Migração SQL** (`20260810_add_2fa_and_audit.sql`)

#### Tabelas criadas:

**admin_totp_secrets**
- Armazena secrets TOTP para cada usuário
- Backup codes para recuperação
- Flag de ativação

**audit_log**
- Registra TODAS as ações de admin
- IP address e user agent
- Dados antes/depois (sanitizados)
- Status (sucesso/falha/negado)

#### Funções RPC:
- `validar_totp()` - Valida código TOTP
- `registrar_auditoria()` - Registra ação de audit

#### View:
- `audit_log_view` - Relatório de auditoria

#### Políticas de RLS:
- Apenas admin pode ler audit_log
- Usuários podem gerenciar seu próprio 2FA

### 2. **Biblioteca de 2FA** (`src/lib/auth-2fa.ts`)

```typescript
// Gerar secret TOTP
const { secret, qrCodeUrl, manualEntry } = await gerarSecretTOTP(userId);

// Validar código
const valido = await validarCodigoTOTP(secret, "123456");

// Ativar 2FA
await ativar2FA(userId, secret, backupCodes);

// Obter status
const { ativo, configurado } = await obter2FAStatus(userId);

// Usar código de backup
const usado = await usarCodigoBackup(userId, "ABC12345");
```

### 3. **Biblioteca de Auditoria** (`src/lib/audit.ts`)

```typescript
// Registrar ação
await registrarAuditoria({
  userId: "xxx",
  userEmail: "admin@email.com",
  acao: AUDIT_ACTIONS.EDITAR_PRODUTO,
  tabela: "produtos",
  registroId: "uuid-do-produto",
  dadosAntes: { nome: "Antigo", preco: 50 },
  dadosDepois: { nome: "Novo", preco: 60 },
});

// Buscar logs
const logs = await buscarAuditLog({
  acao: "editar_produto",
  dias: 7,
  limite: 100,
});

// Detectar atividades suspeitas
const suspeitas = await detectarAtividadesSuspeitas();
```

### 4. **Modal de Setup 2FA** (`src/components/setup-2fa-modal.tsx`)

- Step 1: Apresenta informações sobre 2FA
- Step 2: Mostra QR code (e secret manual)
- Step 3: Valida código de 6 dígitos
- Step 4: Exibe códigos de backup

### 5. **Dashboard de Auditoria** (`src/routes/admin/auditoria.tsx`)

- Visualização de todos os logs de auditoria
- Filtros: período, ação, tabela, status, usuário
- Alertas de atividades suspeitas
- Estatísticas (total, sucesso, falhas, usuários)
- Export em CSV

## Próximas mudanças necessárias (Implementation Checklist)

### Step 1: Executar migração SQL
```
Vá em Supabase Console → SQL Editor e execute:
supabase/migrations/20260810_add_2fa_and_audit.sql
```

### Step 2: Adicionar 2FA ao login do admin
Arquivo: `src/routes/admin.login.tsx` (ou similar)

```typescript
import { validarCodigoTOTP, obter2FAStatus } from "@/lib/auth-2fa";

// Após validar email/senha:
const status2FA = await obter2FAStatus(userId);
if (status2FA.ativo) {
  // Mostrar modal para digitar código TOTP
  // Validar com: validarCodigoTOTP(secret, codigo)
  // Se falhar, tentar com código de backup
}
```

### Step 3: Adicionar registros de auditoria às operações críticas

**Em `src/routes/admin.produtos.tsx`:**
```typescript
import { registrarAuditoria, AUDIT_ACTIONS } from "@/lib/audit";

// Ao criar produto:
await registrarAuditoria({
  userId: session.user.id,
  userEmail: session.user.email,
  acao: AUDIT_ACTIONS.CRIAR_PRODUTO,
  tabela: "produtos",
  registroId: newProduct.id,
  dadosDepois: newProduct,
});

// Ao editar produto:
await registrarAuditoria({
  userId: session.user.id,
  userEmail: session.user.email,
  acao: AUDIT_ACTIONS.EDITAR_PRODUTO,
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: oldProduct,
  dadosDepois: updatedProduct,
});

// Ao deletar produto:
await registrarAuditoria({
  userId: session.user.id,
  userEmail: session.user.email,
  acao: AUDIT_ACTIONS.DELETAR_PRODUTO,
  tabela: "produtos",
  registroId: product.id,
  dadosAntes: product,
  status: "success",
});
```

**Repetir para:**
- Cupons (criar, editar, deletar, ativar, desativar)
- Pedidos (mudar status, cancelar, deletar)
- Clientes (editar, deletar)
- Configurações

### Step 4: Adicionar link para Auditoria no admin header
Arquivo: `src/components/admin-header.tsx`

```typescript
<Link href="/admin/auditoria" className="...">
  🔍 Auditoria
</Link>
```

### Step 5: Adicionar Setup 2FA nas configurações do admin
Arquivo: `src/routes/admin/configuracoes.tsx` (criar se não existir)

```typescript
import { Setup2FAModal } from "@/components/setup-2fa-modal";

export function SettingsPage() {
  const [show2FAModal, setShow2FAModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShow2FAModal(true)}>
        🔐 Configurar 2FA
      </Button>

      <Setup2FAModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        userId={session.user.id}
        onSuccess={() => {
          toast.success("2FA ativado com sucesso!");
        }}
      />
    </>
  );
}
```

### Step 6: Instalar dependência para TOTP
```bash
npm install speakeasy
# ou
bun add speakeasy
```

### Step 7: Testar 2FA
1. Vá em Admin → Configurações
2. Clique em "🔐 Configurar 2FA"
3. Escaneie QR com Google Authenticator
4. Digite 6 dígitos do app
5. Guarde códigos de backup
6. Faça logout e login novamente
7. Digite código TOTP na segunda tela

### Step 8: Testar Auditoria
1. Crie um novo produto
2. Vá em Admin → 🔍 Auditoria
3. Veja o registro "criar_produto"
4. Filtre por ação, tabela, usuário
5. Exporte para CSV

## Locais para adicionar logging de auditoria

Priority **ALTA** (operações críticas):
- ✅ Criar/editar/deletar produtos
- ✅ Criar/editar/deletar cupons
- ✅ Mudar status de pedidos
- ✅ Cancelar pedidos
- ✅ Deletar pedidos
- ✅ Confirmar rascunho
- ✅ Limpar storage
- ✅ Limpar banco de dados

Priority **MÉDIA**:
- Editar cliente
- Deletar cliente
- Editar configurações
- Criar/deletar automação
- Ativar/desativar modo treino

Priority **BAIXA**:
- Visualizar relatórios
- Buscar produtos
- Filtrar pedidos

## Segurança

### 2FA
- ✅ Secrets TOTP armazenados na tabela
- ✅ Códigos de backup com 8 caracteres aleatórios
- ✅ Validação com janela de tempo (±30s)
- ⚠️ TODO: Adicionar rate limiting (max 3 tentativas com fallback para código de backup)
- ⚠️ TODO: Adicionar confirmação por email/SMS se 2FA falhar múltiplas vezes

### Auditoria
- ✅ Todos os registros têm user_id e email
- ✅ IP address e user agent rastreados
- ✅ Dados sensíveis removidos automaticamente (senhas, CPF, cartão)
- ✅ Detecção de atividades suspeitas (muitas falhas, múltiplos IPs)
- ⚠️ TODO: Alertas por email se muitas falhas em curto período
- ⚠️ TODO: Rotação de logs (arquivar após 6 meses)

## Compliance

- ✅ LGPD: Logs contêm apenas identificação (email)
- ✅ LGPD: Dados sensíveis são sanitizados antes de salvar
- ✅ LGPD: Usuário pode solicitar acesso aos seus próprios logs
- ⚠️ TODO: Implementar direito ao esquecimento (delete de logs pessoais após X dias)

## Endpoints da API para integração (se necessário)

```
GET  /admin/auditoria              - Dashboard
POST /admin/api/audit-log          - Registrar log (use função registrarAuditoria)
GET  /admin/api/audit-log          - Buscar logs
GET  /admin/api/atividades-suspeitas - Detectar suspeitas
GET  /admin/api/2fa-status         - Obter status 2FA
POST /admin/api/2fa-setup          - Iniciar setup
POST /admin/api/2fa-verify         - Validar código TOTP
POST /admin/api/2fa-disable        - Desativar 2FA
```

## Monitoramento

1. **Dashboard de Auditoria**: `/admin/auditoria`
2. **Detecção de Anomalias**: Alertas para atividades suspeitas
3. **Relatórios Periódicos**: Email com resumo mensal para owner
4. **Alertas em Tempo Real**: Notificação se falha de login repetida

## Rollback (se necessário)

```sql
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS admin_totp_secrets CASCADE;
DROP VIEW IF EXISTS audit_log_view;
DROP FUNCTION IF EXISTS validar_totp(uuid, text);
DROP FUNCTION IF EXISTS registrar_auditoria(...);
```

## Próximos passos (após deploy)

1. ✅ Integrar 2FA ao login
2. ✅ Adicionar auditoria a todos os endpoints críticos
3. ✅ Testar com múltiplos usuários
4. ⚠️ Implementar alertas por email
5. ⚠️ Treinar admin sobre 2FA
6. ⚠️ Revisar logs regularmente
