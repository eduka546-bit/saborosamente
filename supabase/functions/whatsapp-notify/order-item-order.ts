/** Ordenação natural por código de sabor; não altera o array original. */
const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function read(source: unknown, field: string): string {
  if (!source || typeof source !== "object") return "";
  const value = (source as Record<string, unknown>)[field];
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function labels(item: unknown): string[] {
  const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  return [
    read(item, "codigo"), read(item, "codigo_produto"), read(item, "sku"),
    read(obj.product, "codigo"), read(obj.produtos, "codigo"),
    read(obj.product, "nome"), read(obj.produtos, "nome"),
    read(item, "nome"), read(item, "nome_item"), read(item, "observacao"),
  ].filter(Boolean);
}

function code(item: unknown): { prefix: string; number: number } | null {
  for (const label of labels(item)) {
    // Não confundir "Combo 10" ou EAN de barras com código comercial.
    const m = label.match(/\b([A-Z]{1,5})[-_.]?0*(\d{1,5})\b/i)
      ?? label.match(/\b(TD)\s+0*(\d{1,5})\b/i);
    if (m) return { prefix: m[1].toUpperCase(), number: Number(m[2]) };
  }
  return null;
}

function itemName(item: unknown): string {
  const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  return [read(obj.product, "nome"), read(obj.produtos, "nome"), read(item, "nome"), read(item, "nome_item")]
    .find(Boolean) ?? "";
}

function weight(item: unknown): number {
  const s = [read(item, "weight"), read(item, "tamanho"), read(item, "peso"), read(item, "observacao")].join(" ");
  const match = s.match(/\b(\d{2,3})\s*g\b/i);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

/** Ordena TD01, TD04, TD09; empata por gramatura e mantém quantidade/preço intactos. */
export function sortOrderItems<T>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const x = code(a), y = code(b);
    if (x && y) {
      const prefixOrder = collator.compare(x.prefix, y.prefix);
      if (prefixOrder) return prefixOrder;
      if (x.number !== y.number) return x.number - y.number;
    } else if (x || y) {
      return x ? -1 : 1;
    }
    const nameOrder = collator.compare(itemName(a), itemName(b));
    if (nameOrder) return nameOrder;
    const wa = weight(a), wb = weight(b);
    return wa === wb ? 0 : wa - wb;
  });
}
