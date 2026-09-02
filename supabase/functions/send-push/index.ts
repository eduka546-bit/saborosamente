// Edge function: envia Web Push para todos os aparelhos admin inscritos.
// Chamada internamente por outras functions (novo pedido / handoff) ou por teste.
//
// Requer os secrets (configurados no painel Supabase → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY   — chave pública VAPID (mesma do front)
//   VAPID_PRIVATE_KEY  — chave privada VAPID (secreta)
//   VAPID_SUBJECT      — opcional, "mailto:seu@email.com" (default abaixo)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";
import webpush from "https://esm.sh/web-push@3.6.7";
import { authorizationError, authorizeAdminOrService } from "../_shared/authorization.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@saborosamente.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = await authorizeAdminOrService(req);
    if (!authorization.ok) return authorizationError(authorization, corsHeaders);

    const { title, body, url, tag } = await req.json().catch(() => ({}));

    const payload = JSON.stringify({
      title: title || "Saborosamente",
      body: body || "",
      url: url || "/admin/pedidos",
      tag: tag || "saborosamente",
      requireInteraction: true,
    });

    // Busca todas as inscrições ativas
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ ok: true, enviados: 0, motivo: "sem inscrições" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let enviados = 0;
    const expiradas: string[] = [];

    await Promise.all(
      subs.map(async (s: any) => {
        const subscription = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        };
        try {
          await webpush.sendNotification(subscription, payload);
          enviados++;
        } catch (err: any) {
          // 404/410 = inscrição expirou/cancelou → remove do banco
          const status = err?.statusCode;
          if (status === 404 || status === 410) {
            expiradas.push(s.endpoint);
          } else {
            console.error("Falha ao enviar push:", status, err?.body ?? err?.message);
          }
        }
      }),
    );

    // Limpa inscrições mortas
    if (expiradas.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expiradas);
    }

    return new Response(
      JSON.stringify({ ok: true, enviados, removidas: expiradas.length, total: subs.length }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
