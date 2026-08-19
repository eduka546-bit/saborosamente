# Task #2: WhatsApp Agent Reliability Improvements

## Status

✅ **Componente de Error Handling criado:** `supabase/functions/whatsapp-agent/error-handler.ts`

## O que foi implementado

### 1. **WhatsAppLogger** - Logging estruturado
- Rastreamento de todos os eventos (INFO, WARN, ERROR)
- Log de telefone, evento, mensagem e contexto
- Exportação de logs para análise
- Últimos 1000 logs em memória

```typescript
logger.info(telefone, "evento", "mensagem", { conversaId: "..." });
logger.error(telefone, "evento", "mensagem", erro, { contexto: {...} });
```

### 2. **RetryHandler** - Retry com exponential backoff
- Tenta operações críticas até 3 vezes
- Backoff exponencial (500ms → 1s → 2s)
- Previne rate limiting do WhatsApp/OpenAI
- Log automático de tentativas

```typescript
const resultado = await RetryHandler.retry(
  () => fetch(...),
  { maxTentativas: 3, delayMs: 500, nomeOperacao: "Enviar mensagem" }
);
```

### 3. **FALLBACK_RESPONSES** - Respostas inteligentes em caso de erro
- Resposta específica para cada tipo de erro (IA indisponível, banco de dados, etc)
- Cliente sempre recebe feedback ao invés de silêncio
- Instruções de como contatar suporte

### 4. **validarWebhookInput()** - Validação de entrada
- Valida estrutura do webhook antes de processar
- Detecta dados inválidos ou incompletos
- Previne processamento de mensagens malformadas
- Retorna mensagem de erro específica

### 5. **executarComFallback()** - Wrapper para operações com fallback
- Executa operação com tratamento de erro
- Registra no logger se falhar
- Executa fallback automático se especificado

```typescript
const resultado = await executarComFallback(
  () => chamarOpenAI(...),
  {
    fallbackResponse: FALLBACK_RESPONSES.IA_INDISPONIVEL,
    telefone,
    nomeOperacao: "Chamar OpenAI",
    logger,
    salvarFallback: (msg) => sendWhatsAppMessage(telefone, msg)
  }
);
```

## Próximas mudanças necessárias (Implementation Plan)

### Step 1: Adicionar o import do error-handler
```typescript
import { WhatsAppLogger, RetryHandler, validarWebhookInput, FALLBACK_RESPONSES } from "./error-handler.ts";

const logger = new WhatsAppLogger();
```

### Step 2: Adicionar try-catch ao handler principal
```typescript
Deno.serve(async (req) => {
  // ... código existente ...

  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      logger.error("webhook", "parse_json", "Erro ao fazer parse", e);
      return new Response("Invalid JSON", { status: 400 });
    }

    try {
      // Valida webhook
      const validacao = validarWebhookInput(body);
      if (!validacao.valido) {
        logger.warn("webhook", "validacao", `Inválido: ${validacao.erro}`);
        return new Response("OK", { status: 200 });
      }

      // Processa mensagem com try-catch
      const { telefone, ... } = validacao.dados!;
      try {
        // ... resto da lógica ...
      } catch (processError) {
        logger.error(telefone, "processar_mensagem", "Erro ao processar", processError);
        // Envia fallback ao cliente
        try {
          await sendWhatsAppMessage(telefone, FALLBACK_RESPONSES.GENERICO);
        } catch (sendError) {
          logger.error(telefone, "enviar_fallback", "Falha ao enviar mensagem de erro", sendError);
        }
      }
    } catch (webhookError) {
      logger.error("webhook", "processamento", "Erro geral", webhookError);
      return new Response("Internal error", { status: 500 });
    }
  }
});
```

### Step 3: Adicionar retry nas funções críticas
```typescript
async function sendWhatsAppMessage(to: string, text: string) {
  return RetryHandler.retry(
    async () => {
      const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      });
      
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    {
      maxTentativas: 2,
      delayMs: 300,
      nomeOperacao: "Enviar mensagem WhatsApp",
      telefone: to,
    }
  );
}
```

### Step 4: Adicionar logging em operações importantes
```typescript
logger.info(telefone, "iniciar_conversa", `Nova conversa iniciada`, { conversaId: conversa.id });
logger.info(telefone, "chamar_openai", `Chamando IA com ${historico.length} mensagens`);
logger.error(telefone, "criar_pedido", "Falha ao criar pedido no banco", erro);
```

### Step 5: Criar endpoint de visualização de logs (opcional)
```typescript
// GET /functions/v1/whatsapp-agent-logs
// Admin pode ver logs dos últimos erros
// Requer autenticação
```

## Benefícios

1. **Confiabilidade:** Retry automático em falhas temporárias
2. **Debugging:** Logs estruturados facilitam rastreamento de problemas
3. **UX:** Cliente sempre recebe feedback (sem silêncio embaraçoso)
4. **Observabilidade:** Métricas de sucesso/falha por operação
5. **Rate Limiting:** Backoff inteligente evita bloqueios

## Testes recomendados

1. Desligar OpenAI API → Verificar se fallback é enviado
2. Desligar conexão do banco → Verificar se fallback é enviado
3. Enviar webhook com JSON inválido → Verificar se não causa erro no servidor
4. Enviar 10 mensagens rápidas → Verificar se backoff previne rate limiting
5. Monitorar logs em tempo real → Verificar se eventos são rastreados

## Checklist de implementação

- [ ] Integrar import do error-handler ao index.ts
- [ ] Adicionar logger instância global
- [ ] Adicionar try-catch ao handler POST
- [ ] Adicionar retry às 5 principais funções de envio (WhatsAppMessage, List, Buttons, Image, Document)
- [ ] Adicionar logging em 10+ pontos críticos (iniciar conversa, chamar IA, criar pedido, etc)
- [ ] Testar com webhook com JSON inválido
- [ ] Testar retry logic desligando OpenAI
- [ ] Testar fallback responses
- [ ] Fazer deploy em staging
- [ ] Monitorar logs por 24h em produção
