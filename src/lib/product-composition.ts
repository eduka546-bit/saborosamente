export type CompositionRow = {
  nome: string;
  gramas_150?: number | string;
  gramas_200?: number | string;
  gramas_300?: number | string;
  gramas_400?: number | string;
};
export const COMPOSITION_MARGIN = "Margem de 10% para mais ou menos de cada preparo";
export function compositionForWeight(value: unknown, weight: string) {
  const size = Number.parseInt(weight, 10);
  if (![150, 200, 300, 400].includes(size) || !Array.isArray(value)) return [];
  const field = `gramas_${size}` as keyof CompositionRow;
  return value.flatMap((row: CompositionRow) => {
    const grams = Number(row?.[field]);
    const nome = String(row?.nome || "").trim();
    return nome && Number.isFinite(grams) && grams > 0 ? [{ nome, gramas: grams }] : [];
  });
}
export function compositionValidation(value: unknown) {
  if (!Array.isArray(value)) return "Composição inválida.";
  const names = new Set<string>();
  for (const row of value as CompositionRow[]) {
    const name = String(row.nome || "").trim();
    if (!name) return "Preencha o nome de cada preparo da composição.";
    const key = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (names.has(key)) return `Preparo duplicado na composição: ${name}.`;
    names.add(key);
    for (const size of [150, 200, 300, 400]) {
      const raw = row[`gramas_${size}` as keyof CompositionRow];
      if (raw !== undefined && raw !== "" && (!Number.isFinite(Number(raw)) || Number(raw) < 0))
        return "As gramaturas devem ser números iguais ou maiores que zero.";
    }
  }
  return null;
}
