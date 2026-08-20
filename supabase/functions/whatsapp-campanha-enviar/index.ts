import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ====== RATE LIMITING CONFIG ======
// Conservative limits para evitar restrição de conta
const RATE_LIMITS = {
  // Máximo de mensagens por minuto (WhatsApp recomenda 80, vamos usar 30)
  POR_MINUTO: 30,
  // Máximo de mensagens por hora (WhatsApp recomenda até 1000, vamos usar 500)
  POR_HORA: 500,
  // Delay mínimo entre mensagens (em ms)
  DELAY_MIN_MS: 2000, // 2 segundos entre cada mensagem
  // Backoff exponencial inicial (em ms)
  BACKOFF_INICIAL_MS: 5000, // 5 segundos se rate limit
  // Fator de multiplicação do backoff
  BACKOFF_FATOR: 1.5,
};

// ====== MONITORAMENTO ======
class RateLimitMonitor {
  private messagesPerMinute: { timestamp: number; count: number } = {
    timestamp: Date.now(),
    count: 0,
  };
  private messagesPerHour: number = 0;
  private lastMessageTime: number = 0;
  private consecutiveRateLimits: number = 0;

  shouldThrottle(): boolean {
    const now = Date.now();
    const timeSinceMinute = now - this.messagesPerMinute.timestamp;

    // Reset counters se passou 1 minuto ou 1 hora
    if (timeSinceMinute > 60_000) {
      this.messagesPerMinute = { timestamp: now, count: 0 };
    }

    // Verificar limites
    if (this.messagesPerMinute.count >= RATE_LIMITS.POR_MINUTO) {
      console.warn(
        `⚠️ Rate limit por minuto atingido: ${this.messagesPerMinute.count}/${RATE_LIMITS.POR_MINUTO}`
      );
      return true;
    }

    if (this.messagesPerHour >= RATE_LIMITS.POR_HORA) {
      console.warn(
        `⚠️ Rate limit por hora atingido: ${this.messagesPerHour}/${RATE_LIMITS.POR_HORA}`
      );
      return true;
    }

    // Verificar delay mínimo
    const timeSinceLastMessage = now - this.lastMessageTime;
    if (timeSinceLastMessage < RATE_LIMITS.DELAY_MIN_MS) {
      const delaySecs = (RATE_LIMITS.DELAY_MIN_MS - timeSinceLastMessage) / 1000;
      console.log(`⏳ Aguardando ${delaySecs.toFixed(1)}s (delay mínimo)...`);
      return true;
    }

    return false;
  }

  recordMessage(): void {
    this.messagesPerMinute.count++;
    this.messagesPerHour++;
    this.lastMessageTime = Date.now();
    this.consecutiveRateLimits = 0;
  }

  recordRateLimit(): number {
    this.consecutiveRateLimits++;
    const delayMs = Math.floor(
      RATE_LIMITS.BACKOFF_INICIAL_MS *
        Math.pow(RATE_LIMITS.BACKOFF_FATOR, this.consecutiveRateLimits - 1)
    );
    console.warn(
      `⚠️ Rate limit detectado! Backoff exponencial: ${delayMs}ms (tentativa ${this.consecutiveRateLimits})`
    );
    return delayMs;
  }

  getStatus(): {
    porMinuto: number;
    porHora: number;
    proximaMensagemEm: number;
  } {
    const proximaMensagemEm = Math.max(
      0,
      this.lastMessageTime +
        RATE_LIMITS.DELAY_MIN_MS -
        Date.now()
    );
    return {
      porMinuto: this.messagesPerMinute.count,
      porHora: this.messagesPerHour,
      proximaMensagemEm,
    };
  }
}

/**
 * Envia mensagem com retry automático e backoff exponencial
 */
