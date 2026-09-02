import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import { authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = (Deno.env.get("SITE_URL") || "https://saborosamente.vercel.app").replace(
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
    "🍱 Olá, *{nome}*! Recebemos seu pedido *#{protocolo}* com sucesso!\n\nAssim que começarmos a preparar, você recebe uma mensagem aqui 😊\n\nAcompanhe em: {link}",
  pagamento_confirmado:
    "✅ Pagamento confirmado, *{nome}*! Seu pedido *#{protocolo}* foi confirmado.\n\nEstamos preparando com carinho 🍱\n\nAcompanhe: {link}",
  preparando:
    "🔥 *{nome}*, seu pedido *#{protocolo}* está sendo preparado agora com carinho 👨‍🍳\n\nTempo estimado: 30-45 min\n\nAcompanhe: {link}",
  "saiu para entrega":
    "🚚 *{nome}*, seu pedido *#{protocolo}* saiu para entrega agora! 🏃‍♂️\n\nRastreie em tempo real: {link}",
  entregue:
    "🎉 Pedido *#{protocolo}* entregue, *{nome}*!\n\nEsperamos que aprecie bastante 😋\n\nResponda com uma nota de *1 a 5* ⭐ para nos ajudar a melhorar!\n\n_Sua opinião é muito importante para nós_ 🫶🏼",
  cancelado:
    "😔 Oi, *{nome}*. Infelizmente seu pedido *#{protocolo}* foi cancelado.\n\nEntraremos em contato para explicar. Dúvidas? Responda esta mensagem 💬",
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
    try {
      const { data: settings } = await supabase
        .from("site_settings")
        .select("parametros_loja")
        .maybeSingle();
      const raw = (settings?.parametros_loja as any)?.mensagens_whatsapp;
      if (raw && typeof raw === "object") templates = raw;
    } catch (e) {
      console.warn("Falha ao buscar templates de mensagens (usando defaults):", e);
    }

    const mensagemObj = mensagemStatus(status_novo, pedido, isRecorrente, templates);
    if (!mensagemObj) {
      return new Response(JSON.stringify({ ok: false, motivo: "sem mensagem para esse status" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { error: claimError } = await supabase.from("whatsapp_notificacoes_enviadas").insert({
      pedido_id,
      status: status_novo,
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
    claimedStatus = status_novo;

    // Envia mensagem
    await sendWhatsApp(telWA, mensagemObj.texto);

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

    console.log(`Notificação WhatsApp enviada: ${status_novo}`);

    return new Response(
      JSON.stringify({
        ok: true,
        cliente_recorrente: isRecorrente,
        status: status_novo,
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
