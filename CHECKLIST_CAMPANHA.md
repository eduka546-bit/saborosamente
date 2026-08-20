# ✅ Checklist - Sistema de Campanhas WhatsApp

## Pré-requisitos
- [ ] WhatsApp Business Account ativada
- [ ] Meta App criado e publicado
- [ ] WhatsApp token gerado
- [ ] Phone Number ID obtido

## Setup Banco de Dados
- [ ] Executar `criar_tabela_campanhas.sql` no Supabase SQL Editor
  - Cria tabelas: `campanhas_whatsapp`, `campanhas_whatsapp_envios`
  - Cria índices para performance
  - Cria bucket de storage: `campanhas`
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

## Testar Sistema
- [ ] Acesse `/admin/campanhas`
- [ ] Veja a página carregar sem erros
- [ ] Selecione clientes com filtro "Todos"
- [ ] Digite uma mensagem de teste
- [ ] _(Opcional)_ Upload uma imagem
- [ ] Clique "Enviar para X cliente(s)"
- [ ] Vá para aba "Histórico" e monitore

## Verificar Envios
- [ ] Status muda de "Enviando" para "Enviada"
- [ ] Confirme que mensagens chegaram no WhatsApp
- [ ] Veja estatísticas: ✓ enviados, ✗ falhados
- [ ] _(Se houver falhas)_ Clique no histórico para ver detalhes

## Ir para Produção
- [ ] Testar com todos os filtros
- [ ] Testar com lista manual (copiar/colar)
- [ ] Testar com imagem
- [ ] Testar com muitos contatos (100+)
- [ ] Documentar erros encontrados
- [ ] Liberar para usar

---

## 🎯 Status Atual

| Item | Status |
|------|--------|
| Página de Campanhas | ✅ Pronta |
| Menu Admin | ✅ Configurado |
| Supabase Function | ✅ Pronta |
| Banco de Dados | ⏳ Aguarda sua execução |
| Variáveis de Ambiente | ⏳ Aguarda sua configuração |
| Testes | ⏳ Pronto para testar |

---

## 📞 Próximos Passos

1. **Agora**: Execute `criar_tabela_campanhas.sql`
2. **Depois**: Configure variáveis de ambiente
3. **Então**: Acesse `/admin/campanhas` e teste!

