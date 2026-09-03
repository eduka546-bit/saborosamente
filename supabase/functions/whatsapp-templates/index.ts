import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WABA_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "1805105217027535";
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
  body?: unknown;
  footer?: unknown;
  variableExamples?: unknown;
};

function validationError(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function buildTemplatePayload(draft: TemplateDraft): { payload?: Record<string, unknown>; error?: string } {
  const name = typeof draft.name === "string" ? draft.name.trim().toLowerCase() : "";
  const category = draft.category === "MARKETING" || draft.category === "UTILITY" ? draft.category : "";
  const language = draft.language === "pt_BR" ? draft.language : "";
  const header = typeof draft.header === "string" ? draft.header.trim() : "";
  const body = typeof draft.body === "string" ? draft.body.trim() : "";
  const footer = typeof draft.footer === "string" ? draft.footer.trim() : "";
  const variableExamples = Array.isArray(draft.variableExamples)
    ? draft.variableExamples.map((value) => (typeof value === "string" ? value.trim() : ""))
    : [];

  if (!/^[a-z0-9_]{3,512}$/.test(name)) {
    return { error: "Use um nome com 3 a 512 caracteres: letras minúsculas, números e _." };
  }
  if (!category || !language) return { error: "Categoria ou idioma inválido." };
  if (!body || body.length > 1024) return { error: "O corpo é obrigatório e deve ter no máximo 1024 caracteres." };
  if (header.length > 60) return { error: "O cabeçalho deve ter no máximo 60 caracteres." };
  if (footer.length > 60) return { error: "O rodapé deve ter no máximo 60 caracteres." };

  const variables = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
  const uniqueVariables = [...new Set(variables)].sort((a, b) => a - b);
  if (uniqueVariables.some((value, index) => value !== index + 1)) {
    return { error: "Use variáveis sequenciais no corpo: {{1}}, {{2}}, {{3}}..." };
  }
  if (uniqueVariables.length !== variableExamples.length || variableExamples.some((value) => !value)) {
    return { error: "Preencha um exemplo para cada variável do corpo." };
  }

  const components: Record<string, unknown>[] = [];
  if (header) components.push({ type: "HEADER", format: "TEXT", text: header });
  const bodyComponent: Record<string, unknown> = { type: "BODY", text: body };
  if (uniqueVariables.length) bodyComponent.example = { body_text: [variableExamples] };
  components.push(bodyComponent);
  if (footer) components.push({ type: "FOOTER", text: footer });

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
      if (requestBody?.action !== "create" || !requestBody.template) {
        return validationError("Solicitação de template inválida.");
      }

      const result = buildTemplatePayload(requestBody.template);
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
