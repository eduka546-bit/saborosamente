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

// ─────────────────────────────────────────────────────────────────────────────
// Funções puras de cálculo (testáveis, sem dependência de React)
// Espelham a lógica usada no carrinho (src/lib/cart.tsx).
// ─────────────────────────────────────────────────────────────────────────────

export const PROGRESSIVE_DISCOUNT_TIERS = [
  { min: 5, discount: 0.03 },
  { min: 10, discount: 0.05 },
  { min: 20, discount: 0.07 },
];

export interface CartItemForCalc {
  categoria: string;
  subtotal: number;
  quantidade: number;
}

/**
 * Retorna a porcentagem de desconto progressivo (0, 0.03, 0.05, 0.07) para uma
 * quantidade total de itens. Sopas/complementos CONTAM na quantidade total.
 */
export function tierDescontoProgressivo(totalUnidades: number): number {
  return (
    [...PROGRESSIVE_DISCOUNT_TIERS]
      .sort((a, b) => b.min - a.min)
      .find((t) => totalUnidades >= t.min)?.discount ?? 0
  );
}

/**
 * Calcula o valor do desconto progressivo em reais.
 * A faixa é definida pelo total de unidades (incluindo sopas/complementos),
 * mas o desconto incide APENAS sobre o subtotal das marmitas.
 */
export function calcularDescontoProgressivo(itens: CartItemForCalc[]): number {
  const totalUnidades = itens.reduce((acc, i) => acc + i.quantidade, 0);
  const pct = tierDescontoProgressivo(totalUnidades);
  if (pct === 0) return 0;

  const subtotalMarmitas = itens
    .filter((i) => !isNoDiscount(i.categoria))
    .reduce((acc, i) => acc + i.subtotal, 0);

  return subtotalMarmitas * pct;
}

export interface FreteParams {
  subtotal: number;
  totalUnidades: number;
  /** Taxa base do bairro selecionado (ou taxa padrão). */
  taxaBase: number;
  cidade?: string;
  /** A partir de qual subtotal o frete é grátis (padrão: desativado). */
  freteGratisAPartirDe?: number;
  /** Quantidade mínima para o frete promocional de São Bento do Sul. */
  minQuantidadeSBS?: number;
  /** Valor do frete promocional de São Bento do Sul. */
  fretePromoSBS?: number;
}

/**
 * Calcula o frete seguindo as regras do carrinho:
 * - subtotal 0 ou acima do limite de frete grátis → 0
 * - São Bento do Sul com 5+ unidades → frete promocional (R$ 5,00)
 * - caso contrário, usa a taxa base
 */
export function calcularFrete({
  subtotal,
  totalUnidades,
  taxaBase,
  cidade,
  freteGratisAPartirDe = 999999,
  minQuantidadeSBS = 5,
  fretePromoSBS = 5.0,
}: FreteParams): number {
  if (subtotal === 0 || subtotal >= freteGratisAPartirDe) return 0;

  if (cidade && cidade.toLowerCase().includes("são bento do sul")) {
    if (totalUnidades >= minQuantidadeSBS) return fretePromoSBS;
  }

  return taxaBase;
}

/**
 * Calcula os totais de um combo "Monte Você Mesmo".
 * O desconto usa a MAIOR faixa aplicável (getComboDiscount) e incide apenas
 * sobre o subtotal das marmitas (sopas/complementos entram no total sem desconto).
 */
export function calcularTotaisCombo(itens: CartItemForCalc[]): {
  totalQty: number;
  subtotal: number;
  discountPct: number;
  discount: number;
  total: number;
} {
  const totalQty = itens.reduce((s, i) => s + i.quantidade, 0);
  const subtotal = itens.reduce((s, i) => s + i.subtotal, 0);
  const marmitaSubtotal = itens
    .filter((i) => !isNoDiscount(i.categoria))
    .reduce((s, i) => s + i.subtotal, 0);
  const discountPct = getComboDiscount(totalQty)?.discount ?? 0;
  const discount = marmitaSubtotal * discountPct;
  return {
    totalQty,
    subtotal,
    discountPct,
    discount,
    total: subtotal - discount,
  };
}
