//#region node_modules/.nitro/vite/services/ssr/assets/combo-rules-CoNONiKT.js
/**
* Regras de desconto dos combos "Monte Você Mesmo"
* Arquivo separado para evitar imports circulares
*/
var COMBO_RULES = [
	{
		min: 5,
		discount: .03,
		label: "5+ marmitas",
		badge: "3% OFF"
	},
	{
		min: 10,
		discount: .05,
		label: "10+ marmitas",
		badge: "5% OFF"
	},
	{
		min: 20,
		discount: .07,
		label: "20+ marmitas",
		badge: "7% OFF"
	}
];
var NO_DISCOUNT_CATEGORIES = [
	"sopa",
	"sopas",
	"complemento",
	"complementos"
];
function isNoDiscount(categoria) {
	return NO_DISCOUNT_CATEGORIES.some((c) => categoria?.toLowerCase().includes(c));
}
function getComboDiscount(totalQty) {
	return [...COMBO_RULES].sort((a, b) => b.min - a.min).find((rule) => totalQty >= rule.min) ?? null;
}
var PROGRESSIVE_DISCOUNT_TIERS = [
	{
		min: 5,
		discount: .03
	},
	{
		min: 10,
		discount: .05
	},
	{
		min: 20,
		discount: .07
	}
];
/**
* Retorna a porcentagem de desconto progressivo (0, 0.03, 0.05, 0.07) para uma
* quantidade total de itens. Sopas/complementos CONTAM na quantidade total.
*/
function tierDescontoProgressivo(totalUnidades) {
	return [...PROGRESSIVE_DISCOUNT_TIERS].sort((a, b) => b.min - a.min).find((t) => totalUnidades >= t.min)?.discount ?? 0;
}
/**
* Calcula o valor do desconto progressivo em reais.
* A faixa é definida pelo total de unidades (incluindo sopas/complementos),
* mas o desconto incide APENAS sobre o subtotal das marmitas.
*/
function calcularDescontoProgressivo(itens) {
	const pct = tierDescontoProgressivo(itens.reduce((acc, i) => acc + i.quantidade, 0));
	if (pct === 0) return 0;
	return itens.filter((i) => !isNoDiscount(i.categoria)).reduce((acc, i) => acc + i.subtotal, 0) * pct;
}
/**
* Calcula o frete seguindo as regras do carrinho:
* - subtotal 0 ou acima do limite de frete grátis → 0
* - São Bento do Sul com 5+ unidades → frete promocional (R$ 5,00)
* - caso contrário, usa a taxa base
*/
function calcularFrete({ subtotal, totalUnidades, taxaBase, cidade, freteGratisAPartirDe = 999999, minQuantidadeSBS = 5, fretePromoSBS = 5 }) {
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
function calcularTotaisCombo(itens) {
	const totalQty = itens.reduce((s, i) => s + i.quantidade, 0);
	const subtotal = itens.reduce((s, i) => s + i.subtotal, 0);
	const marmitaSubtotal = itens.filter((i) => !isNoDiscount(i.categoria)).reduce((s, i) => s + i.subtotal, 0);
	const discountPct = getComboDiscount(totalQty)?.discount ?? 0;
	const discount = marmitaSubtotal * discountPct;
	return {
		totalQty,
		subtotal,
		discountPct,
		discount,
		total: subtotal - discount
	};
}
//#endregion
export { isNoDiscount as a, calcularTotaisCombo as i, calcularDescontoProgressivo as n, calcularFrete as r, COMBO_RULES as t };
