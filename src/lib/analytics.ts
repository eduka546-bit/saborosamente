import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "saborosamente.analytics.session";

export function getAnalyticsSessionId() {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${crypto.randomUUID().replaceAll("-", "")}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function trackEvent(
  evento: string,
  options: {
    produtoId?: string | null;
    pedidoId?: string | null;
    valor?: number | null;
    metadata?: Record<string, unknown>;
  } = {},
) {
  if (typeof window === "undefined") return;
  try {
    await supabase.rpc("registrar_evento_analytics", {
      p_session_id: getAnalyticsSessionId(),
      p_evento: evento,
      p_produto_id: options.produtoId ?? null,
      p_pedido_id: options.pedidoId ?? null,
      p_valor: options.valor ?? null,
      p_metadata: {
        path: window.location.pathname,
        ...(options.metadata ?? {}),
      },
    });
  } catch {
    // Analytics nunca deve bloquear a compra.
  }
}

export function experimentVariant(name: string, variants = ["A", "B"]) {
  if (typeof window === "undefined") return variants[0];
  const key = `saborosamente.experiment.${name}`;
  const existing = window.localStorage.getItem(key);
  if (existing && variants.includes(existing)) return existing;
  const session = getAnalyticsSessionId();
  let hash = 0;
  for (const ch of `${name}:${session}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const variant = variants[hash % variants.length];
  window.localStorage.setItem(key, variant);
  return variant;
}
