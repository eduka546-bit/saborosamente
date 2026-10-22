import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DELAY_MS = 2000;
const BATCH_SIZE = 20;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Template = { name: string; language: string; variaveis: string[]; headerFormat?: string | null };
type Payload = {
  campanha_id: string;
  contatos: string[];
  mensagem: string;
  imagem_url: string | null;
  video_url: string | null;
  midia_tipo: string;
  template?: Template | null;
  media_id?: string | null;
  action?: "validar_midia";
};
type Resultado = { sucesso: boolean; erro?: string; metaMessageId?: string };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function resultadoMeta(res: Response, fallback: string): Promise<Resultado> {
  const json = await res.json().catch(() => ({})) as { error?: { message?: string }; messages?: { id?: string }[] };
  if (res.ok) return { sucesso: true, metaMessageId: json.messages?.[0]?.id };
  return { sucesso: false, erro: json.error?.message || fallback };
}


/** Registra mídia do bucket próprio na Meta ANTES de enviar aos destinatários. */
async function registrarMidiaMeta(url: string, tipo: "image" | "video"): Promise<string> {
  const raiz = SUPABASE_URL.endsWith("/") ? SUPABASE_URL.slice(0, -1) : SUPABASE_URL;
  const prefixo = raiz + "/storage/v1/object/public/campanhas/";
  if (!url.startsWith(prefixo)) throw new Error("A mídia deve estar no armazenamento de campanhas do site.");
  const caminho = decodeURIComponent(url.slice(prefixo.length));
  if (!caminho || caminho.includes("..") || caminho.includes("?") || caminho.includes("#")) throw new Error("Caminho de mídia inválido.");
  const { data, error } = await supabase.storage.from("campanhas").download(caminho);
  if (error || !data) throw new Error("Não foi possível abrir a mídia cadastrada: " + (error?.message || "arquivo não encontrado"));
  const mime = (data.type || "").split(";")[0].trim().toLowerCase();
  const permitido = tipo === "video" ? ["video/mp4"] : ["image/jpeg", "image/png"];
  if (!permitido.includes(mime)) throw new Error("Formato inválido (" + (mime || "desconhecido") + "). Use " + (tipo === "video" ? "MP4 H.264/AAC" : "JPG ou PNG") + ".");
  if (data.size > (tipo === "video" ? 16 : 5) * 1024 * 1024) throw new Error("A mídia ultrapassa o limite permitido pelo WhatsApp.");
  const bytes = new Uint8Array(await data.arrayBuffer());
  if (tipo === "video") {
    const mp4 = new TextDecoder("latin1").decode(bytes);
    if (["hvc1", "hev1", "av01", "vp09"].some((codec) => mp4.includes(codec))) {
      throw new Error("Vídeo incompatível: o WhatsApp não aceita H.265/HEVC, AV1 ou VP9. Exporte como MP4 H.264 com áudio AAC.");
    }
    if (["ac-3", "ec-3"].some((codec) => mp4.includes(codec))) {
      throw new Error("Áudio incompatível. Exporte o vídeo MP4 com áudio AAC.");
    }
  }
  const extensao = mime === "video/mp4" ? "mp4" : mime === "image/png" ? "png" : "jpg";
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mime);
  form.append("file", new Blob([bytes], { type: mime }), "campanha." + extensao);
  const response = await fetch("https://graph.facebook.com/" + WHATSAPP_API_VERSION + "/" + WHATSAPP_PHONE_NUMBER_ID + "/media", {
    method: "POST", headers: { Authorization: "Bearer " + WHATSAPP_TOKEN }, body: form,
  });
  const result = await response.json().catch(() => ({})) as { id?: string; error?: { code?: number; message?: string; error_data?: { details?: string } } };
  if (!response.ok || !result.id) {
    const motivo = result.error?.error_data?.details || result.error?.message || ("HTTP " + response.status);
    throw new Error("A Meta recusou a mídia" + (result.error?.code ? " (" + result.error.code + ")" : "") + ": " + motivo);
  }
  return result.id;
}

