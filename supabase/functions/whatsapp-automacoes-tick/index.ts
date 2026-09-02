import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// whatsapp-automacoes-tick
// Retoma execuções de automações que estavam paradas num nó "aguardar" cujo
// tempo (aguardando_ate) já venceu. Deve ser chamada periodicamente por um cron
// (ver setup_cron_automacoes.sql). O webhook do agente só roda quando chega uma
// mensagem, então sem este tick os fluxos com espera nunca continuariam.
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(nome: string): string {
  const valor = Deno.env.get(nome);
  if (!valor) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${nome}. ` +
        `Configure os secrets da função (supabase secrets set ${nome}=...) antes do deploy.`,
    );
  }
  return valor;
}

const WHATSAPP_TOKEN = requireEnv("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
// Segredo simples para autorizar o cron (a função tem verify_jwt = false).
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

// Limita quantas execuções processamos por tick para não estourar o tempo da função.
const MAX_EXECUCOES_POR_TICK = 50;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de envio do WhatsApp (equivalentes aos usados no whatsapp-agent)
// ─────────────────────────────────────────────────────────────────────────────

function removerLinksDeArquivos(texto: string): string {
  return texto
    .replace(/https?:\/\/[^\s]+supabase\.co\/storage\/[^\s]+/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
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
      text: { body: removerLinksDeArquivos(text) },
    }),
  }).catch((error) => {
    console.error("sendWhatsAppMessage network error:", error);
    return null;
  });
  if (res && !res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("sendWhatsAppMessage error:", JSON.stringify(err));
  }
}

async function sendWhatsAppList(
  to: string,
  headerText: string,
  bodyText: string,
  buttonLabel: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
): Promise<boolean> {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        action: { button: buttonLabel, sections },
      },
    }),
  }).catch((error) => {
    console.error("sendWhatsAppList network error:", error);
    return null;
  });
  if (!res) return false;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("sendWhatsAppList error:", JSON.stringify(err));
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motor de nós — versão de retomada
// Mantém paridade com executarNo/avancarExecucao do whatsapp-agent.
// ─────────────────────────────────────────────────────────────────────────────

async function concluirExecucao(execucaoId: string) {
  await supabase
    .from("automacao_execucoes")
    .update({ status: "concluida", updated_at: new Date().toISOString() })
    .eq("id", execucaoId);
}

// Executa um nó e segue a cadeia até parar (num "aguardar" reagendado, num
// "transferir"/"encerrar", ou ao acabar os nós).
async function executarNo(
  no: any,
  todosNos: any[],
  execucao: any,
  telefone: string,
): Promise<void> {
  if (!no) {
    await concluirExecucao(execucao.id);
    return;
  }

  switch (no.tipo) {
    case "mensagem": {
      const msg = no.config?.texto ?? "";
      if (msg) await sendWhatsAppMessage(telefone, msg);
      await avancar(no, todosNos, execucao, telefone);
      break;
    }

    case "menu": {
      const opcoes: string[] = no.config?.opcoes ?? [];
      if (opcoes.length > 0) {
        const rows = opcoes.slice(0, 10).map((op: string, i: number) => ({
          id: `auto_${execucao.id}_${i}`,
          title: op.slice(0, 24),
        }));
        await sendWhatsAppList(
          telefone,
          no.config?.titulo ?? "Menu",
          no.config?.corpo ?? "Escolha uma opção:",
          "Ver opções",
          [{ title: "Opções", rows }],
        );
      }
      await avancar(no, todosNos, execucao, telefone);
      break;
    }

    case "aguardar": {
      // Reagenda: grava novo aguardando_ate e para. O próximo tick retoma.
      const valor = Number(no.config?.valor ?? 1);
      const unidade = no.config?.unidade ?? "horas";
      const ms =
        unidade === "minutos"
          ? valor * 60_000
          : unidade === "horas"
            ? valor * 3_600_000
            : valor * 86_400_000;
      const aguardandoAte = new Date(Date.now() + ms).toISOString();
      await supabase
        .from("automacao_execucoes")
        .update({
          aguardando_ate: aguardandoAte,
          no_atual_id: no.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", execucao.id);
      break;
    }

    case "condicao": {
      const campo = no.config?.campo ?? "tag";
      const valor = String(no.config?.valor ?? "").toLowerCase();
      let condicaoVerdadeira = false;

      // No tick não há "última mensagem" recente; a condição por tag é a que
      // faz sentido aqui. Para "mensagem", verificamos o histórico da conversa.
      if (campo === "tag") {
        const { data: tag } = await supabase
          .from("contato_tags")
          .select("id")
          .eq("telefone", telefone)
          .eq("tag", valor)
          .maybeSingle();
        condicaoVerdadeira = !!tag;
      } else if (campo === "mensagem") {
        const { data: conv } = await supabase
          .from("whatsapp_conversas")
          .select("mensagens")
          .eq("id", execucao.conversa_id)
          .maybeSingle();
        const mensagens: any[] = conv?.mensagens ?? [];
        const ultima = String(mensagens.at(-1)?.content ?? "").toLowerCase();
        condicaoVerdadeira = ultima.includes(valor);
      }

      const proximoId = condicaoVerdadeira ? no.proximo_sim_id : no.proximo_nao_id;
      const proximoNo = todosNos.find((n: any) => n.id === proximoId);
      await executarNo(proximoNo, todosNos, execucao, telefone);
      break;
    }

    case "tag": {
      const tag = no.config?.tag ?? "";
      if (tag) {
        await supabase
          .from("contato_tags")
          .upsert({ telefone, tag }, { onConflict: "telefone,tag" });
      }
      await avancar(no, todosNos, execucao, telefone);
      break;
    }

    case "transferir": {
      if (execucao.conversa_id) {
        await supabase
          .from("whatsapp_conversas")
          .update({ modo: "humano" })
          .eq("id", execucao.conversa_id);
      }
      await concluirExecucao(execucao.id);
      break;
    }

    case "encerrar": {
      if (no.config?.mensagem_final) {
        await sendWhatsAppMessage(telefone, no.config.mensagem_final);
      }
      await concluirExecucao(execucao.id);
      break;
    }

    default: {
      // Nó desconhecido: encerra para não travar a execução para sempre.
      await concluirExecucao(execucao.id);
      break;
    }
  }
}

async function avancar(no: any, todosNos: any[], execucao: any, telefone: string): Promise<void> {
  const proximoNo = todosNos.find((n: any) => n.id === no.proximo_id);
  if (!proximoNo) {
    await concluirExecucao(execucao.id);
    return;
  }

  await supabase
    .from("automacao_execucoes")
    .update({ no_atual_id: proximoNo.id, updated_at: new Date().toISOString() })
    .eq("id", execucao.id);

  await executarNo(proximoNo, todosNos, execucao, telefone);
}

// Retoma uma execução parada num nó "aguardar" vencido.
async function retomarExecucao(execucao: any): Promise<void> {
  const { data: automacao } = await supabase
    .from("automacoes")
    .select("id, ativo, nos")
    .eq("id", execucao.automacao_id)
    .maybeSingle();

  // Se a automação foi desativada ou removida, encerra a execução pendente.
  if (!automacao || automacao.ativo === false) {
    await concluirExecucao(execucao.id);
    return;
  }

  const nos: any[] = automacao.nos ?? [];
  const noAtual = nos.find((n: any) => n.id === execucao.no_atual_id);

  // no_atual_id aponta para o próprio nó "aguardar"; seguimos pelo proximo_id.
  if (!noAtual) {
    await concluirExecucao(execucao.id);
    return;
  }

  // Limpa o aguardando_ate para não reprocessar caso o próximo passo não seja
  // outro "aguardar" (o case "aguardar" grava um novo valor se for o caso).
  await supabase
    .from("automacao_execucoes")
    .update({ aguardando_ate: null, updated_at: new Date().toISOString() })
    .eq("id", execucao.id);

  await avancar(noAtual, nos, execucao, execucao.telefone);
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Autorização simples: exige o header quando CRON_SECRET estiver configurado.
  if (CRON_SECRET) {
    const auth = req.headers.get("x-cron-secret") ?? "";
    if (auth !== CRON_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const agora = new Date().toISOString();

  const { data: execucoes, error } = await supabase
    .from("automacao_execucoes")
    .select("id, automacao_id, conversa_id, telefone, no_atual_id, status, aguardando_ate")
    .eq("status", "em_andamento")
    .not("aguardando_ate", "is", null)
    .lte("aguardando_ate", agora)
    .order("aguardando_ate", { ascending: true })
    .limit(MAX_EXECUCOES_POR_TICK);

  if (error) {
    console.error("Erro ao buscar execuções pendentes:", JSON.stringify(error));
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let processadas = 0;
  for (const execucao of execucoes ?? []) {
    if (!execucao.telefone) {
      await concluirExecucao(execucao.id);
      continue;
    }
    try {
      await retomarExecucao(execucao);
      processadas++;
    } catch (e: any) {
      console.error(`Erro ao retomar execução ${execucao.id}:`, e?.message ?? e);
    }
  }

  return new Response(JSON.stringify({ ok: true, processadas }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
