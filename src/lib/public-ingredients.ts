const normalizeIngredient = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const PRIVATE_INGREDIENT_PATTERNS = [
  /industrializ/i,
  /industraliad/i,
  /\bmarca\b/i,
  /demi\s*-?\s*glace/i,
  /^(extrato de tomate|molho de tomate|molho madeira|molho 4 queijos)\b/i,
  /\b(quero|qualimax|elege)\b/i,
];

export function isPublicIngredientAllowed(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return false;

  const normalized = normalizeIngredient(raw);
  return !PRIVATE_INGREDIENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function publicIngredientList(ingredients: unknown): string[] {
  const list = Array.isArray(ingredients)
    ? ingredients
    : String(ingredients ?? "")
        .replace(/^\{\}|^\[\]$/, "")
        .split(/[,;]+/);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of list) {
    const text = String(item ?? "").trim();
    if (!isPublicIngredientAllowed(text)) continue;

    const key = normalizeIngredient(text);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(text);
  }

  return result;
}

export function publicIngredientsText(ingredients: unknown): string {
  return publicIngredientList(ingredients).join(", ");
}
