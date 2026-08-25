/**
 * Regras de desconto dos combos "Monte Você Mesmo"
 * Arquivo separado para evitar imports circulares
 */

export const COMBO_RULES = [
  { min: 5, discount: 0.03, label: "5+ marmitas", badge: "3% OFF" },
  { min: 10, discount: 0.05, label: "10+ marmitas", badge: "5% OFF" },
  { min: 20, discount: 0.07, label: "20+ marmitas", badge: "7% OFF" },
];

// Categorias com preço fixo (não recebem desconto progressivo)
export const NO_DISCOUNT_CATEGORIES = ["sopa", "sopas", "complemento", "complementos"];

export function isNoDiscount(categoria: string) {
  return NO_DISCOUNT_CATEGORIES.some((c) => categoria?.toLowerCase().includes(c));
}

export function getComboDiscount(totalQty: number) {
  return (
    [...COMBO_RULES].sort((a, b) => b.min - a.min).find((rule) => totalQty >= rule.min) ?? null
  );
}
