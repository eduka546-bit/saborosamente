# ✅ Checklist - Sistema de Campanhas WhatsApp (com Vídeos)

## Pré-requisitos
- [ ] WhatsApp Business Account ativada
- [ ] Meta App criado e publicado
- [ ] WhatsApp token gerado
- [ ] Phone Number ID obtido

## Setup Banco de Dados
- [ ] Executar `criar_tabela_campanhas.sql` no Supabase SQL Editor
  - Cria tabelas: `campanhas_whatsapp`, `campanhas_whatsapp_envios`
  - Adiciona: `video_url` e `midia_tipo` em campanhas_whatsapp
  - Cria indices para performance
  - Cria bucket de storage: `campanhas` (16MB para vídeos)
  - Configura RLS policies

## Configurar Supabase
- [ ] Ir em: Settings → Edge Functions → Secrets
- [ ] Adicionar:
  - `WHATSAPP_TOKEN` = seu_token
  - `WHATSAPP_PHONE_NUMBER_ID` = seu_phone_id

## Verificar Dados
- [ ] Clientes têm `telefone` preenchido em `profiles`
- [ ] Alguns clientes têm `bairro` para teste de filtro
- [ ] Pedidos entregues existem para calcular "gasto"
- [ ] _(Opcional)_ Vídeos MP4 disponíveis para teste

## Testar Sistema

### Teste 1: Só Texto
- [ ] Acesse `/admin/campanhas`
- [ ] Tipo de Mídia: "📝 Só Texto"
- [ ] Digite mensagem de teste
- [ ] Selecione 1 cliente
- [ ] Clique "Enviar"
- [ ] Verifique se chegou no WhatsApp

### Teste 2: Com Imagem
- [ ] Tipo de Mídia: "📷 Imagem"
- [ ] Upload uma imagem (PNG/JPG, máx 5MB)
- [ ] Digite mensagem
- [ ] Selecione 1 cliente
- [ ] Clique "Enviar"
- [ ] Verifique se imagem + texto chegou

### Teste 3: Com Vídeo
- [ ] Tipo de Mídia: "🎥 Vídeo"
- [ ] Upload um vídeo (MP4, máx 16MB)
- [ ] Digite mensagem
- [ ] Selecione 1 cliente
- [ ] Clique "Enviar"
- [ ] Verifique se vídeo + texto chegou

### Teste 4: Vários Contatos
- [ ] Selecione 5-10 clientes
- [ ] Envie campanha
- [ ] Verifique se todos receberam

## Verificar Envios
- [ ] Status muda de "Enviando" para "Enviada"
- [ ] Confirme que mensagens chegaram no WhatsApp
- [ ] Veja estatísticas: ✓ enviados, ✗ falhados
- [ ] Clique no histórico para ver detalhes

## Ir para Produção
- [ ] Testar com 20+ contatos
- [ ] Testar todos os filtros
- [ ] Testar lista manual (copiar/colar)
- [ ] Testar com imagem + vídeo + texto
- [ ] Documentar erros encontrados
- [ ] Liberar para usar

---

## 🎯 Status Atual

| Item | Status |
|------|--------|
| Página de Campanhas | ✅ Pronta (com vídeos) |
| Menu Admin | ✅ Configurado |
| Supabase Function | ✅ Pronta (com vídeos) |
| Banco de Dados | ⏳ Aguarda sua execução |
| Variáveis de Ambiente | ⏳ Aguarda sua configuração |
| Testes | ⏳ Pronto para testar |

---

## 📝 Notas

- Vídeos devem estar em formato MP4 para melhor compatibilidade
- Tamanho máximo 16MB para ficar seguro
- Imagens máximo 5MB
- Delay de 50ms entre mensagens evita rate limit
- Histórico mostra detalhes de cada envio

---

## 🚀 Próximos Passos

1. **Agora**: Execute `criar_tabela_campanhas.sql`
2. **Depois**: Configure variáveis de ambiente
3. **Então**: Acesse `/admin/campanhas` e teste com vídeos!
