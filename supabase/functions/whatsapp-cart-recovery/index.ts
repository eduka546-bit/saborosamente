import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_BUSINESS_ACCOUNT_ID =
  Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "1805105217027535";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TEMPLATE = "recuperacao_carrinho_saborosamente";
const TEMPLATE_LANGUAGE = "pt_BR";

type RecoveryConfig = {
  ativo: boolean;
  template_meta: string;
  atraso_minutos: number;
};

type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED" | "PAUSED" | "DISABLED" | "MISSING" | "UNKNOWN";

function normalizarTelefone(value: unknown) {
  const tel = String(value ?? "").replace(/\D/g, "");
  if (!tel) return "";
  return tel.startsWith("55") ? tel : `55${tel}`;
}

function normalizarTemplateName(value: unknown) {
  const name = String(value ?? DEFAULT_TEMPLATE)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 512);
  return /^[a-z0-9_]{3,512}$/.test(name) ? name : DEFAULT_TEMPLATE;
}

async function carregarConfig(): Promise<RecoveryConfig> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("parametros_loja")
    .maybeSingle();

  if (error) throw error;

  const raw =
    (data?.parametros_loja as any)?.whatsapp_notificacoes?.recuperacao_carrinho ?? {};

  const atraso = Number(raw.atraso_minutos ?? 60);
  return {
    ativo: raw.ativo !== false,
    template_meta: normalizarTemplateName(raw.template_meta),
    atraso_minutos: Number.isFinite(atraso) ? Math.min(1440, Math.max(60, Math.round(atraso))) : 60,
  };
}

