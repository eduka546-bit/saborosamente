import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WABA_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "1805105217027535";
const META_APP_ID = Deno.env.get("META_APP_ID") || "1384177589788689";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TemplateDraft = {
  name?: unknown;
  category?: unknown;
  language?: unknown;
  header?: unknown;
  headerType?: unknown;
  sampleImageUrl?: unknown;
  sampleVideoUrl?: unknown;
  body?: unknown;
  footer?: unknown;
  variableExamples?: unknown;
  buttons?: unknown;
};

type TemplateButton = { type: "URL" | "PHONE_NUMBER" | "QUICK_REPLY"; text: string; url?: string; phone_number?: string };

function validationError(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function uploadTemplateSampleMedia(mediaUrl: string, expectedContentType: "image/jpeg" | "image/png" | "video/mp4"): Promise<{ handle?: string; error?: string }> {
  let url: URL;
  try {
    url = new URL(mediaUrl);
  } catch {
    return { error: "URL de mídia inválida." };
  }
  const allowedPrefix = `${SUPABASE_URL}/storage/v1/object/public/campanhas/`;
  if (!SUPABASE_URL || !mediaUrl.startsWith(allowedPrefix)) {
    return { error: "A mídia precisa ser enviada pelo painel." };
  }

  const mediaResponse = await fetch(url);
  if (!mediaResponse.ok) return { error: "Não foi possível ler a mídia enviada." };
  const contentType = (mediaResponse.headers.get("content-type") || "").split(";")[0].toLowerCase();
  const bytes = await mediaResponse.arrayBuffer();
  const maxBytes = expectedContentType === "video/mp4" ? 16 * 1024 * 1024 : 5 * 1024 * 1024;
  if (contentType !== expectedContentType || bytes.byteLength === 0 || bytes.byteLength > maxBytes) {
    return { error: expectedContentType === "video/mp4" ? "Use um vídeo MP4 de até 16 MB." : "Use uma imagem JPG ou PNG de até 5 MB." };
  }

  const start = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${META_APP_ID}/uploads?file_length=${bytes.byteLength}&file_type=${encodeURIComponent(contentType)}`,
    { method: "POST", headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } },
  );
  const startData = await start.json().catch(() => ({})) as { id?: string; error?: { message?: string } };
  if (!start.ok || !startData.id) return { error: startData.error?.message || "A Meta não iniciou o upload da mídia." };

  const upload = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${startData.id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${WHATSAPP_TOKEN}`, "file_offset": "0", "Content-Type": contentType },
    body: bytes,
  });
  const uploadData = await upload.json().catch(() => ({})) as { h?: string; error?: { message?: string } };
  if (!upload.ok || !uploadData.h) return { error: uploadData.error?.message || "A Meta não aceitou a mídia de exemplo." };
  return { handle: uploadData.h };
}

