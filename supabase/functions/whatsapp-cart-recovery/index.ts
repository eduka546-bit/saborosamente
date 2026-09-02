import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WHATSAPP_API_VERSION = Deno.env.get("WHATSAPP_API_VERSION") || "v25.0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendWhatsApp(to: string, text: string) {
  const tel = to.replace(/\D/g, "");
  const telWA = tel.startsWith("55") ? tel : `55${tel}`;
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: telWA,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    console.error("sendWhatsApp error:", res.status);
    return false;
  }
  return true;
}

/**
 * Esta função pode ser chamada de duas formas:
 * 1. POST manual com { carrinho_id } — envia mensagem para um carrinho específico
 * 2. POST sem body — processa todos os carrinhos abandonados há mais de 1h sem notificação
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {}

    const authorization = await authorizeAdminOrService(req);

    if (body.carrinho_id) {
      if (!authorization.ok) return authorizationError(authorization, corsHeaders);
      if (!/^[0-9a-f-]{36}$/i.test(String(body.carrinho_id))) {
        return new Response(JSON.stringify({ error: "Carrinho inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Modo manual: envia para carrinho específico
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

      const resultado = await processarCarrinho(carrinho);
      return new Response(JSON.stringify(resultado), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    // Modo automático: busca carrinhos abandonados há mais de 1h que ainda não foram notificados
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: carrinhos, error } = await supabase
      .from("carrinhos_abandonados")
      .select("*")
      .eq("status", "abandonado")
      .is("notificado_em", null) // ainda não notificado
      .lt("updated_at", umaHoraAtras) // abandonado há mais de 1h
      .not("telefone", "is", null) // tem telefone
      .order("updated_at", { ascending: true })
      .limit(20);

    if (error) throw error;

    const resultados: any[] = [];
    for (const carrinho of carrinhos ?? []) {
      const r = await processarCarrinho(carrinho);
      resultados.push(r);
      // Pequeno delay para não sobrecarregar a API do WhatsApp
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`Processados ${resultados.length} carrinhos abandonados`);
    return new Response(JSON.stringify({ processados: resultados.length, resultados }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("whatsapp-cart-recovery error:", message);
    return new Response(JSON.stringify({ error: "Falha ao processar carrinhos" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

async function processarCarrinho(
  carrinho: any,
): Promise<{ id: string; ok: boolean; motivo?: string }> {
  // Não enviar se já foi notificado
  if (carrinho.notificado_em) {
    return { id: carrinho.id, ok: false, motivo: "já notificado" };
  }

  const telefone = carrinho.telefone;
  if (!telefone) {
    return { id: carrinho.id, ok: false, motivo: "sem telefone" };
  }

  const nome = carrinho.nome?.split(" ")[0] ?? "cliente";
  const itens: any[] = carrinho.itens ?? [];
  const valor = Number(carrinho.valor_total ?? 0);
  const cupom = carrinho.cupom_oferta;

  // Monta resumo dos itens
  const itensTexto = itens
    .slice(0, 3)
    .map((i: any) => `• ${i.quantity ?? 1}x ${i.nome ?? "Produto"}`)
    .join("\n");
  const maisItens = itens.length > 3 ? `\n_...e mais ${itens.length - 3} itens_` : "";

  let mensagem = `🍱 Oi, *${nome}*! Você deixou algumas delícias no carrinho 😊\n\n`;
  if (itensTexto) {
    mensagem += `${itensTexto}${maisItens}\n\n`;
  }
  mensagem += `💰 Total: *R$ ${valor.toFixed(2).replace(".", ",")}*\n\n`;

  if (cupom) {
    mensagem += `🎁 Tem um cupom especial para você: *${cupom}*\nUse no checkout para garantir seu desconto!\n\n`;
  }

  mensagem += `Finalize seu pedido: saborosamente.vercel.app/carrinho`;

  const enviado = await sendWhatsApp(telefone, mensagem);

  if (enviado) {
    // Marca como notificado
    await supabase
      .from("carrinhos_abandonados")
      .update({
        notificado_em: new Date().toISOString(),
        status: "recuperado",
      })
      .eq("id", carrinho.id);
    return { id: carrinho.id, ok: true };
  }

  return { id: carrinho.id, ok: false, motivo: "falha ao enviar WhatsApp" };
}
