import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WABA_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "1805105217027535";
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
