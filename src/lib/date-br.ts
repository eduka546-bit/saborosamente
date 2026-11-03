/**
 * Exibe datas de pedidos no padrão brasileiro sem reinterpretar DD/MM/AAAA
 * como MM/DD/AAAA (comportamento de Date.parse em alguns navegadores).
 * Datas civis não sofrem ajuste de fuso; instantes com offset explícito
 * são apresentados na hora local de São Bento do Sul (São Paulo).
 */
export function formatOrderDateBR(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ""
      : value.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }

  const raw = String(value).trim();
  if (!raw) return "";

  // Data civil já brasileira: não enviar para new Date/Date.parse.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;

  // Datas civis do banco: YYYY-MM-DD. Evita deslocar um dia por fuso.
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/);
  if (iso) {
    // Apenas timestamps com offset definido representam instantes absolutos.
    if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
      const instant = new Date(raw);
      if (!Number.isNaN(instant.getTime())) {
        return instant.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
      }
    }
    return iso[3] + "/" + iso[2] + "/" + iso[1];
  }

  // Outros formatos são mantidos, sem o risco de trocar dia e mês.
  return raw;
}
