import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function salvarMidia(telefone: string, messageId: string, mediaId: string, mime: string, bytes: Uint8Array) {
  const ext = (mime.split("/")[1] || "bin").split(";")[0].replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const tel = String(telefone).replace(/\D/g, "") || "desconhecido";
  const path = `${tel}/${Date.now()}-${messageId || mediaId}.${ext}`;
  const { error } = await supabase.storage.from("whatsapp-midias").upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw error;
  return { path, mime };
}

async function baixarMeta(mediaId: string) {
  const meta = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${mediaId}`, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
  if (!meta.ok) throw new Error(`Meta metadata ${meta.status}`);
  const md = await meta.json();
  if (!md.url) throw new Error("Meta não retornou URL da mídia");
  const file = await fetch(md.url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
  if (!file.ok) throw new Error(`Meta download ${file.status}`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, mime: md.mime_type || "application/octet-stream" };
}

async function anexarNaConversa(telefone: string, messageId: string, media: any) {
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const { data: conversa } = await supabase.from("whatsapp_conversas").select("id,mensagens").eq("telefone", telefone).maybeSingle();
    if (conversa) {
      const mensagens = Array.isArray(conversa.mensagens) ? [...conversa.mensagens] : [];
      let indice = -1;
      for (let i = mensagens.length - 1; i >= 0; i--) {
        const m = mensagens[i];
        if (m?.role === "user" && !m?.whatsapp_message_id) { indice = i; break; }
      }
      if (indice >= 0) {
        mensagens[indice] = {
          ...mensagens[indice],
          whatsapp_message_id: messageId,
          media_path: media.path,
          media_type: media.type,
          mime_type: media.mime,
        };
        await supabase.from("whatsapp_conversas").update({ mensagens, ultima_msg: new Date().toISOString() }).eq("id", conversa.id);
        return true;
      }
    }
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok");
    const body = await req.text();
    if (!body) return new Response("OK", { status: 200 });
    const payload = JSON.parse(body);
    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    const messages = value?.messages;
    const telefone = messages?.[0]?.from;
    const message = messages?.[0];

    const core = `${SUPABASE_URL}/functions/v1/whatsapp-agent-core`;
    const headers: Record<string,string> = { "Content-Type": "application/json" };
    const auth = req.headers.get("authorization");
    const signature = req.headers.get("x-hub-signature-256");
    if (auth) headers.authorization = auth;
    if (signature) headers["x-hub-signature-256"] = signature;

    const mediaId = message?.type === "image" ? message?.image?.id :
      (message?.type === "audio" || message?.type === "voice") ? (message?.audio?.id ?? message?.voice?.id) :
      message?.type === "document" ? message?.document?.id : null;

    let media: any = null;
    if (telefone && message?.id && mediaId) {
      try {
        const downloaded = await baixarMeta(mediaId);
        const saved = await salvarMidia(telefone, message.id, mediaId, downloaded.mime, downloaded.bytes);
        media = { ...saved, type: message.type };
      } catch (e) {
        console.error("Media proxy storage error:", e);
      }
    }

    const response = await fetch(core, { method: "POST", headers, body });
    const responseText = await response.text();

    if (media && telefone && message?.id) {
      const attached = await anexarNaConversa(telefone, message.id, media);
      if (!attached) console.error("Não foi possível anexar mídia à conversa", telefone, message.id);
    }

    return new Response(responseText || "OK", { status: response.status, headers: { "Content-Type": response.headers.get("Content-Type") || "text/plain" } });
  } catch (e: any) {
    console.error("whatsapp-agent-media-proxy error:", e?.message ?? e);
    return new Response("OK", { status: 200 });
  }
});
