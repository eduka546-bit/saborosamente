//#region node_modules/.nitro/vite/services/ssr/assets/combo-rules-CAvABk5q.js
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
//#endregion
export { isNoDiscount as n, COMBO_RULES as t };
