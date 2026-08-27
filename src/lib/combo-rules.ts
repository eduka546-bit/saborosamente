/**
 * Regras de desconto dos combos "Monte Você Mesmo"
 * Arquivo separado para evitar imports circulares
 */

export const COMBO_RULES = [
  { min: 5, discount: 0.03, label: "5+ marmitas", badge: "3% OFF" },
  { min: 10, discount: 0.05, label: "10+ marmitas", badge: "5% OFF" },
  { min: 20, discount: 0.07, label: "20+ marmitas", badge: "7% OFF" },
];

// Categorias com preço fixo (não recebem desconto progressivo).
// "combo" cobre os Combos Prontos, que já têm desconto embutido no preço:
// eles CONTAM na quantidade total, mas não ganham desconto progressivo adicional.
export const NO_DISCOUNT_CATEGORIES = [
  "sopa",
  "sopas",
  "complemento",
  "complementos",
  "combo",
];

export function isNoDiscount(categoria: string) {
  return NO_DISCOUNT_CATEGORIES.some((c) => categoria?.toLowerCase().includes(c));
}

/**
 * Identifica se um produto é MARMITA (por exclusão).
 * É marmita quando NÃO é sopa, NÃO é combo ("Monte/Escolha Você Mesmo" ou
 * "Combo Pronto") e NÃO cai em NO_DISCOUNT_CATEGORIES (complemento etc.).
 * Usado para decidir se as opções "Pronta para consumo / Congelada" aparecem.
 */
export function isMarmita(nome?: string, categoria?: string): boolean {
  const cat = (categoria ?? "").toLowerCase();
  const nm = (nome ?? "").toLowerCase();
  const ehSopa = cat.includes("sopa") || nm.includes("sopa");
  const ehCombo =
    cat.includes("combo") ||
    nm.includes("combo") ||
    nm.includes("monte você mesmo") ||
    nm.includes("monte voce mesmo") ||
    nm.includes("escolha você mesmo") ||
    nm.includes("escolha voce mesmo") ||
    cat.includes("escolha você mesmo") ||
    cat.includes("escolha voce mesmo");
  return !ehSopa && !ehCombo && !isNoDiscount(cat);
}

/**
 * Quantas unidades um COMBO PRONTO representa na contagem total do carrinho.
 * Combos prontos ("Combo ... - 5un / 10un / 20un") têm preço fixo e NÃO recebem
 * desconto, mas contam como 5/10/20 itens para empurrar a faixa das marmitas avulsas.
 * Para qualquer outro produto, retorna 1 (contagem normal por unidade).
 *
 * Ex.: "Combo Pratos Mais Vendidos - 5un" → 5
 *      "Combo A Escolha - 10 A 19 Marmitas" → 10
 */