async function buildTemplatePayload(draft: TemplateDraft): Promise<{ payload?: Record<string, unknown>; error?: string }> {
  const name = typeof draft.name === "string" ? draft.name.trim().toLowerCase() : "";
  const category = draft.category === "MARKETING" || draft.category === "UTILITY" ? draft.category : "";
  const language = draft.language === "pt_BR" ? draft.language : "";
  const header = typeof draft.header === "string" ? draft.header.trim() : "";
  const headerType = draft.headerType === "IMAGE" ? "IMAGE" : draft.headerType === "VIDEO" ? "VIDEO" : draft.headerType === "TEXT" ? "TEXT" : "NONE";
  const sampleImageUrl = typeof draft.sampleImageUrl === "string" ? draft.sampleImageUrl.trim() : "";
  const sampleVideoUrl = typeof draft.sampleVideoUrl === "string" ? draft.sampleVideoUrl.trim() : "";
  const body = typeof draft.body === "string" ? draft.body.trim() : "";
  const footer = typeof draft.footer === "string" ? draft.footer.trim() : "";
  const variableExamples = Array.isArray(draft.variableExamples)
    ? draft.variableExamples.map((value) => (typeof value === "string" ? value.trim() : ""))
    : [];
  const buttons: TemplateButton[] = Array.isArray(draft.buttons)
    ? draft.buttons.map((button) => ({
      type: button?.type,
      text: typeof button?.text === "string" ? button.text.trim() : "",
      url: typeof button?.url === "string" ? button.url.trim() : undefined,
      phone_number: typeof button?.phone_number === "string" ? button.phone_number.replace(/[^+\d]/g, "") : undefined,
    })) as TemplateButton[]
    : [];

  if (!/^[a-z0-9_]{3,512}$/.test(name)) {
    return { error: "Use um nome com 3 a 512 caracteres: letras minúsculas, números e _." };
  }
  if (!category || !language) return { error: "Categoria ou idioma inválido." };
  if (!body || body.length > 1024) return { error: "O corpo é obrigatório e deve ter no máximo 1024 caracteres." };
  if (headerType === "TEXT" && (!header || header.length > 60)) return { error: "O cabeçalho de texto é obrigatório e deve ter no máximo 60 caracteres." };
  if (headerType === "IMAGE" && !sampleImageUrl) return { error: "Envie a imagem de exemplo do cabeçalho." };
  if (headerType === "VIDEO" && !sampleVideoUrl) return { error: "Envie o vídeo de exemplo do cabeçalho." };
  if (footer.length > 60) return { error: "O rodapé deve ter no máximo 60 caracteres." };
  if (buttons.length > 3) return { error: "Use no máximo 3 botões por template." };
  if (buttons.filter((button) => button.type === "URL" || button.type === "PHONE_NUMBER").length > 2) {
    return { error: "A Meta permite no máximo 2 botões de ação (link ou ligação)." };
  }
  for (const button of buttons) {
    if (!(["URL", "PHONE_NUMBER", "QUICK_REPLY"] as const).includes(button.type) || !button.text || button.text.length > 25) {
      return { error: "Cada botão precisa ter um tipo e um texto de até 25 caracteres." };
    }
    if (button.type === "URL" && (!button.url || !/^https:\/\/\S+$/i.test(button.url))) {
      return { error: "O botão de link precisa usar uma URL HTTPS válida." };
    }
    if (button.type === "PHONE_NUMBER" && (!button.phone_number || !/^\+\d{8,15}$/.test(button.phone_number))) {
      return { error: "O botão de ligação precisa de um telefone com DDI, por exemplo +5547991607757." };
    }
  }

  const variables = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
  const uniqueVariables = [...new Set(variables)].sort((a, b) => a - b);
  if (uniqueVariables.some((value, index) => value !== index + 1)) {
    return { error: "Use variáveis sequenciais no corpo: {{1}}, {{2}}, {{3}}..." };
  }
  if (uniqueVariables.length !== variableExamples.length || variableExamples.some((value) => !value)) {
    return { error: "Preencha um exemplo para cada variável do corpo." };
  }

  const components: Record<string, unknown>[] = [];
  if (headerType === "TEXT") components.push({ type: "HEADER", format: "TEXT", text: header });
  if (headerType === "IMAGE") {
    const image = await uploadTemplateSampleMedia(sampleImageUrl, sampleImageUrl.endsWith(".png") ? "image/png" : "image/jpeg");
    if (!image.handle) return { error: image.error || "Não foi possível preparar a imagem." };
    components.push({ type: "HEADER", format: "IMAGE", example: { header_handle: [image.handle] } });
  }
  if (headerType === "VIDEO") {
    const video = await uploadTemplateSampleMedia(sampleVideoUrl, "video/mp4");
    if (!video.handle) return { error: video.error || "Não foi possível preparar o vídeo." };
    components.push({ type: "HEADER", format: "VIDEO", example: { header_handle: [video.handle] } });
  }
  const bodyComponent: Record<string, unknown> = { type: "BODY", text: body };
  if (uniqueVariables.length) bodyComponent.example = { body_text: [variableExamples] };
  components.push(bodyComponent);
  if (footer) components.push({ type: "FOOTER", text: footer });
  if (buttons.length) components.push({ type: "BUTTONS", buttons });

  return { payload: { name, category, language, components } };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const authorization = await authorizeAdminOrService(req);
    if (!authorization.ok) return authorizationError(authorization, corsHeaders);

    if (req.method === "POST") {
      const requestBody = await req.json().catch(() => null) as { action?: string; template?: TemplateDraft } | null;
      // supabase.functions.invoke usa POST por padrão também nas leituras.
      // POST sem action mantém compatibilidade e apenas lista os templates.
      if (requestBody?.action && requestBody.action !== "create") {
        return validationError("Solicitação de template inválida.");
      }
      if (requestBody?.action === "create") {
        if (!requestBody.template) return validationError("Template inválido.");
        const result = await buildTemplatePayload(requestBody.template);
        if (!result.payload) return validationError(result.error || "Template inválido.");

        const res = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WABA_ID}/message_templates`, {
          method: "POST",
          headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify(result.payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = data?.error?.error_user_msg || data?.error?.message || "A Meta recusou o cadastro do template.";
          console.error("Erro ao criar template:", JSON.stringify(data));
          return new Response(JSON.stringify({ error: message }), {
            status: 422,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        return new Response(JSON.stringify({ template: data, message: "Template enviado para aprovação da Meta." }), {
          status: 201,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WABA_ID}/message_templates?limit=100&fields=name,status,language,components,category`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Erro ao buscar templates:", JSON.stringify(err));
      return new Response(JSON.stringify({ error: "Erro ao buscar templates" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = (await res.json()) as {
      data: {
        name: string;
        status: string;
        language: string;
        category: string;
        components: {
          type: string;
          text?: string;
          format?: string;
          buttons?: { type: string; text: string }[];
          example?: { body_text?: string[][]; header_text?: string[] };
        }[];
      }[];
    };

    console.log("Total templates recebidos:", data.data?.length || 0);

    const templates = (data.data || []).map((t) => {
      const body = t.components.find((c) => c.type === "BODY");
      const header = t.components.find((c) => c.type === "HEADER");
      const footer = t.components.find((c) => c.type === "FOOTER");
      const buttons = t.components.find((c) => c.type === "BUTTONS");

      const bodyText = body?.text || "";
      const varMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
      const numVars = varMatches.length;

      return {
        name: t.name,
        status: t.status,
        language: t.language,
        category: t.category,
        header: header?.text || null,
        headerFormat: header?.format || null,
        body: bodyText,
        footer: footer?.text || null,
        buttons: buttons?.buttons || [],
        numVars,
        varExamples: body?.example?.body_text?.[0] || [],
      };
    });

    return new Response(JSON.stringify({ templates }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("Erro:", msg);
    return new Response(JSON.stringify({ error: "Erro interno ao buscar templates" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
