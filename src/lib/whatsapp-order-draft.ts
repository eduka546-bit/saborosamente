/** Rascunhos ficam somente na aba administrativa atual e expiram automaticamente. */
const PREFIX = "saborosamente:admin:whatsapp-rascunho:v1";
export const WHATSAPP_DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function whatsappDraftKey(cliente?: string, historico?: string): string {
  return [PREFIX, historico ? "historico:" + historico : cliente ? "cliente:" + cliente : "novo"].join(":");
}

export function lerRascunhoWhatsapp<T>(
  storage: DraftStorage | null,
  key: string,
  agora = Date.now(),
): T | null {
  if (!storage) return null;
  try {
    const bruto = storage.getItem(key);
    if (!bruto) return null;
    const envelope: unknown = JSON.parse(bruto);
    if (!envelope || typeof envelope !== "object") return null;
    const { atualizadoEm, dados } = envelope as { atualizadoEm?: unknown; dados?: unknown };
    if (typeof atualizadoEm !== "number" || atualizadoEm > agora ||
        agora - atualizadoEm > WHATSAPP_DRAFT_TTL_MS ||
        !dados || typeof dados !== "object" || Array.isArray(dados)) {
      storage.removeItem(key);
      return null;
    }
    return dados as T;
  } catch {
    return null;
  }
}

export function salvarRascunhoWhatsapp<T>(
  storage: DraftStorage | null,
  key: string,
  dados: T,
  agora = Date.now(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify({ atualizadoEm: agora, dados }));
    return true;
  } catch {
    // Armazenamento desativado ou cheio: não interrompe o atendimento.
    return false;
  }
}

export function limparRascunhoWhatsapp(storage: DraftStorage | null, key: string): void {
  try { storage?.removeItem(key); } catch { /* indisponível */ }
}
