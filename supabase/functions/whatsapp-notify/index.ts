import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import { authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = (Deno.env.get("SITE_URL") || "https://www.saborosamente.com").replace(
  /\/$/,
  "",
);
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Envia mensagem de texto via WhatsApp
 */
async function sendWhatsApp(to: string, text: string) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    console.error("WhatsApp send error:", response.status);
    throw new Error("Falha ao enviar mensagem pelo WhatsApp");
  }
}


async function sendWhatsAppTemplate(to: string, templateName: string, nome: string, protocolo: string) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "pt_BR" },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: nome },
            { type: "text", text: protocolo },
          ],
        }],
      },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("WhatsApp template error:", response.status, body);
    throw new Error("Falha ao enviar template pelo WhatsApp");
  }
}

async function janela24hAberta(telefone: string): Promise<boolean> {
  const digits = telefone.replace(/\D/g, "");
  const semPais = digits.startsWith("55") ? digits.slice(2) : digits;
  const comPais = digits.startsWith("55") ? digits : `55${digits}`;
  const variantes = [...new Set([digits, semPais, comPais])].filter(Boolean);
  const { data } = await supabase
    .from("whatsapp_conversas")
    .select("mensagens,ultima_msg")
    .in("telefone", variantes)
    .order("ultima_msg", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  const mensagens = Array.isArray(data.mensagens) ? data.mensagens : [];
  const ultimaDoCliente = [...mensagens].reverse().find((m: any) => m?.role === "user" || m?.direction === "in");
  const ts = ultimaDoCliente?.timestamp ?? ultimaDoCliente?.created_at ?? data.ultima_msg;
  if (!ts) return false;
  const diff = Date.now() - new Date(ts).getTime();
  return Number.isFinite(diff) && diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

/**
 * Envia imagem (para QR Code do PIX)
 */
async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: {
        link: imageUrl,
        caption: caption || undefined,
      },
    }),
  });

  if (!response.ok) {
    console.error("WhatsApp image send error:", response.status);
    throw new Error("Falha ao enviar imagem pelo WhatsApp");
  }
}

/**
 * Verifica se é cliente recorrente (tem mais de 1 pedido entregue)
 */
async function isClienteRecorrente(user_id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("id", { count: "exact" })
    .eq("user_id", user_id)
    .eq("status", "entregue");

  if (error) {
    console.error("Erro ao verificar cliente recorrente:", error);
    return false;
  }

  return (data?.length || 0) > 1;
}

// Textos padrão (fallback). Editáveis no admin em
// site_settings.parametros_loja.mensagens_whatsapp. Placeholders: {nome} {protocolo} {link}
const DEFAULT_MENSAGENS: Record<string, string> = {
  novo_pedido:
    "🍱 Oii, *{nome}*! Recebemos seu pedido *#{protocolo}* com sucesso. Assim que ele for confirmado, avisamos por aqui 😊",
  pendente:
    "✅ Oii, *{nome}*! Seu pedido *#{protocolo}* foi recebido e confirmado com sucesso.\n\nSaborosaMente 🍱",
  pagamento_confirmado:
    "✅ Oii, *{nome}*! Seu pedido *#{protocolo}* foi recebido e confirmado com sucesso.\n\nSaborosaMente 🍱",
  preparando:
    "🍳 *{nome}*, seu pedido *#{protocolo}* está em preparação.\n\nSaborosaMente 🍱",
  "saiu para entrega":
    "🚚 Oii, *{nome}*! Seu pedido *#{protocolo}* saiu para entrega e já está a caminho.\n\nSaborosaMente 🍱",
  "pronto para retirada":
    "🛍️ Oii, *{nome}*! Seu pedido *#{protocolo}* já está pronto para retirada na loja.\n\nSaborosaMente 🍱",
  entregue:
    "Oii, *{nome}*! 😊 Seu pedido *#{protocolo}* foi finalizado.\n\nQueremos muito saber como foi sua experiência com a SaborosaMente 💚\nSe puder, conta pra gente por aqui mesmo o que achou do pedido, dos pratos e do atendimento.\n\nSeu feedback ajuda bastante a gente a melhorar cada vez mais. 🫶🏼\n\nSaborosaMente 🍱",
  cancelado:
    "Oi, *{nome}*. Seu pedido *#{protocolo}* foi cancelado. Se precisar de ajuda, responda esta mensagem e nossa equipe verifica para você.",
};