export function unidadesDoItem(nome?: string, categoria?: string): number {
  const texto = `${nome ?? ""} ${categoria ?? ""}`.toLowerCase();
  const ehCombo = texto.includes("combo");
  if (!ehCombo) return 1;
  // "5un", "10 un", "10 a 19", "20+", "20 ou mais"
  const mUn = texto.match(/(\d+)\s*un/);
  if (mUn) return Math.max(1, parseInt(mUn[1], 10));
  const mFaixa = texto.match(/(\d+)\s*a\s*\d+/); // "5 a 9", "10 a 19"
  if (mFaixa) return Math.max(1, parseInt(mFaixa[1], 10));
  const mMais = texto.match(/(\d+)\s*(\+|ou\s*mais)/); // "20+", "20 ou mais"
  if (mMais) return Math.max(1, parseInt(mMais[1], 10));
  return 1;
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

// ─────────────────────────────────────────────────────────────────────────────
// Preços fixos por faixa de quantidade e por tamanho (marmitas).
// A faixa é definida pela QUANTIDADE TOTAL de itens no carrinho (sopas e
// complementos contam na quantidade, mas mantêm o próprio preço).
// Preços globais — iguais para todas as marmitas.
//   1–4 un  → "unit"
//   5–9 un  → "t5"
//   10–19   → "t10"
//   20+     → "t20"
// ─────────────────────────────────────────────────────────────────────────────
export type TamanhoMarmita = "200g" | "300g" | "400g";
export interface FaixaPrecos {
  unit: number;
  t5: number;
  t10: number;
  t20: number;
}
export type TabelaPrecosMarmita = Record<TamanhoMarmita, FaixaPrecos>;

// Tabela padrão (fallback). É editável no admin (aba Parâmetros) e sobrescreve
// estes valores em runtime via site_settings.parametros_loja.precos_marmita.
export const MARMITA_PRICE_TABLE: TabelaPrecosMarmita = {
  "200g": { unit: 16.9, t5: 16.5, t10: 15.9, t20: 14.9 },
  "300g": { unit: 20.9, t5: 20.5, t10: 19.9, t20: 18.9 },
  "400g": { unit: 23.9, t5: 22.9, t10: 21.9, t20: 20.9 },
};

// Valida/normaliza uma tabela vinda do banco, caindo no default por campo faltante.
export function normalizarPrecosMarmita(raw: any): TabelaPrecosMarmita {
  const num = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const linha = (tam: TamanhoMarmita): FaixaPrecos => {
    const src = raw?.[tam] ?? {};
    const def = MARMITA_PRICE_TABLE[tam];
    return {
      unit: num(src.unit, def.unit),
      t5: num(src.t5, def.t5),
      t10: num(src.t10, def.t10),
      t20: num(src.t20, def.t20),
    };
  };
  return { "200g": linha("200g"), "300g": linha("300g"), "400g": linha("400g") };
}

// Normaliza o peso/tamanho para uma chave da tabela (P/M/G ou 200g/300g/400g).
export function normalizarTamanho(peso?: string): TamanhoMarmita {
  const p = (peso ?? "").toLowerCase().trim();
  if (p.includes("400") || p === "g") return "400g";
  if (p.includes("300") || p === "m") return "300g";
  return "200g"; // default P / 200g
}

// Retorna a chave de faixa a partir da quantidade total de itens.
export function faixaPorQuantidade(totalUnidades: number): keyof FaixaPrecos {
  if (totalUnidades >= 20) return "t20";
  if (totalUnidades >= 10) return "t10";
  if (totalUnidades >= 5) return "t5";
  return "unit";
}

/**
 * Preço unitário de UMA marmita, dado o tamanho e a quantidade total do carrinho.
 * `tabela` permite injetar a tabela configurada no admin (default = MARMITA_PRICE_TABLE).
 */
export function precoMarmitaPorFaixa(
  peso: string | undefined,
  totalUnidades: number,
  precoCheioFallback: number,
  tabela: TabelaPrecosMarmita = MARMITA_PRICE_TABLE,
): number {
  const tam = normalizarTamanho(peso);
  const linha = tabela[tam];
  if (!linha) return precoCheioFallback;
  return linha[faixaPorQuantidade(totalUnidades)];
}

// Preço unitário "cheio" (faixa unit) de uma marmita por tamanho.
export function precoCheioMarmita(
  peso: string | undefined,
  tabela: TabelaPrecosMarmita = MARMITA_PRICE_TABLE,
): number {
  const tam = normalizarTamanho(peso);
  return tabela[tam]?.unit ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rótulo de % de economia por faixa (aproximado), derivado da própria tabela.
// Como o preço é fixo por faixa, o % varia um pouco por tamanho; usamos a média
// entre os tamanhos como rótulo aproximado exibido ao cliente ("~X% OFF").
// ─────────────────────────────────────────────────────────────────────────────
// Rótulos de % exibidos ao cliente (apenas informativos). Os PREÇOS cobrados
// vêm de MARMITA_PRICE_TABLE; estes percentuais são só a comunicação visual.
export const PROGRESSIVE_LABELS = [
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
