import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendWhatsApp(to: string, text: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}

// Mensagens por status
function mensagemStatus(status: string, pedido: any): string | null {
  const protocolo = pedido.id.slice(0, 8).toUpperCase();
  const nome = pedido.nome_cliente?.split(" ")[0] ?? "cliente";

  switch (status) {
    case "preparando":
      return `✅ Oi, *${nome}*! Seu pedido *#${protocolo}* foi recebido e já está sendo preparado com carinho pela nossa equipe 🍱\n\nAcompanhe o status em: saborosamente.vercel.app/pedido/${protocolo}`;

    case "saiu para entrega":
      return `🚚 Boa notícia, *${nome}*! Seu pedido *#${protocolo}* saiu para entrega agora!\n\nFique de olho — está a caminho! 🏃‍♂️\n\nQualquer dúvida, estamos aqui 😊`;

    case "entregue":
      return `🎉 Pedido *#${protocolo}* entregue, *${nome}*!\n\nEsperamos que aprecie bastante 😋 Se quiser, conta pra gente como foi: basta responder com uma nota de *1 a 5* ⭐\n\n_Sua opinião é muito importante para nós!_`;

    case "cancelado":
      return `😔 Oi, *${nome}*. Infelizmente seu pedido *#${protocolo}* foi cancelado.\n\nEntraremos em contato para explicar o motivo. Se tiver dúvidas, responda esta mensagem 💬`;

    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pedido_id, status_anterior, status_novo } = await req.json();

    if (!pedido_id || !status_novo) {
      return new Response(JSON.stringify({ error: "pedido_id e status_novo são obrigatórios" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Busca o pedido
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const telefone = pedido.telefone_cliente;
    if (!telefone) {
      return new Response(JSON.stringify({ ok: false, motivo: "sem telefone" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Normaliza telefone para WhatsApp (somente dígitos, com código do país)
    const telNum = telefone.replace(/\D/g, "");
    const telWA = telNum.startsWith("55") ? telNum : `55${telNum}`;

    const mensagem = mensagemStatus(status_novo, pedido);
    if (!mensagem) {
      return new Response(JSON.stringify({ ok: false, motivo: "sem mensagem para esse status" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await sendWhatsApp(telWA, mensagem);

    // Se entregue e tem telefone → agendar avaliação (salva flag para não reenviar)
    if (status_novo === "entregue" && !pedido.avaliacao_enviada) {
      await supabase.from("pedidos").update({ avaliacao_enviada: true }).eq("id", pedido_id);

      // Registra sessão de avaliação na conversa WhatsApp
      await supabase.from("whatsapp_conversas").upsert(
        { telefone: telWA, mensagens: [], aguardando_avaliacao: pedido_id, ultima_msg: new Date().toISOString() },
        { onConflict: "telefone", ignoreDuplicates: false }
      );
    }

    console.log(`Notificação enviada para ${telWA}: ${status_novo}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (e: any) {
    console.error("whatsapp-notify error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
