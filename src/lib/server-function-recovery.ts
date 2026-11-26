import { toast } from "sonner";
export function recarregarComProtecao(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (/^\/(admin(?:[/.\-]|$)|cozinha(?:[/.\-]|$)|checkout(?:\/|$)|perfil(?:\/|$))/.test(path)) {
    toast.warning("Há uma nova versão do sistema. Salve o trabalho em andamento antes de atualizar.", {
      id: "sm-atualizacao-disponivel", duration: Infinity,
      action: { label: "Atualizar", onClick: () => window.location.reload() },
    });
    return false;
  }
  window.location.reload();
  return true;
}
const RELOAD_KEY = "saborosamente.server_fn_reload_at";

function messageOf(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error ?? "");
  }
}

export function recoverFromStaleServerFunction(error: unknown): boolean {
  const message = messageOf(error);
  if (!message.includes("Server function info not found")) return false;
  if (typeof window === "undefined") return false;

  const now = Date.now();
  const previous = Number(sessionStorage.getItem(RELOAD_KEY) || "0");

  // Evita loop de recarga caso o problema não seja apenas uma aba antiga.
  if (Number.isFinite(previous) && now - previous < 60_000) return false;

  sessionStorage.setItem(RELOAD_KEY, String(now));
  return recarregarComProtecao();
}
