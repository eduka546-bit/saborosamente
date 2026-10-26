import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_BUSINESS_ACCOUNT_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "1805105217027535";
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

    const body = await req.json();
    const { to, text, media_url, media_type, filename, caption, action, sync_type, template_name, template_language } = body ?? {};

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
    const mediaType = String(media_type ?? "").toLowerCase().trim();

    if (!/^\d{10,15}$/.test(normalizedPhone)) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const isTemplate = action === "send_template";
    if (!isTemplate && !normalizedText && !mediaUrl) {
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
    if (isTemplate) {
      const name = String(template_name ?? "").trim();
      const language = String(template_language ?? "").trim();
      if (!/^[a-z0-9_]{3,512}$/.test(name) || language !== "pt_BR") {
        return new Response(JSON.stringify({ error: "Modelo ou idioma inválido." }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      // Aceita apenas modelos simples e APROVADOS; templates com variáveis,
      // cabeçalho em mídia ou parâmetros dinâmicos ficam no módulo Campanhas.
      const templatesUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?fields=name,status,language,components,category&limit=100`;
      const templatesRes = await fetch(templatesUrl, {
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      });
      const templatesDados = await templatesRes.json().catch(() => ({}));
      if (!templatesRes.ok) {
        return new Response(JSON.stringify({ error: "Não foi possível consultar os modelos aprovados da Meta." }), {
          status: 502, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const template = (Array.isArray(templatesDados?.data) ? templatesDados.data : [])
        .find((item: any) => item.name === name && item.language === language && item.status === "APPROVED");
      const bodyComp = template?.components?.find((component: any) => component.type === "BODY");
      const headerComp = template?.components?.find((component: any) => component.type === "HEADER");
      const buttonsComp = template?.components?.find((component: any) => component.type === "BUTTONS");
      const temVariaveis = /\{\{\d+\}\}/.test(String(bodyComp?.text ?? ""))
        || /\{\{\d+\}\}/.test(String(headerComp?.text ?? ""))
        || (buttonsComp?.buttons ?? []).some((button: any) =>
          /\{\{\d+\}\}/.test(String(button.url ?? "")));
      if (!template || !bodyComp?.text || temVariaveis ||
          (headerComp && headerComp.format !== "TEXT") ||
          !["MARKETING", "UTILITY"].includes(String(template.category ?? ""))) {
        return new Response(JSON.stringify({ error: "Escolha um modelo simples e aprovado. Modelos com variáveis ou mídia devem ser enviados pelo painel de campanhas." }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      payload = {
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "template",
        template: { name, language: { code: language } },
      };
    } else if (mediaUrl) {
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
