import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Método não aceito." }, 405);
  try {
    const auth = await authorizeAdminOrService(req);
    if (!auth.ok) return authorizationError(auth, cors);
    const { conversa_id, media_path } = await req.json();
    const conversaId = String(conversa_id ?? "");
    const path = String(media_path ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversaId)
      || path.length < 5 || path.length > 800 || path.includes("..") || path.startsWith("/")) {
      return json({ error: "Referência inválida de áudio." }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!url || !key || !openaiKey) return json({ error: "Transcrição não configurada." }, 503);
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data: conversa, error: conversaErro } = await db.from("whatsapp_conversas")
      .select("id,telefone,mensagens").eq("id", conversaId).maybeSingle();
    if (conversaErro || !conversa) return json({ error: "Conversa não encontrada." }, 404);
    const telefone = String(conversa.telefone ?? "").replace(/\D/g, "");
    if (!path.startsWith(telefone + "/")) return json({ error: "O áudio não pertence ao contato." }, 403);
    const janela = Array.isArray(conversa.mensagens) ? conversa.mensagens : [];
    let mensagem = janela.find((m: any) => m.media_path === path && ["audio","voice"].includes(String(m.media_type ?? "")));
    if (!mensagem) {
      const { data: historico, error } = await db.from("whatsapp_mensagens_historico")
        .select("mensagem")
        .eq("conversa_id", conversaId)
        .contains("mensagem", { media_path: path })
        .limit(1);
      if (error) return json({ error: "Não foi possível conferir o histórico." }, 503);
      mensagem = historico?.[0]?.mensagem;
    }
    if (!mensagem || !["audio","voice"].includes(String(mensagem.media_type ?? ""))) {
      return json({ error: "Áudio não encontrado no histórico desta conversa." }, 404);
    }
    const { data: anterior } = await db.from("whatsapp_transcricoes")
      .select("transcricao").eq("conversa_id", conversaId).eq("media_path", path).maybeSingle();
    if (anterior?.transcricao) return json({ transcricao: anterior.transcricao, reutilizada: true });
    const { data: arquivo, error: downloadErro } = await db.storage.from("whatsapp-midias").download(path);
    if (downloadErro || !arquivo) return json({ error: "Arquivo de áudio indisponível." }, 404);
    if (arquivo.size > 16 * 1024 * 1024 || arquivo.size < 1) return json({ error: "Áudio vazio ou acima de 16 MB." }, 400);
    const mime = String(mensagem.mime_type ?? arquivo.type ?? "audio/ogg").split(";")[0].toLowerCase();
    const extensao = mime.includes("mp4") || mime.includes("m4a") ? "m4a"
      : mime.includes("mpeg") || mime.includes("mp3") ? "mp3"
      : mime.includes("wav") ? "wav" : mime.includes("webm") ? "webm" : "ogg";
    const form = new FormData();
    form.append("file", arquivo, "audio." + extensao);
    form.append("model", "whisper-1");
    form.append("language", "pt");
    const signal = AbortSignal.timeout(45_000);
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + openaiKey },
      body: form, signal,
    });
    if (!response.ok) {
      console.error("Falha ao transcrever áudio. Status:", response.status);
      return json({ error: "O áudio não pôde ser transcrito neste momento." }, 502);
    }
    const texto = String((await response.json())?.text ?? "").trim().slice(0, 20000);
    if (!texto) return json({ error: "Nenhuma fala identificada no áudio." }, 422);
    const { error: salvarErro } = await db.from("whatsapp_transcricoes").upsert({
      conversa_id: conversaId, media_path: path, transcricao: texto,
    }, { onConflict: "conversa_id,media_path" });
    if (salvarErro) {
      console.error("Falha ao gravar transcrição.", salvarErro.code);
      return json({ error: "Transcrição concluída, mas houve falha ao salvar; evite repetir até conferir." }, 503);
    }
    return json({ transcricao: texto, reutilizada: false });
  } catch (e) {
    console.error("whatsapp-transcrever:", e instanceof Error ? e.message : "desconhecido");
    return json({ error: "Não foi possível transcrever este áudio." }, 500);
  }
});