async function enviar(to: string, mensagem: string, imagem: string | null, video: string | null, template?: Template | null, mediaId?: string | null): Promise<Resultado> {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" };

  if (template) {
    const components: Record<string, unknown>[] = [];
    if (template.variaveis.length) {
      components.push({ type: "body", parameters: template.variaveis.map((v) => ({ type: "text", text: v })) });
    }
    if (template.headerFormat === "IMAGE") {
      if (!imagem) return { sucesso: false, erro: "Este template exige uma imagem no cabeçalho." };
      components.push({ type: "header", parameters: [{ type: "image", image: mediaId ? { id: mediaId } : { link: imagem } }] });
    }
    if (template.headerFormat === "VIDEO") {
      if (!video) return { sucesso: false, erro: "Este template exige um vídeo no cabeçalho." };
      components.push({ type: "header", parameters: [{ type: "video", video: mediaId ? { id: mediaId } : { link: video } }] });
    }
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        components: components.length ? components : undefined,
      },
    };
    return resultadoMeta(await fetch(url, { method: "POST", headers, body: JSON.stringify(body) }), "Erro ao enviar template");
  }

  if (video) {
    const body = { messaging_product: "whatsapp", to, type: "video", video: { ...(mediaId ? { id: mediaId } : { link: video }), caption: mensagem } };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) return resultadoMeta(res, "Erro ao enviar vídeo");
    const fallback = { messaging_product: "whatsapp", to, type: "document", document: { link: video, caption: mensagem, filename: "video.mp4" } };
    return resultadoMeta(await fetch(url, { method: "POST", headers, body: JSON.stringify(fallback) }), "Erro ao enviar vídeo");
  }

  if (imagem) {
    const body = { messaging_product: "whatsapp", to, type: "image", image: { ...(mediaId ? { id: mediaId } : { link: imagem }), caption: mensagem } };
    return resultadoMeta(await fetch(url, { method: "POST", headers, body: JSON.stringify(body) }), "Erro ao enviar imagem");
  }

  const body = { messaging_product: "whatsapp", to, type: "text", text: { body: mensagem } };
  return resultadoMeta(await fetch(url, { method: "POST", headers, body: JSON.stringify(body) }), "Erro ao enviar texto");
}

