// Web Push (notificações mesmo com o app fechado).
// A chave pública VAPID não é secreta — pode ficar no bundle do cliente.
// A chave privada correspondente fica só no servidor (edge function send-push).

import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BA-EtcGzSYvEOYttCcnr9cxdd9z2l7_IDfLE4zrA3lmrKxCQG2aeRJUk6ToL3yzcsPYj8CzKyPx-xLSWIkQf7Jk";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSuportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function statusPush(): Promise<"nao-suportado" | "inscrito" | "nao-inscrito" | "bloqueado"> {
  if (!pushSuportado()) return "nao-suportado";
  if (Notification.permission === "denied") return "bloqueado";
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub ? "inscrito" : "nao-inscrito";
  } catch {
    return "nao-inscrito";
  }
}

/**
 * Pede permissão, inscreve o aparelho no push e salva a subscription no Supabase.
 * Retorna true se inscreveu com sucesso.
 */
export async function ativarPush(): Promise<boolean> {
  if (!pushSuportado()) {
    throw new Error("Este navegador não suporta notificações push.");
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("Permissão de notificação negada.");
  }

  const reg = await navigator.serviceWorker.ready;

  // Reaproveita inscrição existente ou cria nova
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const json = sub.toJSON();
  const keys = json.keys ?? {};

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // upsert por endpoint (único) — evita duplicar se reativar no mesmo aparelho
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: session?.user?.id ?? null,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh ?? "",
      auth: keys.auth ?? "",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw error;
  return true;
}

/** Cancela a inscrição de push neste aparelho e remove do banco. */
export async function desativarPush(): Promise<void> {
  if (!pushSuportado()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
