/**
 * Telefone informado voluntariamente no carrinho para receber ofertas.
 * É só um pré-cadastro da aba atual, NÃO autenticação nem validação de posse
 * do telefone. Não transfere autorização de marketing para o checkout.
 */
export function lerTelefonePreCadastroWhatsApp(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem("saborosamente.whatsapp_ofertas_telefone");
    const digits = String(raw || "").replace(/\D/g, "");
    const normalized =
      digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
        ? digits.slice(2)
        : digits;
    return /^\d{10,11}$/.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
