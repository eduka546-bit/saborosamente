import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DELAY_MS = 2000;
const MAX_POR_MINUTO = 30;
const BATCH_SIZE = 20;
const FUNCTION_NAME = "whatsapp-campanha-enviar";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ResultadoEnvio = { sucesso: boolean; erro?: string; metaMessageId?: string };

type CampanhaPayload = {
  campanha_id: string;
  contatos: string[];
  mensagem: string;
  imagem_url: string | null;
  video_url: string | null;
  midia_tipo: string;
  template?: {
    name: string;
    language: string;
    variaveis: string[];
    headerFormat?: string | null;
  } | null;
};

async function resultadoDaMeta(res: Response, fallback: string): Promise<ResultadoEnvio> {
  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    messages?: { id?: string }[];
  };
  if (res.ok) return { sucesso: true, metaMessageId: json.messages?.[0]?.id };
  return { sucesso: false, erro: json.error?.message || fallback };
}

async function enviarMensagem(
  to: string,
  mensagem: string,
  imagemUrl: string | null,
  videoUrl: string | null,
  template?: CampanhaPayload["template"],
): Promise<ResultadoEnvio> {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = {
    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };

  if (template) {
    const components = [] as Record<string, unknown>[];
    if (template.variaveis.length > 0) {
      components.push({
        type: "body",
        parameters: template.variaveis.map((v) => ({ type: "text", text: v })),
      });
    }
    if (template.headerFormat === "IMAGE") {
      if (!imagemUrl) return { sucesso: false, erro: "Este template exige uma imagem no cabeçalho." };
      components.push({ type: "header", parameters: [{ type: "image", image: { link: imagemUrl } }] });
    }
    if (template.headerFormat === "VIDEO") {
      if (!videoUrl) return { sucesso: false, erro: "Este template exige um vídeo no cabeçalho." };
      components.push({ type: "header", parameters: [{ type: "video", video: { link: videoUrl } }] });
    }
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        components: components.length > 0 ? components : undefined,
      },
    };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    return resultadoDaMeta(res, "Erro ao enviar template");
  }

  if (videoUrl) {
    const body = { messaging_product: "whatsapp", to, type: "video", video: { link: videoUrl, caption: mensagem } };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) return resultadoDaMeta(res, "Erro ao enviar vídeo");
    const bodyDoc = {
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: { link: videoUrl, caption: mensagem, filename: "video.mp4" },
    };
    const resDoc = await fetch(url, { method: "POST", headers, body: JSON.stringify(bodyDoc) });
    return resultadoDaMeta(resDoc, "Erro ao enviar vídeo");
  }

  if (imagemUrl) {
    const body = { messaging_product: "whatsapp", to, type: "image", image: { link: imagemUrl, caption: mensagem } };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    return resultadoDaMeta(res, "Erro ao enviar imagem");
  }

  const body = { messaging_product: "whatsapp", to, type: "text", text: { body: mensagem } };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  return resultadoDaMeta(res, "Erro ao enviar texto");
}

async function agendarProximoLote(payload: CampanhaPayload) {
  const { campanha_id } = payload;
  const { data: pendentes, error } = await supabase
    .from("campanhas_whatsapp_envios")
    .select("id")
    .eq("campanha_id", campanha_id)
    .eq("status", "pendente")
    .limit(1);
  if (error) throw error;

  if ((pendentes?.length ?? 0) > 0) {
    const nextUrl = `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;
    const response = await fetch(nextUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Falha ao iniciar próximo lote: ${response.status} ${detail}`);
    }
    return;
  }

  const [{ count: totalEnviados }, { count: totalFalhados }] = await Promise.all([
    supabase.from("campanhas_whatsapp_envios").select("id", { count: "exact", head: true }).eq("campanha_id", campanha_id).eq("status", "enviado"),
    supabase.from("campanhas_whatsapp_envios").select("id", { count: "exact", head: true }).eq("campanha_id", campanha_id).eq("status", "falhou"),
  ]);

  const { data: estado } = await supabase
    .from("campanhas_whatsapp")
    .select("status")
    .eq("id", campanha_id)
    .single();
  if (estado?.status === "pausada") return;

  await supabase
    .from("campanhas_whatsapp")
    .update({
      status: "enviada",
      contatos_enviados: totalEnviados ?? 0,
      contatos_falhados: totalFalhados ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campanha_id);

  console.log(`Campanha ${campanha_id} finalizada: ${totalEnviados ?? 0} enviados, ${totalFalhados ?? 0} falhas.`);
}