async function buscarTemplate(name: string): Promise<{ status: TemplateStatus; template?: any }> {
  const url =
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates` +
    `?limit=100&fields=name,status,language,category,components`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("Falha ao consultar template de recuperação:", JSON.stringify(data));
    return { status: "UNKNOWN" };
  }

  const template = (data?.data ?? []).find(
    (item: any) => item?.name === name && item?.language === TEMPLATE_LANGUAGE,
  );

  if (!template) return { status: "MISSING" };
  return { status: String(template.status ?? "UNKNOWN").toUpperCase() as TemplateStatus, template };
}

async function criarTemplatePadrao(name: string): Promise<TemplateStatus> {
  const payload = {
    name,
    language: TEMPLATE_LANGUAGE,
    category: "MARKETING",
    components: [
      {
        type: "BODY",
        text:
          "Oi {{1}}! 💚 Seu pedido na SaborosaMente ainda está no carrinho, no valor de {{2}}. " +
          "Se quiser, finalize pelo botão abaixo. Se precisar de ajuda, é só responder esta mensagem.",
        example: { body_text: [["Ana", "R$ 49,90"]] },
      },
      {
        type: "FOOTER",
        text: "Você autorizou este lembrete no checkout.",
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "Finalizar pedido",
            url: "https://www.saborosamente.com/carrinho",
          },
          {
            type: "QUICK_REPLY",
            text: "Parar lembretes",
          },
        ],
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("Falha ao criar template de recuperação:", JSON.stringify(data));
    return "UNKNOWN";
  }

  return String(data?.status ?? "PENDING").toUpperCase() as TemplateStatus;
}

async function garantirTemplate(name: string): Promise<TemplateStatus> {
  const atual = await buscarTemplate(name);
  if (atual.status !== "MISSING") return atual.status;

  const criado = await criarTemplatePadrao(name);
  console.log(`Template ${name} enviado para a Meta com status ${criado}`);
  return criado;
}

async function persistirTemplateStatus(status: TemplateStatus) {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("id,parametros_loja")
      .maybeSingle();
    if (error || !data?.id) return;

    const parametros = (data.parametros_loja as any) ?? {};
    const notificacoes = { ...(parametros.whatsapp_notificacoes ?? {}) };
    notificacoes.recuperacao_carrinho = {
      ...(notificacoes.recuperacao_carrinho ?? {}),
      template_aprovado: status === "APPROVED",
      template_status: status,
      template_status_at: new Date().toISOString(),
    };

    await supabase
      .from("site_settings")
      .update({
        parametros_loja: {
          ...parametros,
          whatsapp_notificacoes: notificacoes,
        },
      })
      .eq("id", data.id);
  } catch (error) {
    console.error("Falha ao persistir status do template:", error);
  }
}

async function enviarTemplate(
  to: string,
  templateName: string,
  nome: string,
  valor: number,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const telWA = normalizarTelefone(to);
  if (!/^\d{12,15}$/.test(telWA)) {
    return { ok: false, error: "telefone inválido" };
  }

  const url =
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: telWA,
      type: "template",
      template: {
        name: templateName,
        language: { code: TEMPLATE_LANGUAGE },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: nome.slice(0, 80) },
              {
                type: "text",
                text: valor.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }),
              },
            ],
          },
        ],
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.error_user_msg || data?.error?.message || "erro da Meta";
    console.error("Falha ao enviar template de recuperação:", JSON.stringify(data));
    return { ok: false, error: message };
  }

  return { ok: true, messageId: data?.messages?.[0]?.id };
}

async function processarCarrinho(
  carrinho: any,
  config: RecoveryConfig,
): Promise<{ id: string; ok: boolean; motivo?: string }> {
  if (carrinho.notificado_em) {
    return { id: carrinho.id, ok: false, motivo: "já notificado" };
  }

  if (carrinho.recuperacao_whatsapp_consentimento !== true) {
    return { id: carrinho.id, ok: false, motivo: "sem consentimento de recuperação" };
  }

  const telefone = carrinho.telefone;
  if (!telefone) {
    return { id: carrinho.id, ok: false, motivo: "sem telefone" };
  }

  const nome = String(carrinho.nome ?? "cliente").trim().split(/\s+/)[0] || "cliente";
  const valor = Number(carrinho.valor_total ?? 0);
  const resultado = await enviarTemplate(telefone, config.template_meta, nome, valor);

  if (!resultado.ok) {
    await supabase
      .from("carrinhos_abandonados")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", carrinho.id);
    return { id: carrinho.id, ok: false, motivo: resultado.error || "falha ao enviar template" };
  }

  await supabase
    .from("carrinhos_abandonados")
    .update({
      notificado_em: new Date().toISOString(),
      status: "recuperado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", carrinho.id);

  return { id: carrinho.id, ok: true };
}

/**
 * POST com { carrinho_id } = tentativa manual autenticada.
 * POST vazio = execução do cron.
 *
 * O envio automatizado usa SEMPRE template Marketing aprovado pela Meta,
 * porque o cliente pode nunca ter iniciado uma conversa no WhatsApp e,
 * portanto, não existe garantia de uma janela de atendimento de 24h aberta.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {}

    const authorization = await authorizeAdminOrService(req);

    if (!authorization.ok) {
      const cronSecret = req.headers.get("x-cron-secret") ?? "";
      const { data: validCronSecret, error: cronSecretError } = await supabase.rpc(
        "validate_edge_cron_secret",
        {
          p_name: "whatsapp-cart-recovery",
          p_secret: cronSecret,
        },
      );
      if (cronSecretError) console.error("Falha ao validar cron:", cronSecretError.message);
      if (!validCronSecret) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const config = await carregarConfig();
    if (!config.ativo) {
      return new Response(JSON.stringify({ processados: 0, status: "desativado" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const templateStatus = await garantirTemplate(config.template_meta);
    await persistirTemplateStatus(templateStatus);
    if (templateStatus !== "APPROVED") {
      return new Response(
        JSON.stringify({
          processados: 0,
          status: "aguardando_template",
          template: config.template_meta,
          template_status: templateStatus,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    if (body.carrinho_id) {
      if (!authorization.ok) return authorizationError(authorization, corsHeaders);
      if (!/^[0-9a-f-]{36}$/i.test(String(body.carrinho_id))) {
        return new Response(JSON.stringify({ error: "Carrinho inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: carrinho } = await supabase
        .from("carrinhos_abandonados")
        .select("*")
        .eq("id", body.carrinho_id)
        .single();

      if (!carrinho) {
        return new Response(JSON.stringify({ error: "Carrinho não encontrado" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const resultado = await processarCarrinho(carrinho, config);
      return new Response(JSON.stringify({ ...resultado, template_status: templateStatus }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const limite = new Date(Date.now() - config.atraso_minutos * 60 * 1000).toISOString();
    const { data: carrinhos, error } = await supabase
      .from("carrinhos_abandonados")
      .select("*")
      .eq("status", "abandonado")
      .eq("recuperacao_whatsapp_consentimento", true)
      .is("notificado_em", null)
      .lt("updated_at", limite)
      .not("telefone", "is", null)
      .order("updated_at", { ascending: true })
      .limit(20);

    if (error) throw error;

    const resultados: any[] = [];
    for (const carrinho of carrinhos ?? []) {
      const r = await processarCarrinho(carrinho, config);
      resultados.push(r);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      `Processados ${resultados.length} carrinhos; template=${config.template_meta}; status=${templateStatus}`,
    );

    return new Response(
      JSON.stringify({
        processados: resultados.length,
        resultados,
        template: config.template_meta,
        template_status: templateStatus,
        atraso_minutos: config.atraso_minutos,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("whatsapp-cart-recovery error:", message);
    return new Response(JSON.stringify({ error: "Falha ao processar carrinhos" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
