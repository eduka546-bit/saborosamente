const parseNutritionNumber = (value: unknown) => {
  const parsed = Number(String(value ?? "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export function proteinValuesByFlavor(product: any): number[] {
  const tables = [
    product?.tabela_nutricional_200g,
    product?.tabela_nutricional_300g,
    product?.tabela_nutricional_400g,
    product?.tabela_nutricional,
  ].filter(Boolean);

  return tables
    .map((table: any) => parseNutritionNumber(table?.prot))
    .filter((value) => value > 0);
}

/**
 * "Alta proteína" é uma característica do sabor, não do tamanho exibido.
 * Se qualquer tamanho cadastrado atingir o corte, todos os tamanhos daquele
 * mesmo sabor recebem a classificação.
 */
export function isHighProteinFlavor(product: any, threshold = 30): boolean {
  return proteinValuesByFlavor(product).some((value) => value >= threshold);
}

export function maxProteinForFlavor(product: any): number {
  const values = proteinValuesByFlavor(product);
  return values.length ? Math.max(...values) : 0;
}