async function processar(payload: Payload): Promise<void> {
  const { campanha_id, mensagem, imagem_url, video_url, template, media_id } = payload;
  const { data: estado, error: estadoError } = await supabase.from("campanhas_whatsapp").select("status").eq("id", campanha_id).single();
  if (estadoError) throw estadoError;
  if (estado?.status === "pausada") return;

  const { data: envios, error: enviosError } = await supabase
    .from("campanhas_whatsapp_envios")
    .select("id, telefone")
    .eq("campanha_id", campanha_id)
    .eq("status", "pendente")
    .order("created_at")
    .limit(BATCH_SIZE);
  if (enviosError) throw enviosError;

  if (!envios?.length) {
    await finalizar(payload);
    return;
  }

  for (let i = 0; i < envios.length; i++) {
    const { data: atual } = await supabase.from("campanhas_whatsapp").select("status").eq("id", campanha_id).single();
    if (atual?.status === "pausada") return;
    if (i > 0) await sleep(DELAY_MS);

    const resultado = await enviar(String(envios[i].telefone), mensagem, imagem_url, video_url, template, media_id);
    if (resultado.sucesso) {
      await supabase.from("campanhas_whatsapp_envios").update({
        status: "enviado",
        enviado_em: new Date().toISOString(),
        meta_message_id: resultado.metaMessageId ?? null,
        erro_mensagem: null,
      }).eq("id", envios[i].id);
    } else {
      await supabase.from("campanhas_whatsapp_envios").update({
        status: "falhou",
        erro_mensagem: resultado.erro,
      }).eq("id", envios[i].id);
    }
  }

  const { data: aindaPendentes } = await supabase
    .from("campanhas_whatsapp_envios")
    .select("id")
    .eq("campanha_id", campanha_id)
    .eq("status", "pendente")
    .limit(1);

  if (aindaPendentes?.length) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-campanha-enviar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Próximo lote falhou: ${response.status}`);
  } else {
    await finalizar(payload);
  }
}

async function finalizar(payload: Payload): Promise<void> {
  const { campanha_id } = payload;
  const [{ count: enviados }, { count: falhados }] = await Promise.all([
    supabase.from("campanhas_whatsapp_envios").select("id", { count: "exact", head: true }).eq("campanha_id", campanha_id).eq("status", "enviado"),
    supabase.from("campanhas_whatsapp_envios").select("id", { count: "exact", head: true }).eq("campanha_id", campanha_id).eq("status", "falhou"),
  ]);
  const { data: estado } = await supabase.from("campanhas_whatsapp").select("status").eq("id", campanha_id).single();
  if (estado?.status === "pausada") return;
  await supabase.from("campanhas_whatsapp").update({
    status: "enviada",
    contatos_enviados: enviados ?? 0,
    contatos_falhados: falhados ?? 0,
    updated_at: new Date().toISOString(),
  }).eq("id", campanha_id);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let campanha_id = "";
  try {
    const authorization = await authorizeAdminOrService(req);
    if (!authorization.ok) return authorizationError(authorization, CORS_HEADERS);

    const body = await req.json() as Payload;
    campanha_id = body.campanha_id;
    if (body.action === "validar_midia") {
      const tipo = body.midia_tipo === "video" ? "video" : body.midia_tipo === "imagem" ? "image" : null;
      const midiaUrl = tipo === "video" ? body.video_url : body.imagem_url;
      if (!tipo || !midiaUrl) return new Response(JSON.stringify({ error: "Escolha uma mídia válida." }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      try {
        const media_id = await registrarMidiaMeta(midiaUrl, tipo);
        return new Response(JSON.stringify({ success: true, media_id }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Não foi possível validar a mídia." }), { status: 422, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }
    }
    const contatos = Array.isArray(body.contatos) ? [...new Set(body.contatos.map((tel) => String(tel).replace(/\D/g, "")))] : [];

    if (!/^[0-9a-f-]{36}$/i.test(campanha_id) || !contatos.length || contatos.length > 500 || contatos.some((tel) => !/^\d{10,15}$/.test(tel)) || typeof body.mensagem !== "string" || !body.mensagem.trim() || body.mensagem.length > 4096) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    // Valida a mídia uma única vez, antes de alterar o estado ou iniciar envios.
    // O media_id seguirá também nas chamadas internas dos lotes.
    const midiaUrl = body.midia_tipo === "video" ? body.video_url : body.midia_tipo === "imagem" ? body.imagem_url : null;
    if (midiaUrl && (!body.media_id || !/^[0-9]+$/.test(body.media_id))) {
      try {
        body.media_id = await registrarMidiaMeta(midiaUrl, body.midia_tipo === "video" ? "video" : "image");
      } catch (e) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Não foi possível validar a mídia." }), { status: 422, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }
    }
    const { data: campanha, error: campanhaError } = await supabase.from("campanhas_whatsapp").select("status").eq("id", campanha_id).single();
    if (campanhaError) throw campanhaError;

    if (campanha.status === "rascunho" || campanha.status === "pausada") {
      const { data: assumida, error } = await supabase.from("campanhas_whatsapp")
        .update({ status: "enviando", updated_at: new Date().toISOString() })
        .eq("id", campanha_id)
        .in("status", ["rascunho", "pausada"])
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!assumida) return new Response(JSON.stringify({ error: "Esta campanha já está em andamento ou foi concluída." }), { status: 409, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    } else if (campanha.status !== "enviando") {
      return new Response(JSON.stringify({ error: "Esta campanha já está concluída ou em erro." }), { status: 409, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    const { count: fila } = await supabase.from("campanhas_whatsapp_envios").select("id", { count: "exact", head: true }).eq("campanha_id", campanha_id);
    if ((fila ?? 0) === 0) {
      const { error } = await supabase.from("campanhas_whatsapp_envios").insert(contatos.map((telefone) => ({ campanha_id, telefone, status: "pendente" })));
      if (error) throw error;
    }

    const payload: Payload = { ...body, contatos };
    EdgeRuntime.waitUntil(processar(payload).catch(async (error) => {
      console.error("Erro no processamento da campanha:", error);
      await supabase.from("campanhas_whatsapp").update({ status: "erro", updated_at: new Date().toISOString() }).eq("id", campanha_id).eq("status", "enviando");
    }));

    return new Response(JSON.stringify({ success: true, campanha_id, status: "enviando", background: true }), {
      status: 202,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na campanha:", message);
    if (campanha_id) {
      await supabase.from("campanhas_whatsapp").update({ status: "erro", updated_at: new Date().toISOString() }).eq("id", campanha_id).neq("status", "enviada");
    }
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
});
