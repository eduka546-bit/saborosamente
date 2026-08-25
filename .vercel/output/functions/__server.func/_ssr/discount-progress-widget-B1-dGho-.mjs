import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { A as ShoppingBag } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { i as useCart, n as RULES } from "./cart-BqYHNYf3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/discount-progress-widget-B1-dGho-.js
var import_jsx_runtime = require_jsx_runtime();
function DiscountProgressWidget({ className }) {
	const { count } = useCart();
	const nextLevel = [...RULES.PROGRESSIVE_DISCOUNT].sort((a, b) => a.min - b.min).find((r) => count < r.min);
	const currentLevel = [...RULES.PROGRESSIVE_DISCOUNT].sort((a, b) => b.min - a.min).find((r) => count >= r.min);
	const progress = nextLevel ? count / nextLevel.min * 100 : 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-2xl bg-primary/5 p-4 border border-primary/10", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between mb-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { size: 14 }), currentLevel ? `Desconto Ativo: ${(currentLevel.discount * 100).toFixed(0)}%` : "Desconto Progressivo"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded",
				children: [
					count,
					" ",
					count === 1 ? "item" : "itens"
				]
			})]
		}), nextLevel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-2 w-full bg-primary/10 rounded-full overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-primary transition-all duration-500 ease-out",
					style: { width: `${progress}%` }
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[9px] font-bold text-primary/70 uppercase text-center",
				children: [
					"Adicione mais ",
					nextLevel.min - count,
					" para ",
					(nextLevel.discount * 100).toFixed(0),
					"% OFF"
				]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-primary",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-2 rounded-full bg-primary animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] font-black uppercase",
				children: "Desconto Máximo Atingido!"
			})]
		})]
	});
}
//#endregion
export { DiscountProgressWidget as t };
