/**
 * Identifica apenas combos PRONTOS existentes no catálogo.
 * Combos "a escolha", com códigos TD ou sem nome conhecido continuam no fluxo original.
 * O marcador é usado apenas na interpretação, nunca vira um produto inventado.
 */
export function codigoComboPronto(nome: string): string | null {
  const normalizado = String(nome ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
  const resultado = normalizado.match(/\bcombo\s+(?:pratos\s+)?mais\s+(vendidos|leves)\s*[-–]?\s*(5|10|20)\s*un(?:idades?)?\b/);
  if (!resultado) return null;
  return "__COMBO_" + (resultado[1] === "vendidos" ? "MAIS_VENDIDOS" : "MAIS_LEVES") + "_" + resultado[2];
}
