/**
 * pedidos10-webhook
 *
 * Edge function que recebe webhooks do Pedidos10.
 * Fase 1: grava o payload completo em webhook_logs pra análise.
 * Fase 2: depois de entender o formato, parseia e cria pedido + decrementa estoque.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let payload: any = null;

    if (contentType.includes("application/json")) {
      payload = await req.json().catch(() => null);
    } else {
      // Tenta ler como texto (pode vir form-encoded ou outro formato)
      const text = await req.text().catch(() => "");
      payload = { raw_text: text };
    }

    // Coleta headers relevantes (pra entender como autenticam)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      // Não grava cookies por segurança
      if (key.toLowerCase() !== "cookie") {
        headers[key] = value;
      }
    });

    // Grava no banco
    const { error } = await supabase.from("webhook_logs").insert({
      origem: "pedidos10",
      metodo: req.method,
      url: req.url,
      headers,
      payload,
    });

    if (error) {
      console.error("Erro ao gravar webhook_log:", error.message);
    }

    console.log("✅ Webhook Pedidos10 recebido e gravado.");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("pedidos10-webhook error:", e.message);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
