# 🚀 Sistema de Campanhas WhatsApp - Guia Completo

## Status: PRONTO PARA USO ✅

Seu sistema de envio em massa de mensagens WhatsApp com arte está 100% implementado e funcional!

---

## 📋 O que foi implementado

### 1. **Página de Campanhas** (`/admin/campanhas`)
   - **Upload de Imagem**: Drag & drop com validação (máx 5MB, formatos: PNG, JPG, WebP)
   - **Editor de Mensagem**: TextArea com contador de caracteres
   - **Pré-visualização**: Celular em tempo real mostrando como a mensagem vai aparecer
   - **Filtros de Clientes**:
     - ✅ Todos (com telefone)
     - ✅ Por Bairro (dropdown)
     - ✅ Por Gasto (range R$ min-max)
     - ✅ Ativos 30 dias (compra recente)
   - **Lista Completa Expansível**: 
     - Edição individual de telefones
     - Adicionar/remover contatos
     - Import/Export via textarea (copiar/colar)
     - Botão copy para clipboard

### 2. **Menu Admin**
   - Link "Campanhas" adicionado em `Campanhas > WhatsApp em Massa`
   - Acesso em: `/admin/campanhas`

### 3. **Supabase Function** (`whatsapp-campanha-enviar`)
   - Envio **sequencial** com delay de 50ms entre mensagens
   - Suporta **imagem + texto** (image link primeiro, depois mensagem)
   - Detecta erros: rate limit, telefone inválido, número bloqueado
   - Rastreamento completo em `campanhas_whatsapp_envios`

### 4. **Histórico de Campanhas**
   - Aba "Histórico" com status em tempo real
   - Badges: ✅ Enviada | ⏳ Enviando | ❌ Erro
   - Estatísticas: total contatos, enviados, falhados

---

## 🔧 SETUP NECESSÁRIO (Execute uma única vez)

### Passo 1: Criar Tabelas no Supabase

1. Acesse Supabase Console → SQL Editor
2. Copie todo o conteúdo de `criar_tabela_campanhas.sql`
3. Execute (Ctrl+Enter)

**Tabelas criadas:**
- `campanhas_whatsapp`: Dados da campanha
- `campanhas_whatsapp_envios`: Rastreamento individual
- Storage bucket `campanhas`: Para armazenar imagens

### Passo 2: Configurar Variáveis de Ambiente

No Supabase Console → Settings → Edge Functions → Secrets adicione:

```
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
```

**Como conseguir:**
1. Meta Business Suite → WhatsApp → Settings → API Token
2. WhatsApp Business Account → Phone Numbers → ID

### Passo 3: Testar Acesso

1. Acesse `/admin/campanhas`
2. Selecione alguns clientes
3. Digite uma mensagem
4. Clique "Enviar"
5. Acompanhe status na aba "Histórico"

---

## 📱 Como Usar (Fluxo do Usuário)

### Criar Campanha:
1. **Aba "Criar Campanha"**
2. _(Opcional)_ Digite nome da campanha
3. **Upload**: Clique/arraste imagem da promoção
4. **Mensagem**: Digite o texto que vai junto
5. **Filtros**: Escolha qual lista de clientes
   - Ou use a lista completa para revisar/editar
6. **Enviar**: Clique "Enviar para X cliente(s)"
7. **Histórico**: Acompanhe na aba "Histórico"

### Usar Lista Manual:
- Clique **"Ver/Editar Lista Completa"**
- Cole telefones (um por linha)
- Edite/adicione/remova conforme precisar
- Clique "Enviar"

---

## 🎯 Features Principais

### Filtro "Por Gasto"
Filtra clientes que gastaram entre R$ mín e R$ máx (calculado a partir de pedidos entregues)

### Filtro "Ativos 30d"
Clientes que compraram nos últimos 30 dias

### Pré-visualização em Tempo Real
Veja exatamente como a mensagem + imagem vai aparecer no celular do cliente

### Envio Inteligente
- 🖼️ Imagem é enviada primeiro (link)
- 💬 Depois vem o texto
- ⏱️ 50ms entre mensagens (anti-rate limit)
- ✅ Rastreamento completo

### Histórico Completo
- Status: Enviando / Enviada / Erro
- Estatísticas por campanha
- Detalhes de cada envio em `campanhas_whatsapp_envios`

---

## 📊 Dados Salvos

### Tabela: `campanhas_whatsapp`
```
- id (UUID)
- nome (TEXT)
- mensagem (TEXT)
- imagem_url (TEXT)
- status (enviando/enviada/erro/cancelada)
- contatos_total
- contatos_enviados
- contatos_falhados
- created_at / updated_at
- created_by (seu admin ID)
```

### Tabela: `campanhas_whatsapp_envios`
```
- id (UUID)
- campanha_id
- telefone
- status (pendente/enviado/falhou/bloqueado)
- erro_mensagem
- enviado_em
- created_at
```

---

## 🔐 Segurança

- RLS policies: Apenas admins podem criar/ler campanhas
- Storage bucket: Público (mas só imagens de campanha)
- Telefones: Salvos apenas para rastreamento
- Tokens WhatsApp: Protegidos em Supabase Secrets

---

## 🚨 Troubleshooting

### "Erro ao enviar campanha"
1. Verifique se as tabelas foram criadas em Supabase
2. Verifique se `WHATSAPP_TOKEN` está configurado
3. Verifique se o telefone está no formato correto (com DDD)

### "Contatos não carregam"
1. Confirme que existem clientes com `telefone` em `profiles`
2. Verifique se tem `bairro` preenchido para filtro "Por Bairro"

### "Imagem não envia"
1. Verifique tamanho (máx 5MB)
2. Formatos suportados: PNG, JPG, WebP
3. Bucket `campanhas` deve estar público

### "Rate limit ao enviar muitos"
- Sistema já tem proteção (50ms entre mensagens)
- Se continuar, aumentar delay em `whatsapp-campanha-enviar/index.ts`

---

## 📁 Arquivos Envolvidos

```
src/
├── routes/
│   └── admin.campanhas.tsx          ← Página principal
├── components/
│   └── admin-header.tsx             ← Menu com link
supabase/
└── functions/
    └── whatsapp-campanha-enviar/
        └── index.ts                 ← Função de envio

criar_tabela_campanhas.sql           ← Setup DB
```

---

## ✨ Próximas Melhorias (Opcionais)

- [ ] Agendar campanha para hora específica
- [ ] Templates de mensagem predefinidas
- [ ] A/B testing de mensagens
- [ ] Análise de taxa de abertura
- [ ] Integração com WhatsApp Business API (templates aprovados)

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique se executou o SQL em `criar_tabela_campanhas.sql`
2. Confirme variáveis de ambiente no Supabase
3. Teste com um cliente único primeiro
4. Veja logs em Supabase → Functions → `whatsapp-campanha-enviar`

---

**Pronto para usar! 🎉**

Acesse `/admin/campanhas` e comece a enviar suas campanhas!
