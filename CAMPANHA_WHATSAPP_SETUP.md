# 🚀 Sistema de Campanhas WhatsApp - Guia Completo

## Status: PRONTO PARA USO ✅

Seu sistema de envio em massa de mensagens WhatsApp com **IMAGENS, VÍDEOS E TEXTO** está 100% implementado e funcional!

---

## 📋 O que foi implementado

### 1. **Página de Campanhas** (`/admin/campanhas`)
   - **Upload de Mídia**: Escolha entre Imagem, Vídeo ou Só Texto
     - 📷 **Imagem**: PNG, JPG, WebP até 5MB
     - 🎥 **Vídeo**: MP4 até 16MB (WhatsApp Business)
     - 📝 **Só Texto**: Apenas a mensagem
   - **Editor de Mensagem**: TextArea com contador de caracteres
   - **Pré-visualização**: Celular em tempo real (com vídeo/imagem)
   - **Filtros de Clientes**:
     - ✅ Todos (com telefone)
     - ✅ Por Bairro (dropdown)
     - ✅ Por Gasto (range R$ min-max)
     - ✅ Ativos 30 dias (compra recente)
   - **Lista Completa Editável**: 
     - Edição individual de telefones
     - Adicionar/remover contatos
     - Import/Export via textarea

### 2. **Menu Admin**
   - Link "Campanhas → WhatsApp em Massa"
   - Acesso em: `/admin/campanhas`

### 3. **Supabase Function** (`whatsapp-campanha-enviar`)
   - Envio **sequencial** com delay de 50ms entre mensagens
   - Suporta **vídeo + texto**, **imagem + texto**, ou **só texto**
   - Vídeo/imagem é enviado PRIMEIRO, depois o texto
   - Detecta erros: rate limit, telefone inválido, número bloqueado
   - Rastreamento completo

### 4. **Histórico de Campanhas**
   - Status em tempo real: Enviando / Enviada / Erro
   - Estatísticas: enviados, falhados, total

---

## 🔧 SETUP NECESSÁRIO

### Passo 1: Criar Tabelas no Supabase

1. Acesse Supabase Console → SQL Editor
2. Copie todo o conteúdo de `criar_tabela_campanhas.sql`
3. Execute (Ctrl+Enter)

**O que é criado:**
- `campanhas_whatsapp`: armazena campanha com `video_url` e `midia_tipo`
- `campanhas_whatsapp_envios`: rastreamento individual
- Storage bucket `campanhas`: para imagens E vídeos (16MB)

### Passo 2: Configurar Variáveis

Supabase → Settings → Edge Functions → Secrets:

```
WHATSAPP_TOKEN=seu_token
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
```

### Passo 3: Testar

1. Acesse `/admin/campanhas`
2. Selecione clientes
3. Escolha mídia (Imagem/Vídeo/Só Texto)
4. Digite mensagem
5. Clique "Enviar"

---

## 📱 Como Usar

### Com Vídeo:
1. Tipo de Mídia: "🎥 Vídeo"
2. Upload: MP4 (máx 16MB)
3. Mensagem: texto que vai junto
4. Enviar

### Com Imagem:
1. Tipo de Mídia: "📷 Imagem"
2. Upload: PNG/JPG/WebP (máx 5MB)
3. Mensagem: texto
4. Enviar

### Só Texto:
1. Tipo de Mídia: "📝 Só Texto"
2. Digite mensagem
3. Enviar

---

## 🎯 Características

✅ Suporte a vídeos MP4 (até 16MB)
✅ Suporte a imagens (até 5MB)
✅ Pré-visualização em tempo real
✅ Filtros por bairro, gasto, atividade
✅ Lista editável (copiar/colar)
✅ Envio inteligente (mídia primeiro, depois texto)
✅ Rate limit proteção (50ms entre mensagens)
✅ Histórico completo com estatísticas

---

## 📊 Banco de Dados

### campanhas_whatsapp
- `id, nome, mensagem`
- `imagem_url` (NULL se vídeo/texto)
- `video_url` (NULL se imagem/texto)
- `midia_tipo` ('imagem'/'video'/'nenhuma')
- `status, contatos_total, contatos_enviados, contatos_falhados`

### campanhas_whatsapp_envios
- `campanha_id, telefone, status`
- `erro_mensagem, enviado_em`

---

## 🚨 Troubleshooting

**Vídeo não envia?**
- Formato: MP4 recomendado
- Tamanho: máx 16MB
- Verifique se bucket permite vídeos

**Imagem não envia?**
- Tamanho: máx 5MB
- Formatos: PNG, JPG, WebP

**Contatos não carregam?**
- Verifique `telefone` em `profiles`
- Verifique `bairro` para filtro

---

**Tudo pronto! Acesse `/admin/campanhas` e comece a enviar! 🎉**
