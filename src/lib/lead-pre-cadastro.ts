/**
 * Pré-cadastro temporário criado pelo próprio visitante no pop-up do sorteio.
 * Não é uma conta. Não contém CPF, e-mail, token de login ou consentimentos.
 *
 * Usa sessionStorage (aba atual) e expira em 24 h, para não reutilizar nome
 * ou telefone pessoal em um dispositivo compartilhado posteriormente.
 */
export const PRE_CADASTRO_KEY = "saborosamente.lead_pre_cadastro.v1";
export const PRE_CADASTRO_TTL_MS = 24 * 60 * 60 * 1000;

export interface LeadPreCadastro {
  nome: string;
  telefone: string;
  sessionId: string;
  registradoEm: number;
}

export function telefonePreCadastro(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits.slice(2) : digits;
}

export function validarLeadPreCadastro(data: unknown, agora = Date.now()): LeadPreCadastro | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  const nome = typeof value.nome === "string" ? value.nome.trim() : "";
  const telefone = typeof value.telefone === "string" ? telefonePreCadastro(value.telefone) : "";
  const sessionId = typeof value.sessionId === "string" ? value.sessionId : "";
  const registradoEm = Number(value.registradoEm);
  if (nome.length < 3 || nome.length > 80 || !/^\d{10,11}$/.test(telefone) ||
      !/^sess_[A-Za-z0-9_-]{15,123}$/.test(sessionId) ||
      !Number.isFinite(registradoEm) || registradoEm > agora ||
      agora - registradoEm > PRE_CADASTRO_TTL_MS) return null;
  return { nome, telefone, sessionId, registradoEm };
}

export function salvarLeadPreCadastro(nome: string, telefone: string, sessionId: string): void {
  if (typeof window === "undefined") return;
  const novo = validarLeadPreCadastro({
    nome, telefone, sessionId, registradoEm: Date.now(),
  });
  if (novo) {
    try { window.sessionStorage.setItem(PRE_CADASTRO_KEY, JSON.stringify(novo)); }
    catch { /* navegação continua normalmente se storage estiver indisponível */ }
  }
}

export function lerLeadPreCadastro(): LeadPreCadastro | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PRE_CADASTRO_KEY);
    if (!raw) return null;
    const validado = validarLeadPreCadastro(JSON.parse(raw));
    if (!validado) window.sessionStorage.removeItem(PRE_CADASTRO_KEY);
    return validado;
  } catch {
    return null;
  }
}

export function limparLeadPreCadastro() {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(PRE_CADASTRO_KEY); } catch {}
}