async function processarLote(payload: CampanhaPayload) {
  const { campanha_id, mensagem, imagem_url, video_url, template } = payload;

  const { data: estado, error: estadoError } = await supabase
    .from("campanhas_whatsapp")
    .select("status")
    .eq("id", campanha_id)
    .single();
  if (estadoError) throw estadoError;
  if (estado?.status === "pausada") return;

  const { data: pendentes, error: pendentesError } = await supabase
    .from("campanhas_whatsapp_envios")
    .select("id, telefone")
    .eq("campanha_id", campanha_id)
    .eq("status", "pendente")
    .order("created_at")
    .limit(BATCH_SIZE);
  if (pendentesError) throw pendentesError;

  if (!pendentes || pendentes.length === 0) {
    await agendarProximoLote(payload);
    return;
  }

  let msgsEsteMinuto = 0;
  let inicioMinuto = Date.now();

  for (let i = 0; i < pendentes.length; i++) {
    const { id: envioId, telefone } = pendentes[i];

    if (i > 0 && i % 5 === 0) {
      const { data: estadoAtual } = await supabase
        .from("campanhas_whatsapp")
        .select("status")
        .eq("id", campanha_id)
        .single();
      if (estadoAtual?.status === "pausada") return;
    }

    if (Date.now() - inicioMinuto > 60000) {
      msgsEsteMinuto = 0;
      inicioMinuto = Date.now();
    }
    if (msgsEsteMinuto >= MAX_POR_MINUTO) {
      const espera = Math.max(0, 60000 - (Date.now() - inicioMinuto));
      await sleep(espera + 500);
      msgsEsteMinuto = 0;
      inicioMinuto = Date.now();
    }

    if (i > 0) await sleep(DELAY_MS);

    const resultado = await enviarMensagem(String(telefone), mensagem, imagem_url, video_url, template);
    msgsEsteMinuto++;

    if (resultado.sucesso) {
      await supabase
        .from("campanhas_whatsapp_envios")
        .update({ status: "enviado", enviado_em: new Date().toISOString(), meta_message_id: resultado.metaMessageId ?? null, erro_mensagem: null })
        .eq("id", envioId);
    } else {
      await supabase
        .from("campanhas_whatsapp_envios")
        .update({ status: "falhou", erro_mensagem: resultado.erro })
        .eq("id", envioId);
      console.warn(`Falha no envio ${envioId}: ${resultado.erro}`);
    }
  }

  await agendarProximoLote(payload);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let campanha_id = "";

  try {
    const authorization = await authorizeAdminOrService(req);
    if (!authorization.ok) return authorizationError(authorization, CORS_HEADERS);

    const body = (await req.json()) as CampanhaPayload;
    campanha_id = body.campanha_id;
    const { contatos, mensagem } = body;
    const contatosNormalizados = Array.isArray(contatos)
      ? [...new Set(contatos.map((tel) => String(tel).replace(/\D/g, "")))]
      : [];

    if (
      !/^[0-9a-f-]{36}$/i.test(campanha_id) ||
      contatosNormalizados.length === 0 ||
      contatosNormalizados.length > 500 ||
      contatosNormalizados.some((tel) => !/^\d{10,15}$/.test(tel)) ||
      typeof mensagem !== "string" ||
      mensagem.trim().length === 0 ||
      mensagem.length > 4096
    ) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    const { data: campanhaAtual, error: campanhaAtualError } = await supabase
      .from("campanhas_whatsapp")
      .select("status")
      .eq("id", campanha_id)
      .single();
    if (campanhaAtualError) throw campanhaAtualError;

    // A primeira chamada assume a campanha. As chamadas internas continuam uma campanha já em andamento.
    if (campanhaAtual.status === "rascunho" || campanhaAtual.status === "pausada") {
      const { data: campanhaIniciada, error: inicioError } = await supabase
        .from("campanhas_whatsapp")
        .update({ status: "enviando", updated_at: new Date().toISOString() })
        .eq("id", campanha_id)
        .in("status", ["rascunho", "pausada"])
        .select("id")
        .maybeSingle();
      if (inicioError) throw inicioError;
      if (!campanhaIniciada) {
        return new Response(JSON.stringify({ error: "Esta campanha já está em andamento ou foi concluída." }), { status: 409, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }
    } else if (campanhaAtual.status !== "enviando") {
      return new Response(JSON.stringify({ error: "Esta campanha já está concluída ou em erro." }), { status: 409, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    const { count: quantidadeFila } = await supabase
      .from("campanhas_whatsapp_envios")
      .select("id", { count: "exact", head: true })
      .eq("campanha_id", campanha_id);

    if ((quantidadeFila ?? 0) === 0) {
      const { error: insertError } = await supabase
        .from("campanhas_whatsapp_envios")
        .insert(contatosNormalizados.map((telefone) => ({ campanha_id, telefone, status: "pendente" })));
      if (insertError) throw insertError;
    }

    const payload: CampanhaPayload = { ...body, contatos: contatosNormalizados };

    // Retorna imediatamente ao navegador. O processamento ocorre em lotes de 20,
    // e cada lote dispara a próxima invocação para não ficar preso no timeout HTTP.
    EdgeRuntime.waitUntil(
      processarLote(payload).catch(async (error) => {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro no processamento da campanha:", msg);
        await supabase
          .from("campanhas_whatsapp")
          .update({ status: "erro", updated_at: new Date().toISOString() })
          .eq("id", campanha_id)
          .eq("status", "enviando");
      }),
    );

    return new Response(JSON.stringify({ success: true, campanha_id, status: "enviando", background: true }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 202,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("Erro na campanha:", msg);

    if (campanha_id) {
      await supabase
        .from("campanhas_whatsapp")
        .update({ status: "erro", updated_at: new Date().toISOString() })
        .eq("id", campanha_id)
        .neq("status", "enviada");
    }

    return new Response(JSON.stringify({ error: msg }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS }, status: 500 });
  }
});