async function enviarComRetry(
  to: string,
  imagemUrl: string | null,
  videoUrl: string | null,
  mensagem: string,
  maxRetries: number = 3
): Promise<{ sucesso: boolean; erro?: string; tentativas: number }> {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  let tentativas = 0;
  let delayMs = 0;

  for (let i = 0; i < maxRetries; i++) {
    tentativas++;

    // Aguardar se houver backoff
    if (delayMs > 0) {
      console.log(
        `⏳ Backoff: aguardando ${delayMs}ms antes de retry ${tentativas}...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      // Enviar vídeo primeiro se existir
      if (videoUrl) {
        const resVid = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "video",
            video: {
              link: videoUrl,
            },
          }),
        });

        if (!resVid.ok) {
          const err = await resVid.json().catch(() => ({}));
          
          // Detectar rate limit
          if (resVid.status === 429 || err.error?.code === 429) {
            delayMs = RATE_LIMITS.BACKOFF_INICIAL_MS;
            console.warn(`🚫 Rate limit (vídeo) - retry em ${delayMs}ms`);
            continue;
          }

          return { sucesso: false, erro: "Erro ao enviar vídeo", tentativas };
        }

        // Pequeno delay entre vídeo e texto
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else if (imagemUrl) {
        // Enviar imagem se não houver vídeo
        const resImg = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "image",
            image: {
              link: imagemUrl,
            },
          }),
        });

        if (!resImg.ok) {
          const err = await resImg.json().catch(() => ({}));
          
          if (resImg.status === 429 || err.error?.code === 429) {
            delayMs = RATE_LIMITS.BACKOFF_INICIAL_MS;
            console.warn(`🚫 Rate limit (imagem) - retry em ${delayMs}ms`);
            continue;
          }

          return { sucesso: false, erro: "Erro ao enviar imagem", tentativas };
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Enviar texto
      const resText = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: mensagem },
        }),
      });

      if (!resText.ok) {
        const err = await resText.json().catch(() => ({}));

        // Rate limit - usar backoff exponencial
        if (resText.status === 429 || err.error?.code === 429) {
          delayMs = Math.floor(
            RATE_LIMITS.BACKOFF_INICIAL_MS *
              Math.pow(RATE_LIMITS.BACKOFF_FATOR, tentativas - 1)
          );
          console.warn(
            `🚫 Rate limit (texto) na tentativa ${tentativas} - próximo em ${delayMs}ms`
          );
          continue;
        }

        // Outros erros
        let erroMsg = "Erro ao enviar";
        if (err.error?.message?.includes("invalid recipient")) {
          return {
            sucesso: false,
            erro: "Telefone inválido",
            tentativas,
          };
        } else if (
          err.error?.message?.includes("blocked") ||
          err.error?.code === 131_026
        ) {
          return { sucesso: false, erro: "Número bloqueado", tentativas };
        }

        return { sucesso: false, erro: erroMsg, tentativas };
      }

      // Sucesso!
      return { sucesso: true, tentativas };
    } catch (e) {
      console.error(`Erro na tentativa ${tentativas}:`, e);
      if (i < maxRetries - 1) {
        delayMs = Math.floor(
          RATE_LIMITS.BACKOFF_INICIAL_MS *
            Math.pow(RATE_LIMITS.BACKOFF_FATOR, i)
        );
        continue;
      }
      return {
        sucesso: false,
        erro: e instanceof Error ? e.message : "Erro desconhecido",
        tentativas,
      };
    }
  }

  return {
    sucesso: false,
    erro: `Falhou após ${tentativas} tentativas`,
    tentativas,
  };
}

/**
 * Handler principal - com proteções contra restrição de conta
 */
export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const monitor = new RateLimitMonitor();
  let campanha_id = "";

  try {
    const { campanha_id: cid, contatos, mensagem, imagem_url, video_url, midia_tipo } = await req.json();

    campanha_id = cid;

    if (!campanha_id || !contatos || !mensagem) {
      return new Response("Missing required fields", { status: 400 });
    }

    console.log(
      `🚀 Iniciando envio de campanha ${campanha_id}`
    );
    console.log(
      `📨 Contatos: ${contatos.length} | Tipo: ${midia_tipo} | Rate Limit: ${RATE_LIMITS.POR_MINUTO}/min | Delay: ${RATE_LIMITS.DELAY_MIN_MS}ms`
    );

    // Atualizar status inicial
    await supabase
      .from("campanhas_whatsapp")
      .update({ status: "enviando" })
      .eq("id", campanha_id);

    // Criar registros de envio
    const envios = contatos.map((tel: string) => ({
      campanha_id,
      telefone: tel,
      status: "pendente",
    }));

    const { error: insertError } = await supabase
      .from("campanhas_whatsapp_envios")
      .insert(envios);

    if (insertError) {
      console.error("Erro ao inserir envios:", insertError);
      throw insertError;
    }

    // Enviar mensagens com proteções
    let enviados = 0;
    let falhados = 0;
    let tentativasTotais = 0;
    const erros: { telefone: string; erro: string; tentativas: number }[] = [];
    const horaInicio = Date.now();

    for (let i = 0; i < contatos.length; i++) {
      const telefone = contatos[i];

      // Verificar throttle
      while (monitor.shouldThrottle()) {
        const status = monitor.getStatus();
        console.log(
          `⏳ Throttling: ${status.porMinuto}/${RATE_LIMITS.POR_MINUTO} msgs/min | Aguardando ${status.proximaMensagemEm}ms`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000, status.proximaMensagemEm))
        );
      }

      try {
        const resultado = await enviarComRetry(
          telefone,
          imagem_url,
          video_url,
          mensagem
        );

        tentativasTotais += resultado.tentativas;

        if (resultado.sucesso) {
          enviados++;
          monitor.recordMessage();

          await supabase
            .from("campanhas_whatsapp_envios")
            .update({
              status: "enviado",
              enviado_em: new Date().toISOString(),
            })
            .eq("campanha_id", campanha_id)
            .eq("telefone", telefone);

          const status = monitor.getStatus();
          if ((i + 1) % 10 === 0) {
            console.log(
              `✓ ${i + 1}/${contatos.length} enviados | ${status.porMinuto}/${RATE_LIMITS.POR_MINUTO} msgs/min`
            );
          }
        } else {
          falhados++;
          const statusErro = resultado.erro?.includes("bloqueado")
            ? "bloqueado"
            : "falhou";

          await supabase
            .from("campanhas_whatsapp_envios")
            .update({
              status: statusErro,
              erro_mensagem: resultado.erro || "Erro desconhecido",
            })
            .eq("campanha_id", campanha_id)
            .eq("telefone", telefone);

          erros.push({
            telefone,
            erro: resultado.erro || "Desconhecido",
            tentativas: resultado.tentativas,
          });
        }
      } catch (e) {
        console.error(`Erro crítico ao processar ${telefone}:`, e);
        falhados++;
        erros.push({
          telefone,
          erro: e instanceof Error ? e.message : "Erro crítico",
          tentativas: 1,
        });
      }
    }

    // Atualizar status final
    const horaFim = Date.now();
    const tempoTotalSecs = Math.round((horaFim - horaInicio) / 1000);
    const statusFinal = "enviada"; // Marca como enviada mesmo com falhas
    const txaSucesso = Math.round((enviados / contatos.length) * 100);

    await supabase
      .from("campanhas_whatsapp")
      .update({
        status: statusFinal,
        contatos_enviados: enviados,
        contatos_falhados: falhados,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campanha_id);

    console.log(
      `✅ Campanha ${campanha_id} finalizada: ${enviados}✓ / ${falhados}✗ (${txaSucesso}%) | ${tempoTotalSecs}s | Tentativas totais: ${tentativasTotais}`
    );

    // Avisar se ficou perto do limite
    if (enviados >= RATE_LIMITS.POR_HORA * 0.9) {
      console.warn(
        `⚠️ AVISO: Próximo de limite horário (${enviados}/${RATE_LIMITS.POR_HORA}). Aguarde antes da próxima campanha.`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        enviados,
        falhados,
        total: contatos.length,
        taxaSucesso: txaSucesso,
        tempoTotalSecs,
        tentativasTotais,
        errosPrincipais: erros.slice(0, 5),
        aviso: enviados >= RATE_LIMITS.POR_HORA * 0.9
          ? "Próximo de limite horário. Aguarde antes da próxima campanha."
          : null,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (e) {
    console.error("❌ Erro geral na campanha:", e);

    // Atualizar status para erro
    if (campanha_id) {
      await supabase
        .from("campanhas_whatsapp")
        .update({
          status: "erro",
          updated_at: new Date().toISOString(),
        })
        .eq("id", campanha_id)
        .catch(() => {});
    }

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};
