import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VITE_SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || SUPABASE_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Envia mensagem de texto via WhatsApp
 */
async function sendWhatsApp(to: string, text: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
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
    const error = await response.text();
    console.error("WhatsApp send error:", error);
    throw new Error(`WhatsApp API error: ${error}`);
  }
}

/**
 * Envia imagem (para QR Code do PIX)
 */
async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
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
    const error = await response.text();
    console.error("WhatsApp image send error:", error);
    throw new Error(`WhatsApp API error: ${error}`);
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

/**
 * Gera mensagens personalizadas por status do pedido
 */
function mensagemStatus(
  status: string,
  pedido: any,
  isRecorrente: boolean = false,
): { texto: string; tipo: "texto" | "pix" } | null {
  const protocolo = pedido.id.slice(0, 8).toUpperCase();
  const nome = pedido.nome_cliente?.split(" ")[0] ?? "cliente";
  const linkRastreamento = `${VITE_SUPABASE_URL}/pedido?p=${protocolo}`;

  switch (status) {
    case "novo_pedido":
      // Se é cliente recorrente, oferece desconto especial
      const bonus = isRecorrente
        ? "\n\n🎁 *Bônus recorrente desbloqueado!* Use código *VOLTA5* para 5% OFF"
        : "";
      return {
        tipo: "texto",
        texto: `🍱 Olá, *${nome}*! Recebemos seu pedido *#${protocolo}* com sucesso!\n\nAssim que começarmos a preparar, você recebe uma mensagem aqui 😊\n\nAcompanhe em: ${linkRastreamento}${bonus}`,
      };

    case "pagamento_confirmado":
      return {
        tipo: "pix",
        texto: `✅ Pagamento confirmado, *${nome}*! Seu pedido *#${protocolo}* foi confirmado.\n\nEstamos preparando com carinho 🍱\n\nAcompanhe: ${linkRastreamento}`,
      };

    case "preparando":
      return {
        tipo: "texto",
        texto: `🔥 *${nome}*, seu pedido *#${protocolo}* está sendo preparado agora com carinho 👨‍🍳\n\nTempo estimado: 30-45 min\n\nAcompanhe: ${linkRastreamento}`,
      };

    case "saiu para entrega":
      return {
        tipo: "texto",
        texto: `🚚 *${nome}*, seu pedido *#${protocolo}* saiu para entrega agora! 🏃‍♂️\n\nRastreie em tempo real: ${linkRastreamento}`,
      };

    case "entregue":
      return {
        tipo: "texto",
        texto: `🎉 Pedido *#${protocolo}* entregue, *${nome}*!\n\nEsperamos que aprecie bastante 😋\n\nResponda com uma nota de *1 a 5* ⭐ para nos ajudar a melhorar!\n\n_Sua opinião é muito importante para nós_ 🫶🏼`,
      };

    case "cancelado":
      return {
        tipo: "texto",
        texto: `😔 Oi, *${nome}*. Infelizmente seu pedido *#${protocolo}* foi cancelado.\n\nEntraremos em contato para explicar. Dúvidas? Responda esta mensagem 💬`,
      };

    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pedido_id, status_anterior, status_novo, qr_code_pix, valor_total } = await req.json();

    if (!pedido_id || !status_novo) {
      return new Response(JSON.stringify({ error: "pedido_id e status_novo são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Busca o pedido com informações do usuário
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*, user_id, telefone_cliente, nome_cliente, status")
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
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

    const mensagemObj = mensagemStatus(status_novo, pedido, isRecorrente);
    if (!mensagemObj) {
      return new Response(JSON.stringify({ ok: false, motivo: "sem mensagem para esse status" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Envia mensagem
    await sendWhatsApp(telWA, mensagemObj.texto);

    // Se status é PIX confirmado, envia QR Code
    if (status_novo === "pagamento_confirmado" && qr_code_pix) {
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

    // Log de sucesso
    console.log(
      `✅ Notificação WhatsApp enviada para ${telWA}: ${status_novo}${isRecorrente ? " [CLIENTE RECORRENTE]" : ""}`,
    );

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
  } catch (e: any) {
    console.error("whatsapp-notify error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
