# 🛡️ Proteções contra Restrição de Conta WhatsApp

## O Problema

WhatsApp pode restringir ou banir sua conta se:

- ❌ Enviar muitas mensagens muito rapidamente (rate limit)
- ❌ Ter muitos erros/rejeições de mensagens
- ❌ Usar a mesma mensagem para muitos contatos (spam)
- ❌ Não seguir as políticas de qualidade

**Nossa solução:** Proteções inteligentes para evitar isso!

---

## 🛡️ Proteções Implementadas

### 1. **Rate Limiting Conservador**

```
Por Minuto: 30 mensagens (WhatsApp permite 80, usamos menos)
Por Hora: 500 mensagens (WhatsApp permite 1000, usamos menos)
```

**Por quê?**

- WhatsApp não anuncia limites exatos
- Melhor ser conservador que arriscar ban
- Proteção contra throttling progressivo

### 2. **Delay Mínimo entre Mensagens**

```
2 segundos (2000ms) entre CADA mensagem
```

**Por quê?**

- Evita "rajada" de envios
- Simula padrão de usuário humano
- Distribuído ao longo do tempo = menos suspeito

### 3. **Backoff Exponencial em Rate Limit**

Se WhatsApp retornar erro 429 (Too Many Requests):

```
Tentativa 1: aguarde 5 segundos
Tentativa 2: aguarde 7.5 segundos
Tentativa 3: aguarde 11.25 segundos
```

**Por quê?**

- Detecta quando WhatsApp está throttling
- Para automaticamente e aguarda
- Tenta novamente quando permitido

### 4. **Retry Automático com Limite**

Cada mensagem tenta até **3 vezes** com backoff:

```
Erro? → Aguarde + Tente novamente
Erro novamente? → Aguarde mais + Tente novamente
Erro 3ª vez? → Marque como falhou e continue
```

**Por quê?**

- Rede/API podem falhar ocasionalmente
- Retry automático recupera falhas temporárias
- Limite de 3 evita loops infinitos

### 5. **Throttling Inteligente**

Monitora limite em tempo real:

```
A cada mensagem enviada:
- Incrementa contador por minuto
- Incrementa contador por hora
- Verifica se atingiu limite
- Se sim → aguarda antes de próxima
```

**Por quê?**

- Parausa automaticamente se atingir limite
- Evita "rajada" que quebraria limite
- Mantém conta segura

### 6. **Monitoramento e Logs**

Durante o envio, você vê:

```
📨 Contatos: 100 | Tipo: video | Rate Limit: 30/min | Delay: 2000ms
✓ 10/100 enviados | 10/30 msgs/min
✓ 20/100 enviados | 20/30 msgs/min
⏳ Throttling: 28/30 msgs/min | Aguardando 2000ms
✓ 30/100 enviados | 1/30 msgs/min (reset)
```

**Por quê?**

- Você vê o progresso em tempo real
- Detecta problemas cedo
- Sabe quando vai terminar

### 7. **Detecção de Limite Próximo**

Se atingir 90% do limite horário:

```
⚠️ AVISO: Próximo de limite horário (450/500).
Aguarde antes da próxima campanha.
```

---

## 📊 Configurações Padrão

| Parâmetro       | Valor      | Motivo                       |
| --------------- | ---------- | ---------------------------- |
| Por Minuto      | 30 msgs    | Conservador (80 permitido)   |
| Por Hora        | 500 msgs   | Conservador (1000 permitido) |
| Delay Mínimo    | 2 segundos | Realista para envio em massa |
| Backoff Inicial | 5 segundos | Tempo de espera inicial      |
| Backoff Fator   | 1.5x       | Crescimento exponencial      |
| Max Retries     | 3          | Limite de tentativas         |

---

## 🎯 Boas Práticas

### ✅ Faça:

- Envie campanhas em **horários de pico** (10h-20h)
- Divida contatos em **várias campanhas pequenas** (100-200 por vez)
- Aguarde **10-15 minutos** entre campanhas
- Personalize mensagens com **nome do cliente**
- Use **vídeos/imagens** para menos suspeita

### ❌ Evite:

- Enviar **1000+ contatos** em 1 campanha
- Fazer **múltiplas campanhas** seguidas (sem pause)
- Mensagens **idênticas** (parece spam)
- Enviar em **madrugada** (padrão não-natural)
- **Muito legais/suspeitos** (padrão bot)

---

## 📈 Exemplo: Campanha de 1000 Contatos

**Configuração otimizada:**

1. **Divida em 5 campanhas** de 200 contatos
2. **Envie 1 a cada 15 minutos**
3. **Taxa:** ~30 msgs/min × 7 minutos = 210 contatos
4. **Tempo total:** ~60 minutos = 1 hora segura

```
Campanha 1 (200) → 14h00 → 7 min
Campanha 2 (200) → 14h15 → 7 min
Campanha 3 (200) → 14h30 → 7 min
Campanha 4 (200) → 14h45 → 7 min
Campanha 5 (200) → 15h00 → 7 min
Total: 1 hora (seguro!)
```

---

## 🚨 Se Acontecer Restrição

### Sinais de Restrição:

- ❌ Erro 429 (Too Many Requests) = rate limited
- ❌ Erro 131026 = account blocked
- ❌ Mensagens não chegam (silently failing)

### O que fazer:

1. **PARE imediatamente** - não envie mais
2. **Aguarde 24-48 horas** - deixe a conta "respirar"
3. **Entre em contato com WhatsApp** - pode ser reversível
4. **Reduza limite** - edite RATE_LIMITS no código

---

## 🔧 Personalizações

Se quiser aumentar/diminuir limites, edite em:
`supabase/functions/whatsapp-campanha-enviar/index.ts`

```typescript
const RATE_LIMITS = {
  POR_MINUTO: 30, // Aumente se confiante
  POR_HORA: 500, // Aumente gradualmente
  DELAY_MIN_MS: 2000, // Diminua se quiser mais rápido
  BACKOFF_INICIAL_MS: 5000,
  BACKOFF_FATOR: 1.5,
};
```

⚠️ **CUIDADO:** Aumentar muito pode resultar em ban!

---

## 📞 Suporte

Se receber erros:

1. Verifique logs em Supabase → Functions → `whatsapp-campanha-enviar`
2. Procure por padrões de erro
3. Reduza limites se necessário
4. Contate suporte WhatsApp

---

**Sua conta WhatsApp está protegida! 🛡️**