function aplicarTemplate(
  template: string,
  vars: { nome: string; protocolo: string; link: string },
): string {
  return template
    .replaceAll("{nome}", vars.nome)
    .replaceAll("{protocolo}", vars.protocolo)
    .replaceAll("{link}", vars.link);
}

/**
 * Gera mensagens personalizadas por status do pedido, usando os templates
 * editáveis do admin (com fallback nos textos padrão).
 */
function mensagemStatus(
  status: string,
  pedido: any,
  isRecorrente: boolean = false,
  templates: Record<string, string> = {},
): { texto: string; tipo: "texto" | "pix" } | null {
  const protocolo = pedido.id.slice(0, 8).toUpperCase();
  const nome = pedido.nome_cliente?.split(" ")[0] ?? "cliente";
  const linkRastreamento = `${SITE_URL}/pedido?p=${protocolo}`;

  const template =
    (typeof templates[status] === "string" && templates[status].trim()) ||
    DEFAULT_MENSAGENS[status];
  if (!template) return null;

  let texto = aplicarTemplate(template, { nome, protocolo, link: linkRastreamento });

  // Bônus para cliente recorrente no primeiro contato do pedido.
  if (status === "novo_pedido" && isRecorrente) {
    texto += "\n\n🎁 *Bônus recorrente desbloqueado!* Use código *VOLTA5* para 5% OFF";
  }

  return { texto, tipo: status === "pagamento_confirmado" ? "pix" : "texto" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let notificationClaimed = false;
  let claimedOrderId = "";
  let claimedStatus = "";

  try {
    const { pedido_id, status_novo, qr_code_pix, valor_total } = await req.json();

    if (!/^[0-9a-f-]{36}$/i.test(String(pedido_id ?? "")) || typeof status_novo !== "string") {
      return new Response(JSON.stringify({ error: "pedido_id e status_novo são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Busca o pedido com informações do usuário
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*, user_id, telefone_cliente, nome_cliente, status, created_at, valor_total")
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Chamadas administrativas podem notificar qualquer transição. No checkout
    // anônimo, só aceitamos o primeiro contato de um pedido recém-criado e com
    // o mesmo total, evitando transformar este endpoint em um disparador aberto.
    const authorization = await authorizeAdminOrService(req);
    if (!authorization.ok) {
      const createdAt = new Date(pedido.created_at).getTime();
      const ageMs = Date.now() - createdAt;
      const allowedGuestStatus = ["novo_pedido", "pagamento_confirmado"].includes(status_novo);
      const amountMatches =
        Number.isFinite(Number(valor_total)) &&
        Math.abs(Number(valor_total) - Number(pedido.valor_total)) < 0.01;

      if (!allowedGuestStatus || ageMs < 0 || ageMs > 15 * 60 * 1000 || !amountMatches) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const telefone = pedido.telefone_cliente;
    if (!telefone) {
      return new Response(JSON.stringify({ ok: false, motivo: "sem telefone" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Normaliza telefone para WhatsApp (somente dígitos, com código do país)
    const telNum = telefone.replace(/\D/g, "");
    const telWA = telNum.startsWith("55") ? telNum : `55${telNum}`;

    // Verifica se é cliente recorrente
    const isRecorrente = pedido.user_id ? await isClienteRecorrente(pedido.user_id) : false;

    // Templates editáveis no admin (site_settings.parametros_loja.mensagens_whatsapp)
    let templates: Record<string, string> = {};
    let notificacoesConfig: any = {};
    try {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("parametros_loja")
        .maybeSingle();
      const parametros = (settings?.parametros_loja as any) ?? {};
      const raw = parametros.mensagens_whatsapp;
      if (raw && typeof raw === "object") templates = raw;
      notificacoesConfig = parametros.whatsapp_notificacoes ?? {};
    } catch (e) {
      console.warn("Falha ao buscar templates de mensagens (usando defaults):", e);
    }

    const metodoEntrega = String(pedido.metodo_entrega ?? "").toLowerCase();
    let statusMensagem = status_novo;
    if (["pendente", "pagamento_confirmado"].includes(status_novo)) statusMensagem = "pendente";
    if (status_novo === "saiu para entrega" && metodoEntrega === "retirada") statusMensagem = "pronto para retirada";

    const configKey =
      statusMensagem === "pendente" ? "confirmado" :
      statusMensagem === "saiu para entrega" ? "saiu_entrega" :
      statusMensagem === "pronto para retirada" ? "pronto_retirada" :
      statusMensagem === "entregue" ? "feedback" : null;

    // O fluxo operacional acordado nao envia aviso de preparacao. Outros status
    // legados continuam sem disparo automatico, exceto cancelamento se ja configurado.
    if (statusMensagem === "preparando") {
      return new Response(JSON.stringify({ ok: true, ignorada: true, motivo: "status sem notificacao" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const etapaConfig = configKey ? notificacoesConfig?.[configKey] : null;
    if (etapaConfig?.ativo === false) {
      return new Response(JSON.stringify({ ok: true, ignorada: true, motivo: "notificacao desativada" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (etapaConfig?.texto && typeof etapaConfig.texto === "string") templates[statusMensagem] = etapaConfig.texto;

    const mensagemObj = mensagemStatus(statusMensagem, pedido, isRecorrente, templates);
    if (!mensagemObj) {
      return new Response(JSON.stringify({ ok: false, motivo: "sem mensagem para esse status" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { error: claimError } = await supabase.from("whatsapp_notificacoes_enviadas").insert({
      pedido_id,
      status: statusMensagem,
    });
    if (claimError?.code === "23505") {
      return new Response(JSON.stringify({ ok: true, duplicada: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (claimError) throw new Error(`Falha ao registrar notificação: ${claimError.message}`);
    notificationClaimed = true;
    claimedOrderId = pedido_id;
    claimedStatus = statusMensagem;

    // Dentro de 24h: texto normal. Fora da janela: somente template Utility
    // explicitamente marcado como aprovado no Admin.
    const protocoloEnvio = pedido.id.slice(0, 8).toUpperCase();
    const nomeEnvio = pedido.nome_cliente?.split(" ")[0] ?? "cliente";
    const janelaAberta = await janela24hAberta(telWA);
    const templateMeta = String(etapaConfig?.template_meta ?? "").trim();
    const templateAprovado = etapaConfig?.template_aprovado === true;

    if (janelaAberta || !configKey) {
      await sendWhatsApp(telWA, mensagemObj.texto);
    } else if (templateMeta && templateAprovado) {
      await sendWhatsAppTemplate(telWA, templateMeta, nomeEnvio, protocoloEnvio);
    } else {
      // Libera o claim para que o envio possa ser tentado novamente depois que
      // o template for aprovado/configurado.
      await supabase.from("whatsapp_notificacoes_enviadas").delete().eq("pedido_id", pedido_id).eq("status", statusMensagem);
      notificationClaimed = false;
      return new Response(JSON.stringify({ ok: false, aguardando_template: true, status: statusMensagem }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Se status é PIX confirmado, envia QR Code
    if (
      status_novo === "pagamento_confirmado" &&
      typeof qr_code_pix === "string" &&
      /^https:\/\//i.test(qr_code_pix) &&
      qr_code_pix.length <= 2048
    ) {
      try {
        await sendWhatsAppImage(
          telWA,
          qr_code_pix,
          `PIX no valor de R$ ${valor_total?.toFixed(2) || "---"}`,
        );
      } catch (e) {
        console.warn("Erro ao enviar QR Code do PIX:", e);
        // Continua mesmo que falhe enviar imagem
      }
    }

    // Se entregue e tem telefone → agendar avaliação
    if (status_novo === "entregue" && !pedido.avaliacao_enviada) {
      await supabase.from("pedidos").update({ avaliacao_enviada: true }).eq("id", pedido_id);

      // Registra sessão de avaliação na conversa WhatsApp (se tabela existe)
      try {
        await supabase.from("whatsapp_conversas").upsert(
          {
            telefone: telWA,
            mensagens: [],
            aguardando_avaliacao: pedido_id,
            ultima_msg: new Date().toISOString(),
          },
          { onConflict: "telefone" },
        );
      } catch (e) {
        console.warn("Erro ao registrar conversa de avaliação:", e);
      }
    }

    console.log(`Notificação WhatsApp enviada: ${statusMensagem}`);

    return new Response(
      JSON.stringify({
        ok: true,
        cliente_recorrente: isRecorrente,
        status: statusMensagem,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("whatsapp-notify error:", message);
    if (notificationClaimed) {
      const { error: releaseError } = await supabase
        .from("whatsapp_notificacoes_enviadas")
        .delete()
        .eq("pedido_id", claimedOrderId)
        .eq("status", claimedStatus);
      if (releaseError) console.error("Falha ao liberar nova tentativa:", releaseError.message);
    }
    return new Response(JSON.stringify({ error: "Falha ao enviar notificação" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
