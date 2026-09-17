import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

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

    const { to, text, media_url, media_type, filename, caption } = await req.json();
    const normalizedPhone = String(to ?? "").replace(/\D/g, "");
    const normalizedText = String(text ?? "").trim();
    const mediaUrl = String(media_url ?? "").trim();
    const mediaType = String(media_type ?? "").toLowerCase().trim();

    if (!/^\d{10,15}$/.test(normalizedPhone)) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!normalizedText && !mediaUrl) {
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

    let payload: Record<string, unknown>;
    if (mediaUrl) {
      if (!/^https:\/\//i.test(mediaUrl)) {
        return new Response(JSON.stringify({ error: "URL do anexo inválida" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const tipo = mediaType === "image" ? "image" : mediaType === "video" ? "video" : "document";
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
