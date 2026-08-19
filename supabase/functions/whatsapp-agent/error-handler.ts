/**
 * Error Handler para WhatsApp Agent
 * Provides structured logging, retry logic, and fallback responses
 */

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  telefone: string;
  conversaId?: string;
  evento: string;
  mensagem: string;
  erro?: string;
  stack?: string;
  contexto?: Record<string, any>;
}

/**
 * Logger estruturado com suporte a múltiplos níveis
 */
export class WhatsAppLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Manter últimos 1000 logs em memória

  log(
    level: "INFO" | "WARN" | "ERROR",
    telefone: string,
    evento: string,
    mensagem: string,
    options?: {
      conversaId?: string;
      erro?: Error;
      contexto?: Record<string, any>;
    }
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      telefone,
      conversaId: options?.conversaId,
      evento,
      mensagem,
      erro: options?.erro?.message,
      stack: options?.erro?.stack,
      contexto: options?.contexto,
    };

    this.logs.push(entry);

    // Limpa logs antigos
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console também
    const logStr = `[${level}] ${evento} (${telefone}): ${mensagem}`;
    if (level === "ERROR") {
      console.error(logStr, options?.erro);
    } else if (level === "WARN") {
      console.warn(logStr);
    } else {
      console.log(logStr);
    }
  }

  info(telefone: string, evento: string, mensagem: string, options?: any) {
    this.log("INFO", telefone, evento, mensagem, options);
  }

  warn(telefone: string, evento: string, mensagem: string, options?: any) {
    this.log("WARN", telefone, evento, mensagem, options);
  }

  error(telefone: string, evento: string, mensagem: string, erro?: Error, options?: any) {
    this.log("ERROR", telefone, evento, mensagem, {
      ...options,
      erro,
    });
  }

  getLogs(filtro?: { level?: string; evento?: string; limite?: number }) {
    let results = this.logs;

    if (filtro?.level) {
      results = results.filter(l => l.level === filtro.level);
    }

    if (filtro?.evento) {
      results = results.filter(l => l.evento.includes(filtro.evento));
    }

    if (filtro?.limite) {
      results = results.slice(-filtro.limite);
    }

    return results;
  }

  exportar() {
    return {
      total: this.logs.length,
      logs: this.logs,
      erros: this.logs.filter(l => l.level === "ERROR").length,
    };
  }
}

/**
 * Retry logic com exponential backoff
 */
export class RetryHandler {
  static async retry<T>(
    fn: () => Promise<T>,
    options?: {
      maxTentativas?: number;
      delayMs?: number;
      backoffMultiplier?: number;
      nomeOperacao?: string;
      telefone?: string;
    }
  ): Promise<T> {
    const maxTentativas = options?.maxTentativas ?? 3;
    const delayMs = options?.delayMs ?? 500;
    const backoffMultiplier = options?.backoffMultiplier ?? 2;
    const nomeOperacao = options?.nomeOperacao ?? "Operação";
    const telefone = options?.telefone ?? "desconhecido";

    let ultimoErro: Error | null = null;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      try {
        console.log(`[RETRY] ${nomeOperacao} (tentativa ${tentativa}/${maxTentativas})`);
        return await fn();
      } catch (e) {
        ultimoErro = e instanceof Error ? e : new Error(String(e));

        if (tentativa < maxTentativas) {
          const delayAtual = delayMs * Math.pow(backoffMultiplier, tentativa - 1);
          console.warn(
            `[RETRY] ${nomeOperacao} falhou na tentativa ${tentativa}/${maxTentativas}. Aguardando ${delayAtual}ms antes de retry...`,
            ultimoErro.message
          );
          await new Promise(r => setTimeout(r, delayAtual));
        } else {
          console.error(
            `[RETRY] ${nomeOperacao} falhou após ${maxTentativas} tentativas para ${telefone}`,
            ultimoErro
          );
        }
      }
    }

    throw ultimoErro ?? new Error(`${nomeOperacao} falhou após ${maxTentativas} tentativas`);
  }
}

/**
 * Fallback responses quando algo dá errado
 */
