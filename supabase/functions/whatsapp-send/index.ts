import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const storageAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const PRIVATE_BUCKET = "whatsapp-envios-privados";
const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
const MEDIA_MIMES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png"],
  video: ["video/mp4", "video/3gpp"],
  audio: ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/aac", "audio/amr"],
  document: [
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authorization = await authorizeAdminOrService(req);
    if (!authorization.ok) return authorizationError(authorization, corsHeaders);

    const body = await req.json();
    const { to, text, media_url, media_type, filename, caption, action, sync_type, context_message_id, reaction_message_id, emoji, media_storage_path, media_mime } = body ?? {};

    if (action === "coexistence_status") {
      const statusUrl =
        `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}?fields=is_on_biz_app,platform_type,display_phone_number,verified_name,quality_rating`;
      const statusResponse = await fetch(statusUrl, {
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      });
      const statusData = await statusResponse.json();
      if (!statusResponse.ok) {
        return new Response(
          JSON.stringify({ error: statusData?.error?.message || "Falha ao consultar Coexistence" }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      return new Response(JSON.stringify({ success: true, ...statusData }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "coexistence_sync") {
      if (!["history", "smb_app_state_sync"].includes(String(sync_type))) {
        return new Response(JSON.stringify({ error: "sync_type inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const syncUrl =
        `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/smb_app_data`;
      const syncResponse = await fetch(syncUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          sync_type: String(sync_type),
        }),
      });
      const syncData = await syncResponse.json();
      if (!syncResponse.ok) {
        return new Response(
          JSON.stringify({ error: syncData?.error?.message || "Falha ao iniciar sincronização" }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      return new Response(JSON.stringify({ success: true, ...syncData }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedPhone = String(to ?? "").replace(/\D/g, "");
    const normalizedText = String(text ?? "").trim();
    const mediaUrl = String(media_url ?? "").trim();
    const storagePath = String(media_storage_path ?? "").trim();
    const mediaType = String(media_type ?? "").toLowerCase().trim();

    if (!/^\d{10,15}$/.test(normalizedPhone)) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isReaction = action === "react";
    const targetMessageId = String(reaction_message_id ?? "").trim();
    const reactionEmoji = String(emoji ?? "");
    if (isReaction && (!/^wamid\./.test(targetMessageId) || reactionEmoji.length > 16)) {
      return new Response(JSON.stringify({ error: "Mensagem ou reação inválida" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!isReaction && !normalizedText && !mediaUrl && !storagePath) {
      return new Response(JSON.stringify({ error: "Informe uma mensagem ou anexo" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (normalizedText.length > 4096) {
      return new Response(JSON.stringify({ error: "Mensagem muito longa" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (storagePath && mediaUrl) {
      return new Response(JSON.stringify({ error: "Escolha apenas uma origem de arquivo." }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let payload: Record<string, unknown>;
    if (isReaction) {
      payload = { messaging_product: "whatsapp", to: normalizedPhone, type: "reaction", reaction: { message_id: targetMessageId, emoji: reactionEmoji } };
    } else if (storagePath) {
      // Sem URLs públicas e sem links assinados no Graph. Fazemos upload
      // diretamente para o endpoint da Meta com credenciais somente no servidor.
      // O prefixo vincula o arquivo ao telefone do destinatário.
      const tipo = ["image", "video", "audio"].includes(mediaType) ? mediaType : "document";
      const mime = String(media_mime ?? "").toLowerCase().trim();
      const pathValido = storagePath.startsWith(`whatsapp-saida/${normalizedPhone}/`)
        && storagePath.length <= 400 && !storagePath.includes("..") && !storagePath.includes("\\");
      if (!pathValido || !MEDIA_MIMES[tipo].includes(mime)) {
        return new Response(JSON.stringify({ error: "Anexo privado inválido ou não suportado." }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const { data: arquivo, error: arquivoErro } = await storageAdmin.storage
        .from(PRIVATE_BUCKET).download(storagePath);
      if (arquivoErro || !arquivo) {
        return new Response(JSON.stringify({ error: "Anexo privado não encontrado." }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      if (arquivo.size <= 0 || arquivo.size > MAX_MEDIA_BYTES) {
        return new Response(JSON.stringify({ error: "Arquivo maior que 16 MB ou vazio." }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const tipoSalvo = arquivo.type?.split(";")[0]?.trim()?.toLowerCase();
      if (tipoSalvo && tipoSalvo !== "application/octet-stream" && tipoSalvo !== mime) {
        return new Response(JSON.stringify({ error: "Tipo do anexo difere do arquivo armazenado." }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const nomeSeguro = String(filename ?? storagePath.split("/").at(-1) ?? "arquivo")
        .replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 150) || "arquivo";
      const form = new FormData();
      form.set("messaging_product", "whatsapp");
      form.set("type", mime);
      form.set("file", new File([arquivo], nomeSeguro, { type: mime }));
      const upload = await fetch(
        `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
        { method: "POST", headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }, body: form },
      );
      const uploadDados = await upload.json().catch(() => ({}));
      if (!upload.ok || !uploadDados?.id) {
        console.error("Falha de upload de mídia na Meta:", upload.status);
        return new Response(JSON.stringify({ error: uploadDados?.error?.message || "Falha ao entregar arquivo à Meta." }), {
          status: 502, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const media: Record<string, unknown> = { id: String(uploadDados.id) };
      const legenda = String(caption ?? normalizedText ?? "").trim().slice(0, 1024);
      if (["image", "video", "document"].includes(tipo) && legenda) media.caption = legenda;
      if (tipo === "document") media.filename = nomeSeguro;
      payload = { messaging_product: "whatsapp", to: normalizedPhone, type: tipo, [tipo]: media };
    } else if (mediaUrl) {
      if (!/^https:\/\//i.test(mediaUrl)) {
        return new Response(JSON.stringify({ error: "URL do anexo inválida" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const tipo = ["image", "video", "audio"].includes(mediaType) ? mediaType : "document";
      const media: Record<string, unknown> = { link: mediaUrl };
      const legenda = String(caption ?? normalizedText ?? "").trim();
      if ((tipo === "image" || tipo === "video") && legenda) media.caption = legenda.slice(0, 1024);
      if (tipo === "document") {
        if (legenda) media.caption = legenda.slice(0, 1024);
        const nome = String(filename ?? "").trim();
        if (nome) media.filename = nome.slice(0, 240);
      }
      payload = {
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: tipo,
        [tipo]: media,
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: { body: normalizedText },
      };
    }

    const replyId = String(context_message_id ?? "").trim();
    if (!isReaction && replyId.startsWith("wamid.") && replyId.length <= 255) {
      payload.context = { message_id: replyId };
    }

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Meta API error:", response.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: data?.error?.message || "Falha ao enviar mensagem" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, message_id: data?.messages?.[0]?.id ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("whatsapp-send exception:", message);
    return new Response(JSON.stringify({ error: "Erro interno ao enviar mensagem" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
