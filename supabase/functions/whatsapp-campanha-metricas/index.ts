import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizeAdminOrService, authorizationError } from "../_shared/authorization.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WABA_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "1805105217027535";
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function metaGet(path: string) {
  const res = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${path}`, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `Meta retornou ${res.status}`);
  }
  return data;
}

function sumDataPoints(dataPoints: any[]) {
  let sent = 0;
  let delivered = 0;
  let read = 0;
  let urlClicks = 0;
  let uniqueUrlClicks = 0;
  let quickReplyClicks = 0;
  let uniqueQuickReplyClicks = 0;

  for (const point of dataPoints) {
    sent += Number(point?.sent || 0);
    delivered += Number(point?.delivered || 0);
    read += Number(point?.read || 0);
    for (const click of Array.isArray(point?.clicked) ? point.clicked : []) {
      const type = String(click?.type || "").toLowerCase();
      const count = Number(click?.count || click?.value || 0);
      if (type.includes("unique") && type.includes("url")) uniqueUrlClicks += count;
      else if (type.includes("unique") && type.includes("quick")) uniqueQuickReplyClicks += count;
      else if (type.includes("url")) urlClicks += count;
      else if (type.includes("quick")) quickReplyClicks += count;
    }
  }

  return {
    sent,
    delivered,
    read,
    urlClicks,
    uniqueUrlClicks,
    quickReplyClicks,
    uniqueQuickReplyClicks,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const auth = await authorizeAdminOrService(req);
    if (!auth.ok) return authorizationError(auth, corsHeaders);

    const body = await req.json().catch(() => ({}));
    const campanhaId = String(body?.campanha_id || "").trim();
    if (!campanhaId) return response({ error: "campanha_id é obrigatório" }, 400);

    const { data: campanha, error: campanhaError } = await supabase
      .from("campanhas_whatsapp")
      .select("id,created_at,template_name")
      .eq("id", campanhaId)
      .maybeSingle();
    if (campanhaError) throw campanhaError;
    if (!campanha) return response({ error: "Campanha não encontrada" }, 404);

    const { data: envios, error: enviosError } = await supabase
      .from("campanhas_whatsapp_envios")
      .select("status,enviado_em,entregue_em,lida_em,respondeu_em,interagiu_em")
      .eq("campanha_id", campanhaId);
    if (enviosError) throw enviosError;

    const rows = envios || [];
    const enviadosLocal = rows.filter((e: any) => ["enviado", "entregue", "lido"].includes(e.status)).length;
    const entreguesLocal = rows.filter((e: any) => e.entregue_em || ["entregue", "lido"].includes(e.status)).length;
    const lidosLocal = rows.filter((e: any) => e.lida_em || e.status === "lido").length;
    const respondidos = rows.filter((e: any) => e.respondeu_em).length;
    const interagidos = rows.filter((e: any) => e.interagiu_em).length;

    let meta: any = null;
    let metaError: string | null = null;

    if (campanha.template_name) {
      try {
        const templates = await metaGet(
          `${WABA_ID}/message_templates?limit=100&fields=id,name,category&name=${encodeURIComponent(campanha.template_name)}`,
        );
        const template = (templates?.data || []).find((t: any) => t?.name === campanha.template_name) || templates?.data?.[0];

        if (template?.id) {
          const created = new Date(campanha.created_at).getTime();
          const now = Date.now();
          const startMs = Math.max(created - 60 * 60 * 1000, now - 7 * 24 * 60 * 60 * 1000);
          const start = Math.floor(startMs / 1000);
          const end = Math.floor(now / 1000);
          const fields = `template_analytics.start(${start}).end(${end}).granularity(DAILY).template_ids([\"${template.id}\"]).metric_types([\"SENT\",\"DELIVERED\",\"READ\",\"CLICKED\"])`;
          const analytics = await metaGet(`${WABA_ID}?fields=${encodeURIComponent(fields)}`);
          const dataPoints = (analytics?.template_analytics?.data || []).flatMap((group: any) => group?.data_points || []);
          meta = { template_id: template.id, template_name: template.name, ...sumDataPoints(dataPoints) };
        } else {
          metaError = "A Meta não retornou o ID desse template.";
        }
      } catch (e: any) {
        metaError = e?.message || "Não foi possível consultar as métricas da Meta.";
      }
    } else {
      metaError = "Esta campanha não registrou o template usado. Métricas de clique da Meta ficam disponíveis apenas para campanhas novas com template registrado.";
    }

    return response({
      local: {
        enviados: enviadosLocal,
        entregues: entreguesLocal,
        lidos: lidosLocal,
        responderam: respondidos,
        interagiram: interagidos,
      },
      meta,
      meta_error: metaError,
      observacao: "Cliques são métricas do template na Meta; se o mesmo template foi usado em outras campanhas no período, o número pode não representar somente esta campanha.",
    });
  } catch (e: any) {
    console.error("whatsapp-campanha-metricas:", e);
    return response({ error: e?.message || "Erro interno" }, 500);
  }
});