export const FALLBACK_RESPONSES = {
  IA_INDISPONIVEL: "Desculpa, nosso assistente teve um problema técnico 😔\n\nPor enquanto, você pode:\n📱 Falar com nossa equipe aqui\n🌐 Acessar o site: saborosamente.vercel.app\n\nTente novamente em alguns minutos!",

  BANCO_DADOS_ERRO: "Ops! Tive um problema para acessar nossos dados 😞\n\nVocê pode fazer o pedido pelo site: saborosamente.vercel.app\n\nOu tente mensagear novamente em alguns instantes!",

  ENVIO_FALHOU: "A mensagem não foi enviada, mas suas informações foram salvas! 📝\n\nVou tentar enviar novamente. Se continuar com problema, nosso time em breve vai responder.",

  PEDIDO_NAO_CRIADO: "Tive um problema ao criar seu pedido 😔\n\nMas suas informações foram salvas! Nossa equipe vai analisar e entrar em contato com você.\n\nObrigada! 🍱",

  GENERICO: "Desculpa o incômodo! Tive um pequeno erro no processamento 🤔\n\nPode tentar mensagear novamente? Ou me conte como posso ajudar!",
};

/**
 * Wrapper para operações WhatsApp com tratamento de erro
 */
export async function executarComFallback<T>(
  operacao: () => Promise<T>,
  options?: {
    fallbackResponse?: string;
    telefone?: string;
    nomeOperacao?: string;
    conversaId?: string;
    logger?: WhatsAppLogger;
    salvarFallback?: (msg: string) => Promise<void>;
  }
): Promise<T | null> {
  try {
    return await operacao();
  } catch (erro) {
    const err = erro instanceof Error ? erro : new Error(String(erro));

    // Log do erro
    if (options?.logger) {
      options.logger.error(
        options.telefone ?? "desconhecido",
        options.nomeOperacao ?? "Operação desconhecida",
        "Erro durante execução",
        err,
        { conversaId: options.conversaId }
      );
    }

    // Se tem um fallback para salvar (ex: mensagem de erro)
    if (options?.salvarFallback && options.fallbackResponse) {
      try {
        await options.salvarFallback(options.fallbackResponse);
      } catch (saveErr) {
        console.error("Falha ao salvar resposta de fallback:", saveErr);
      }
    }

    return null;
  }
}

/**
 * Valida input do webhook para evitar processamento de dados inválidos
 */
export function validarWebhookInput(body: any): {
  valido: boolean;
  erro?: string;
  dados?: any;
} {
  try {
    if (!body || typeof body !== "object") {
      return { valido: false, erro: "Body não é um objeto válido" };
    }

    const entry = body?.entry?.[0];
    if (!entry) {
      return { valido: false, erro: "Entry não encontrada" };
    }

    const changes = entry?.changes?.[0];
    if (!changes) {
      return { valido: false, erro: "Changes não encontrada" };
    }

    const value = changes?.value;
    if (!value) {
      return { valido: false, erro: "Value não encontrada" };
    }

    const messages = value?.messages;
    if (!messages || !Array.isArray(messages)) {
      return { valido: false, erro: "Messages não é um array válido" };
    }

    if (messages.length === 0) {
      return { valido: false, erro: "Nenhuma mensagem no array" };
    }

    const msg = messages[0];
    const telefone = msg?.from;
    if (!telefone) {
      return { valido: false, erro: "Telefone não encontrado na mensagem" };
    }

    return {
      valido: true,
      dados: {
        entry,
        changes,
        value,
        messages,
        msg,
        telefone,
        nomeContato: value?.contacts?.[0]?.profile?.name,
        menuId: msg.interactive?.list_reply?.id ?? msg.interactive?.button_reply?.id ?? null,
        texto: msg.text?.body ?? msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? "",
      },
    };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { valido: false, erro: `Erro ao validar webhook: ${err.message}` };
  }
}

/**
 * Exponential backoff com jitter para distribuir requisições
 */
export async function aguardarComJitter(ms: number, jitterPercent: number = 10): Promise<void> {
  const jitter = (Math.random() - 0.5) * (ms * (jitterPercent / 100));
  const delayFinal = ms + jitter;
  return new Promise(r => setTimeout(r, Math.max(0, delayFinal)));
}
