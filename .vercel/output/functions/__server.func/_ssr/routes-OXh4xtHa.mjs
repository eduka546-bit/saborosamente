import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, A as ShoppingBag, F as Search, Gt as ChevronLeft, H as Plus, Jt as Check, Qt as Calendar, S as Tag, Wt as ChevronRight, Z as Minus, a as WheatOff, b as Timer, ct as LoaderCircle, gt as Gift, h as TrendingUp, i as X, j as ShieldCheck, k as ShoppingCart, lt as Leaf, p as Truck, qt as ChefHat, rt as MapPin, ut as Info, vt as Flame } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as getPublicProducts } from "./products.functions-CPJ8Fofb.mjs";
import { a as isNoDiscount, i as calcularTotaisCombo, t as COMBO_RULES } from "./combo-rules-DW0a8AzE.mjs";
import { i as useCart, r as formatBRL } from "./cart-YJDidPFU.mjs";
import { t as DiscountProgressWidget } from "./discount-progress-widget-BQfBY6rg.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-OXh4xtHa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* ComboBuilderModal
*
* Modal para montar combos "Monte Você Mesmo".
* Regras:
* - Sopas e Complementos: preço fixo, sem desconto, MAS contam na quantidade
* - Marmitas: recebem desconto progressivo por quantidade total
*   5+  = 3% OFF
*   10+ = 5% OFF
*   20+ = 7% OFF
*/
function isNoDiscountLocal(categoria) {
	return isNoDiscount(categoria);
}
function ComboBuilderModal({ isOpen, onClose, combo, products }) {
	const { add } = useCart();
	const [items, setItems] = (0, import_react.useState)([]);
	const [search, setSearch] = (0, import_react.useState)("");
	const [selectedCategory, setSelectedCategory] = (0, import_react.useState)("Todas");
	const categories = (0, import_react.useMemo)(() => {
		const cats = /* @__PURE__ */ new Set();
		products.forEach((p) => {
			const cat = p.categorias?.nome || p.categoria || "";
			if (cat && !cat.toLowerCase().includes("combo")) cats.add(cat);
		});
		return ["Todas", ...Array.from(cats).sort()];
	}, [products]);
	const filteredProducts = (0, import_react.useMemo)(() => {
		return products.filter((p) => {
			const cat = p.categorias?.nome || p.categoria || "";
			const matchCat = selectedCategory === "Todas" || cat === selectedCategory;
			const matchSearch = !search || p.nome?.toLowerCase().includes(search.toLowerCase());
			return matchCat && matchSearch;
		});
	}, [
		products,
		selectedCategory,
		search
	]);
	const { totalQty, subtotal, discountPct, discount, total } = (0, import_react.useMemo)(() => calcularTotaisCombo(items.map((i) => ({
		categoria: i.categoria,
		subtotal: i.preco * i.quantity,
		quantidade: i.quantity
	}))), [items]);
	if (!isOpen) return null;
	function getPrice(product, weight) {
		if (isNoDiscountLocal(product.categorias?.nome || product.categoria || "")) return product.preco ?? 0;
		if (weight === "300g" && product.preco_300g) return product.preco_300g;
		if (weight === "400g" && product.preco_400g) return product.preco_400g;
		return product.preco ?? 0;
	}
	function getWeights(product) {
		const peso = product.peso || "";
		if (peso.includes("-")) return peso.split("-").map((w) => w.trim());
		if (peso.includes(",")) return peso.split(",").map((w) => w.trim());
		return peso ? [peso] : ["200g"];
	}
	function getItemKey(productId, weight) {
		return `${productId}__${weight}`;
	}
	function getQty(productId, weight) {
		return items.find((i) => i.productId === productId && i.weight === weight)?.quantity ?? 0;
	}
	function changeQty(product, weight, delta) {
		const cat = product.categorias?.nome || product.categoria || "";
		const preco = getPrice(product, weight);
		getItemKey(product.id, weight);
		setItems((prev) => {
			const existing = prev.find((i) => i.productId === product.id && i.weight === weight);
			if (existing) {
				const newQty = existing.quantity + delta;
				if (newQty <= 0) return prev.filter((i) => !(i.productId === product.id && i.weight === weight));
				return prev.map((i) => i.productId === product.id && i.weight === weight ? {
					...i,
					quantity: newQty
				} : i);
			}
			if (delta <= 0) return prev;
			return [...prev, {
				productId: product.id,
				weight,
				quantity: delta,
				nome: product.nome,
				preco,
				categoria: cat,
				imagem: product.imagem_url || product.imagem || ""
			}];
		});
	}
	function handleAddToCart() {
		if (items.length === 0) {
			toast.error("Adicione pelo menos 1 item ao combo.");
			return;
		}
		items.forEach((item) => {
			add(item.productId, item.quantity, item.weight);
		});
		toast.success(`Combo adicionado!`, { description: `${totalQty} itens${discountPct > 0 ? ` com ${(discountPct * 100).toFixed(0)}% OFF nas marmitas` : ""}` });
		onClose();
		setItems([]);
		setSearch("");
		setSelectedCategory("Todas");
	}
	const nextRule = COMBO_RULES.slice().reverse().find((r) => r.min > totalQty);
	const currentRule = COMBO_RULES.find((r) => totalQty >= r.min);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-5xl max-h-[95vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-[#086e45] px-6 py-4 text-white flex items-center justify-between shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-black",
						children: combo.nome
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-white/75 mt-0.5",
						children: "Escolha suas marmitas — quanto mais, maior o desconto!"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-[#086e45]/5 border-b px-6 py-3 shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-6 flex-wrap",
						children: [COMBO_RULES.slice().reverse().map((rule) => {
							const active = totalQty >= rule.min;
							const isCurrent = currentRule?.min === rule.min;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("flex items-center gap-2 text-xs font-bold transition-all", active ? "text-[#086e45]" : "text-gray-400"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cn("h-5 px-2 rounded-full flex items-center gap-1 transition-all", active ? "bg-[#086e45] text-white" : "bg-gray-200 text-gray-400"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { size: 10 }), rule.badge]
									}),
									rule.min,
									"+ itens",
									isCurrent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[#086e45]",
										children: "✓"
									})
								]
							}, rule.min);
						}), nextRule && totalQty > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-gray-400 ml-auto",
							children: [
								"Faltam ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-[#086e45]",
									children: nextRule.min - totalQty
								}),
								" para",
								" ",
								nextRule.badge
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-1 overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 flex flex-col overflow-hidden border-r",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-4 pt-4 pb-3 space-y-3 shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									size: 15,
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Buscar marmita...",
									value: search,
									onChange: (e) => setSearch(e.target.value),
									className: "pl-8 h-9 text-sm"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none",
								children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setSelectedCategory(cat),
									className: cn("shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all border", selectedCategory === cat ? "bg-[#086e45] text-white border-[#086e45]" : "bg-gray-50 text-gray-500 border-transparent hover:border-[#086e45]/30"),
									children: cat
								}, cat))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto px-4 pb-4 space-y-2",
							children: filteredProducts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-12 text-center text-gray-400 text-sm",
								children: "Nenhum produto encontrado."
							}) : filteredProducts.map((product) => {
								const cat = product.categorias?.nome || product.categoria || "";
								const noDiscount = isNoDiscount(cat);
								const weights = getWeights(product);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-[#086e45]/20 hover:bg-gray-50/50 transition-all",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0",
											children: product.imagem_url || product.imagem ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: product.imagem_url || product.imagem,
												alt: product.nome,
												className: "h-full w-full object-cover",
												loading: "lazy"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-full w-full flex items-center justify-center text-gray-300 text-xs",
												children: "📦"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-semibold text-gray-900 truncate leading-tight",
													children: product.nome
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-gray-400 mt-0.5",
													children: cat
												}),
												noDiscount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold",
													children: "Preço fixo"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-col gap-1.5 shrink-0",
											children: weights.map((w) => {
												const price = getPrice(product, w);
												const qty = getQty(product.id, w);
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-gray-400 w-8 text-right font-bold",
															children: w
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-xs font-bold text-[#086e45] w-16 text-right",
															children: [formatBRL(price), !noDiscount && currentRule && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-[9px] text-green-600 ml-0.5",
																children: ["→", formatBRL(price * (1 - currentRule.discount))]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																	onClick: () => changeQty(product, w, -1),
																	disabled: qty === 0,
																	className: cn("h-7 w-7 rounded-full flex items-center justify-center transition-all border text-sm", qty > 0 ? "border-[#086e45] text-[#086e45] hover:bg-[#086e45] hover:text-white" : "border-gray-200 text-gray-300 cursor-not-allowed"),
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 12 })
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: cn("w-6 text-center text-sm font-black", qty > 0 ? "text-[#086e45]" : "text-gray-300"),
																	children: qty
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																	onClick: () => changeQty(product, w, 1),
																	className: "h-7 w-7 rounded-full flex items-center justify-center bg-[#086e45] text-white hover:bg-[#065a38] transition-colors",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 12 })
																})
															]
														})
													]
												}, w);
											})
										})
									]
								}, product.id);
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-72 flex flex-col shrink-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-4 pt-4 pb-2 border-b shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { size: 14 }),
										" Seu combo",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-auto text-[#086e45] font-black text-base",
											children: totalQty
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 overflow-y-auto px-4 py-3 space-y-2",
								children: items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "py-8 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-3xl mb-2",
										children: "🍱"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-gray-400",
										children: "Adicione marmitas ao seu combo"
									})]
								}) : items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-bold text-[#086e45] w-5 text-center shrink-0",
											children: [item.quantity, "×"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "truncate text-gray-800 font-medium leading-tight",
												children: item.nome
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-gray-400",
												children: item.weight
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-gray-600 shrink-0",
											children: formatBRL(item.preco * item.quantity)
										})
									]
								}, getItemKey(item.productId, item.weight)))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-4 pb-4 pt-3 border-t space-y-3 shrink-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5 text-xs",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-gray-500",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatBRL(subtotal) })]
											}),
											discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-green-600 font-bold",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													"Desconto (",
													(discountPct * 100).toFixed(0),
													"% nas marmitas)"
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["− ", formatBRL(discount)] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between font-black text-base text-gray-900 pt-1 border-t",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[#086e45]",
													children: formatBRL(total)
												})]
											})
										]
									}),
									items.some((i) => isNoDiscountLocal(i.categoria)) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-2 bg-blue-50 rounded-xl p-2.5 text-[10px] text-blue-700",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
											size: 12,
											className: "shrink-0 mt-0.5"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sopas e complementos têm preço fixo e não recebem desconto, mas contam na quantidade do combo." })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: handleAddToCart,
										disabled: items.length === 0,
										className: cn("w-full rounded-2xl py-3.5 text-sm font-black transition-all flex items-center justify-center gap-2", items.length > 0 ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg hover:shadow-[#086e45]/30" : "bg-gray-100 text-gray-400 cursor-not-allowed"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { size: 16 }),
											"Adicionar ao carrinho",
											totalQty > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bg-white/20 px-2 py-0.5 rounded-full text-xs",
												children: [totalQty, " itens"]
											})
										]
									})
								]
							})
						]
					})]
				})
			]
		})]
	});
}
function isComboProduct(product) {
	const cat = (product.categorias?.nome || product.categoria || "").toLowerCase();
	const nome = (product.nome || "").toLowerCase();
	return nome.includes("monte você mesmo") || nome.includes("monte voce mesmo") || nome.includes("escolha você mesmo") || nome.includes("escolha voce mesmo") || cat.includes("escolha você mesmo") || cat.includes("escolha voce mesmo");
}
function ProductCard({ product, allProducts = [] }) {
	const { add } = useCart();
	const [comboOpen, setComboOpen] = (0, import_react.useState)(false);
	const combo = isComboProduct(product);
	const getBadges = () => {
		const badges = [];
		if (product.nome?.toLowerCase().includes("melhor") || product.nome?.toLowerCase().includes("destaque")) badges.push({
			label: "Bestseller",
			color: "bg-tangerine",
			icon: TrendingUp
		});
		if (product.id % 7 === 0) badges.push({
			label: "Novo",
			color: "bg-accent",
			icon: Gift
		});
		if (product.preco_300g && product.preco_300g < product.preco * .9) badges.push({
			label: "-10%",
			color: "bg-destructive",
			icon: Flame
		});
		return badges.slice(0, 2);
	};
	const badges = getBadges();
	const weights = (() => {
		if (product.preco_300g || product.preco_400g) {
			const sizes = ["200g"];
			if (product.preco_300g) sizes.push("300g");
			if (product.preco_400g) sizes.push("400g");
			return sizes;
		}
		if (product.peso?.includes("-")) return product.peso.split("-").map((w) => w.trim());
		if (product.peso?.includes(",")) return product.peso.split(",").map((w) => w.trim());
		return product.peso ? [product.peso] : [];
	})();
	const [selectedWeight, setSelectedWeight] = (0, import_react.useState)(weights.includes("300g") ? "300g" : weights[0] || "");
	const isComboPronto = (product.categorias?.nome || product.categoria || "").toLowerCase().includes("combo pronto");
	const weightLabel = (w) => {
		if (!isComboPronto) return w;
		if (w === "200g") return "P";
		if (w === "300g") return "M";
		if (w === "400g") return "G";
		return w;
	};
	const currentPrice = product.categoria?.toLowerCase().includes("sopa") ? 18 : selectedWeight === "300g" && product.preco_300g ? product.preco_300g : selectedWeight === "400g" && product.preco_400g ? product.preco_400g : product.preco;
	const currentImage = (() => {
		if (selectedWeight === "200g" && product.imagem_200g) return product.imagem_200g;
		if (selectedWeight === "300g" && product.imagem_300g) return product.imagem_300g;
		if (selectedWeight === "400g" && product.imagem_400g) return product.imagem_400g;
		return product.imagem;
	})();
	selectedWeight === "300g" && product.tabela_nutricional_300g ? product.tabela_nutricional_300g : selectedWeight === "400g" && product.tabela_nutricional_400g ? product.tabela_nutricional_400g : product.tabela_nutricional;
	const handleAddToCart = (e) => {
		e?.stopPropagation();
		if (combo) {
			setComboOpen(true);
			return;
		}
		add(product.id, 1, selectedWeight);
		toast.success("Adicionado", {
			description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}`,
			className: "max-w-[280px] text-xs font-medium"
		});
	};
	if (combo) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		onClick: () => setComboOpen(true),
		className: "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition-all hover:shadow-lift hover:-translate-y-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-3 left-3 z-10 flex gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-gradient-sun/95 backdrop-blur-md text-white rounded-full px-3 py-1.5 text-[10px] font-black flex items-center gap-1.5 shadow-lg border border-white/40 uppercase tracking-wider",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "size-3.5" }), "Combo"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-4/3 overflow-hidden bg-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: product.imagem,
					alt: `Combo ${product.nome}`,
					loading: "lazy",
					width: 800,
					height: 600,
					className: "size-full object-cover transition-transform duration-500 group-hover:scale-110"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-full bg-white/95 p-3 text-primary shadow-lg backdrop-blur-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-6" })
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col gap-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-gradient-brand/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white border border-white/40 uppercase tracking-wider",
							children: product.categoria
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-bold font-mazzard leading-snug text-foreground group-hover:text-primary transition-colors",
						children: product.nome
					}), product.descricao && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground line-clamp-1",
						children: product.descricao
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex items-center justify-between pt-2 border-t border-border/30",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] font-black text-muted-foreground uppercase",
								children: "A partir de"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xl font-black text-primary bg-gradient-brand bg-clip-text text-transparent",
								children: formatBRL(product.preco)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: (e) => {
								e.stopPropagation();
								setComboOpen(true);
							},
							className: "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-4" }), " Montar"]
						})]
					})
				]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboBuilderModal, {
		isOpen: comboOpen,
		onClose: () => setComboOpen(false),
		combo: {
			id: product.id,
			nome: product.nome,
			descricao: product.descricao
		},
		products: allProducts
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/produto/$id",
		params: { id: String(product.id) },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition-all hover:shadow-lift hover:-translate-y-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute top-3 left-3 z-10 flex gap-2 flex-wrap",
					children: badges.map((badge, idx) => {
						const BadgeIcon = badge.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `${badge.color} text-white rounded-full px-3 py-1.5 text-[10px] font-black flex items-center gap-1.5 shadow-lg backdrop-blur-sm border border-white/30 animate-in fade-in slide-in-from-top-2 duration-500`,
							style: { animationDelay: `${idx * 100}ms` },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeIcon, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "uppercase tracking-wide",
								children: badge.label
							})]
						}, idx);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative aspect-4/3 overflow-hidden bg-muted group/thumb",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: currentImage,
							alt: `Marmita de ${product.nome}`,
							loading: "lazy",
							width: 800,
							height: 800,
							className: "size-full object-cover transition-transform duration-500 group-hover:scale-110"
						}),
						product.imagens && product.imagens.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-0 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-between px-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-white/90 p-1 rounded-full text-primary shadow-sm pointer-events-none",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 16 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-white/90 p-1 rounded-full text-primary shadow-sm pointer-events-none",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-full bg-white/95 p-3 text-primary shadow-lg backdrop-blur-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-6" })
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-1 flex-col gap-3 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-gradient-brand/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white border border-white/40 uppercase tracking-wider",
								children: product.categoria
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold font-mazzard leading-snug text-foreground group-hover:text-primary transition-colors",
							children: product.nome
						}) }),
						weights.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-1.5 flex-wrap",
							children: weights.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: (e) => {
									e.stopPropagation();
									setSelectedWeight(w);
								},
								className: cn("rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all", selectedWeight === w ? "bg-gradient-brand text-white shadow-md scale-105" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105 border border-border/50"),
								children: weightLabel(w)
							}, w))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] uppercase tracking-widest text-muted-foreground font-semibold",
							children: product.peso
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-auto flex items-center justify-between pt-2 border-t border-border/30",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] font-black text-muted-foreground uppercase",
									children: selectedWeight ? `${selectedWeight}` : "PREÇO"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xl font-black text-primary bg-gradient-brand bg-clip-text text-transparent",
									children: formatBRL(currentPrice)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleAddToCart,
								className: cn("inline-flex size-9 items-center justify-center rounded-full text-primary-foreground transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg bg-primary hover:bg-primary/90"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									className: "size-5",
									"aria-hidden": "true"
								})
							})]
						})
					]
				})
			]
		})
	}) });
}
function PromoCarousel({ banners }) {
	const [currentIndex, setCurrentIndex] = (0, import_react.useState)(0);
	const [autoPlay, setAutoPlay] = (0, import_react.useState)(true);
	const filteredBanners = banners.filter((b) => b?.image_url);
	(0, import_react.useEffect)(() => {
		if (!autoPlay || filteredBanners.length === 0) return;
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % filteredBanners.length);
		}, 5e3);
		return () => clearInterval(interval);
	}, [autoPlay, filteredBanners.length]);
	const goToPrevious = () => {
		setCurrentIndex((prev) => prev === 0 ? filteredBanners.length - 1 : prev - 1);
		setAutoPlay(false);
	};
	const goToNext = () => {
		setCurrentIndex((prev) => (prev + 1) % filteredBanners.length);
		setAutoPlay(false);
	};
	const goToSlide = (index) => {
		setCurrentIndex(index);
		setAutoPlay(false);
	};
	if (filteredBanners.length === 0) return null;
	const currentBanner = filteredBanners[currentIndex];
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full overflow-hidden rounded-xl group",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: currentBanner.image_url,
				alt: currentBanner.alt || "Banner promocional",
				loading: "eager",
				className: "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" }),
			filteredBanners.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: goToPrevious,
				onMouseEnter: () => setAutoPlay(false),
				className: "absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95",
				"aria-label": "Banner anterior",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur-sm hover:bg-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20 })
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: goToNext,
				onMouseEnter: () => setAutoPlay(false),
				className: "absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95",
				"aria-label": "Próximo banner",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur-sm hover:bg-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 20 })
				})
			})] }),
			filteredBanners.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2",
				children: filteredBanners.map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => goToSlide(index),
					className: cn("transition-all duration-300 rounded-full", currentIndex === index ? "w-6 h-2 bg-white shadow-lg" : "w-2 h-2 bg-white/40 hover:bg-white/60"),
					"aria-label": `Ir para banner ${index + 1}`
				}, index))
			}),
			filteredBanners.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-bold",
				children: [
					currentIndex + 1,
					" / ",
					filteredBanners.length
				]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full max-w-3xl mx-auto",
		children: currentBanner.link ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: currentBanner.link,
			className: "block rounded-xl overflow-hidden shadow-soft border border-border/30 bg-card h-[180px] md:h-[220px]",
			children: content
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "block rounded-xl overflow-hidden shadow-soft border border-border/30 bg-card h-[180px] md:h-[220px]",
			children: content
		})
	});
}
var STORAGE_KEY = "saborosamente.welcome_popup_dismissed";
function WelcomePopup({ config }) {
	const [visible, setVisible] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [naoMostrar, setNaoMostrar] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!config?.ativo) return;
		if (localStorage.getItem(STORAGE_KEY) === "true") return;
		const delay = (config.delay_segundos ?? 1) * 1e3;
		const timer = setTimeout(() => {
			setOpen(true);
			setTimeout(() => setVisible(true), 30);
		}, delay);
		return () => clearTimeout(timer);
	}, [config]);
	const fechar = () => {
		setVisible(false);
		setTimeout(() => {
			setOpen(false);
			if (naoMostrar) localStorage.setItem(STORAGE_KEY, "true");
		}, 300);
	};
	const handleBotao = (e) => {
		if (config.botao_link?.startsWith("#")) {
			e.preventDefault();
			fechar();
			setTimeout(() => {
				document.getElementById(config.botao_link.replace("#", ""))?.scrollIntoView({ behavior: "smooth" });
			}, 350);
		} else fechar();
	};
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("fixed inset-0 z-[9998] flex items-center justify-center px-4 transition-all duration-300", visible ? "opacity-100" : "opacity-0"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
			onClick: fechar
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl transition-all duration-300", visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: fechar,
					className: "absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors",
					"aria-label": "Fechar",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 16,
						className: "text-gray-600"
					})
				}),
				config.imagem_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full aspect-[4/3] overflow-hidden rounded-t-3xl bg-gray-100",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: config.imagem_url,
						alt: "Popup de boas-vindas",
						className: "w-full h-full object-cover"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-6 space-y-4",
					children: [
						config.titulo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-[#086e45] text-white rounded-2xl px-4 py-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-black text-sm leading-tight",
								children: config.titulo
							}), config.texto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-white/80 text-[11px] mt-1 leading-relaxed",
								children: config.texto
							})]
						}),
						config.itens && config.itens.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2",
							children: config.itens.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2.5 text-sm text-gray-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-5 w-5 rounded-full bg-[#086e45]/10 flex items-center justify-center shrink-0 mt-0.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										size: 11,
										className: "text-[#086e45]"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "leading-tight",
									children: item
								})]
							}, i))
						}),
						config.cupom_codigo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-[#086e45]/5 border border-[#086e45]/20 rounded-2xl p-4 text-center space-y-2",
							children: [
								config.cupom_texto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-gray-500",
									children: config.cupom_texto
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										navigator.clipboard.writeText(config.cupom_codigo).catch(() => {});
									},
									className: "bg-[#086e45] text-white font-black tracking-widest text-sm px-6 py-2.5 rounded-xl hover:bg-[#065a38] transition-colors w-full",
									children: config.cupom_codigo
								}),
								config.cupom_desconto && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-[#086e45] font-semibold",
									children: [
										"e ganhe ",
										config.cupom_desconto,
										"."
									]
								})
							]
						}),
						config.whatsapp && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `https://wa.me/${config.whatsapp.replace(/\D/g, "")}`,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#086e45] transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
								size: 16,
								className: "text-green-500"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [config.whatsapp_texto && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-medium",
								children: [config.whatsapp_texto, " "]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold",
								children: config.whatsapp
							})] })]
						}),
						config.botao_texto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: config.botao_link ?? "#cardapio",
							onClick: handleBotao,
							className: "block w-full text-center bg-[#086e45] text-white font-bold py-3 rounded-2xl hover:bg-[#065a38] transition-colors text-sm",
							children: config.botao_texto
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-center gap-2 text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: naoMostrar,
								onChange: (e) => setNaoMostrar(e.target.checked),
								className: "rounded accent-[#086e45]"
							}), "Não exibir mais esta mensagem."]
						})
					]
				})
			]
		})]
	});
}
function isComboEscolhaVoceMesmo(nome, cat) {
	const n = (nome || "").toLowerCase();
	const c = (cat || "").toLowerCase();
	return n.includes("monte você mesmo") || n.includes("monte voce mesmo") || n.includes("escolha você mesmo") || n.includes("escolha voce mesmo") || c.includes("escolha você mesmo") || c.includes("escolha voce mesmo");
}
function Index() {
	useNavigate();
	const [selectedCategory, setSelectedCategory] = (0, import_react.useState)("Todas");
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [comboModalOpen, setComboModalOpen] = (0, import_react.useState)(false);
	const { data: products = [], isLoading } = useQuery({
		queryKey: ["public-products-all"],
		queryFn: () => getPublicProducts(),
		staleTime: 1e3 * 60 * 30,
		gcTime: 1e3 * 60 * 60
	});
	const { data: orderedCategories = [] } = useQuery({
		queryKey: ["public-categories"],
		queryFn: async () => {
			const { data, error } = await supabase.from("categorias").select("id, nome, visivel_no_filtro, ordem_filtro").eq("visivel_no_filtro", true).order("ordem_filtro", { ascending: true }).order("ordem", { ascending: true });
			if (error) return [];
			return (data ?? []).filter((c) => !isComboEscolhaVoceMesmo(c.nome));
		},
		staleTime: 1e3 * 60
	});
	const { data: settings } = useQuery({
		queryKey: ["site-settings"],
		queryFn: async () => {
			const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
			if (error) throw error;
			return data;
		}
	});
	const promoBanners = Array.isArray(settings?.promo_banners) && settings.promo_banners.length > 0 ? settings.promo_banners : [];
	const filteredProducts = (0, import_react.useMemo)(() => {
		let result = products;
		if (selectedCategory !== "Todas") result = result.filter((p) => p.categorias?.nome === selectedCategory);
		if (searchTerm) {
			const search = searchTerm.toLowerCase();
			result = result.filter((p) => p.nome?.toLowerCase().includes(search) || p.descricao?.toLowerCase().includes(search) || p.categorias?.nome?.toLowerCase().includes(search));
		}
		return result.filter((p) => {
			const cat = p.categorias?.nome || "";
			return !isComboEscolhaVoceMesmo(p.nome || "", cat);
		}).sort((a, b) => {
			const catOrdemA = a.categorias?.ordem_filtro ?? 999;
			const catOrdemB = b.categorias?.ordem_filtro ?? 999;
			if (catOrdemA !== catOrdemB) return catOrdemA - catOrdemB;
			return (a.ordem ?? 999) - (b.ordem ?? 999);
		});
	}, [
		products,
		selectedCategory,
		searchTerm
	]);
	const categoriesWithProducts = (0, import_react.useMemo)(() => {
		if (orderedCategories.length > 0) return ["Todas", ...orderedCategories.map((c) => c.nome).filter((nome) => products.some((p) => p.categorias?.nome === nome))];
		const set = /* @__PURE__ */ new Set();
		products.forEach((p) => {
			if (p.categorias?.nome) {
				const cat = p.categorias.nome;
				if (!isComboEscolhaVoceMesmo("", cat)) set.add(cat);
			}
		});
		return ["Todas", ...Array.from(set).sort()];
	}, [products, orderedCategories]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		settings?.popup_boas_vindas?.ativo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WelcomePopup, { config: settings.popup_boas_vindas }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "relative overflow-hidden pt-16 pb-4 md:pt-20 md:pb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 -z-10 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-gradient-to-br from-primary/6 via-lime/4 to-transparent blur-3xl" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-4xl px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center mb-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-2xl md:text-3xl font-pacifico leading-[1.2] text-foreground",
						children: "Comida de Verdade,"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block mt-0.5 text-lg md:text-2xl font-mazzard font-black bg-gradient-brand bg-clip-text text-transparent leading-[1.2]",
						children: "Pronta Quando Você Quiser"
					})] })
				}), promoBanners.filter((b) => b?.image_url).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromoCarousel, { banners: promoBanners })]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "py-5 md:py-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-5xl px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2",
					children: [
						{
							Icon: Timer,
							line1: "PRONTO EM ATÉ",
							line2: "7 MINUTOS"
						},
						{
							Icon: ShieldCheck,
							line1: "6 MESES DE",
							line2: "VALIDADE",
							number: "6"
						},
						{
							Icon: Leaf,
							line1: "TEMPEROS 100%",
							line2: "NATURAIS"
						},
						{
							Icon: WheatOff,
							line1: "OPÇÕES SEM",
							line2: "GLÚTEN E LACTOSE"
						},
						{
							Icon: ChefHat,
							line1: "CRIADAS POR",
							line2: "CHEFS E NUTRIS"
						},
						{
							Icon: MapPin,
							line1: "ENTREGA",
							line2: "REGIONAL"
						},
						{
							Icon: Truck,
							line1: "DELIVERY OU",
							line2: "RETIRADA"
						},
						{
							Icon: Calendar,
							line1: "PEDIDOS",
							line2: "24H"
						}
					].map((card, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-primary rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1.5 shadow-sm min-h-[90px]",
						children: [card.number ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-3xl font-black text-white leading-none",
							children: card.number
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(card.Icon, {
							className: "size-6 text-white",
							strokeWidth: 1.5
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[8px] md:text-[9px] font-extrabold text-white/90 uppercase leading-tight tracking-wide",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: card.line1 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: card.line2 })]
						})]
					}, i))
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			id: "cardapio",
			className: "mx-auto max-w-7xl px-4 py-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col lg:flex-row gap-6 items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full lg:w-80 lg:sticky lg:top-24 space-y-4 shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-display font-black text-foreground leading-tight",
								children: "Nosso Cardápio"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground leading-relaxed",
								children: "Escolha suas marmitas favoritas e monte seu combo com desconto progressivo."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscountProgressWidget, { className: "mb-6" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2 max-h-[70vh] overflow-y-auto pr-3 no-scrollbar",
							children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-8 flex justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "animate-spin text-primary/30",
									size: 24
								})
							}) : categoriesWithProducts.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setSelectedCategory(cat),
								className: cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all border duration-200", selectedCategory === cat ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" : "bg-card text-foreground border-border/30 hover:border-primary/50 hover:bg-primary/5"),
								children: cat
							}, cat))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-3xl md:text-4xl font-display font-black text-foreground",
									children: searchTerm ? `Buscando "${searchTerm}"` : selectedCategory === "Todas" ? "Todos os Produtos" : selectedCategory
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted-foreground",
									children: searchTerm ? `Encontramos ${filteredProducts.length} opção${filteredProducts.length !== 1 ? "s" : ""}.` : selectedCategory === "Todas" ? `${filteredProducts.length} produtos disponíveis` : `${filteredProducts.length} opção${filteredProducts.length !== 1 ? "s" : ""}`
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 min-w-0 lg:min-w-80",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: (e) => {
										e.preventDefault();
										const q = new FormData(e.currentTarget).get("q");
										setSearchTerm(q || "");
									},
									className: "flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-border/30 shadow-sm flex-1 focus-within:ring-2 focus-within:ring-primary/20",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										autoFocus: true,
										name: "q",
										type: "text",
										placeholder: "Buscar...",
										value: searchTerm,
										onChange: (e) => setSearchTerm(e.target.value),
										className: "flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "text-primary hover:text-primary/80 transition-colors",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { size: 18 })
									})]
								}), searchTerm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setSearchTerm(""),
									className: "text-sm font-bold text-primary hover:text-primary/80 transition-colors",
									title: "Limpar busca",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
								})]
							})]
						})
					}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center py-24 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "animate-spin text-primary",
							size: 40
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground text-base font-medium",
							children: "Carregando cardápio..."
						})]
					}) : filteredProducts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-24 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-5xl mb-3",
								children: "🔍"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground text-base font-medium",
								children: "Nenhum produto encontrado."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setSearchTerm("");
									setSelectedCategory("Todas");
								},
								className: "mt-4 text-sm font-bold text-primary hover:underline",
								children: "Ver todos os produtos"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						selectedCategory === "Todas" && !searchTerm && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onClick: () => setComboModalOpen(true),
							className: "cursor-pointer mb-8 rounded-2xl overflow-hidden relative group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-brand opacity-95" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute inset-0 overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform duration-700" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/10 blur-2xl" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 px-6 md:px-8 py-6 md:py-8 text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center md:text-left flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { size: 11 }), "Desconto progressivo"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-xl md:text-2xl font-display font-black leading-tight",
												children: "Monte seu Combo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-white/70 max-w-sm text-xs leading-relaxed",
												children: "Quanto mais marmitas, maior o desconto. Automático e sem código."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex flex-wrap gap-2 mt-3",
												children: [
													{
														qty: "6+",
														pct: "5%"
													},
													{
														qty: "10+",
														pct: "8%"
													},
													{
														qty: "15+",
														pct: "12%"
													}
												].map((tier) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 bg-white/10 border border-white/15 rounded-md px-2 py-1 text-[10px] font-bold",
													children: [
														tier.qty,
														" → ",
														tier.pct,
														" off"
													]
												}, tier.qty))
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: (e) => {
											e.stopPropagation();
											setComboModalOpen(true);
										},
										className: "shrink-0 flex items-center gap-2 bg-sun text-sun-foreground font-bold px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { size: 16 }), "Montar Combo"]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-8",
							children: selectedCategory === "Todas" ? Array.from(new Map(filteredProducts.map((p) => [p.categorias?.nome || "Marmita", p])).entries()).map(([category, _], categoryIndex) => {
								const categoryProducts = filteredProducts.filter((p) => (p.categorias?.nome || "Marmita") === category);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									categoryIndex > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-6 border-t border-border/30" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-lg font-bold text-primary mb-4 uppercase tracking-wide",
										children: category
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
										children: categoryProducts.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
											product: {
												...product,
												categoria: product.categorias?.nome || "Marmita",
												imagem: product.imagem_url
											},
											allProducts: products.map((p) => ({
												...p,
												categoria: p.categorias?.nome || "Marmita",
												imagem: p.imagem_url
											}))
										}, product.id))
									})
								] }, category);
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
								children: filteredProducts.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
									product: {
										...product,
										categoria: product.categorias?.nome || "Marmita",
										imagem: product.imagem_url
									},
									allProducts: products.map((p) => ({
										...p,
										categoria: p.categorias?.nome || "Marmita",
										imagem: p.imagem_url
									}))
								}, product.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComboBuilderModal, {
							isOpen: comboModalOpen,
							onClose: () => setComboModalOpen(false),
							combo: {
								id: "combo-global",
								nome: "Monte seu Combo"
							},
							products: products.filter((p) => {
								const cat = p.categorias?.nome || "";
								return !isComboEscolhaVoceMesmo(p.nome || "", cat);
							}).map((p) => ({
								...p,
								categoria: p.categorias?.nome || "Marmita",
								imagem: p.imagem_url
							}))
						})
					] })]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mx-auto max-w-4xl px-4 py-6 md:py-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative rounded-2xl overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-brand opacity-[0.97]" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/10 blur-3xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 px-6 md:px-10 py-8 md:py-10 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-center gap-6 md:gap-10 mb-6 text-white",
								children: [
									{
										value: "7min",
										label: "preparo"
									},
									{
										value: "6 meses",
										label: "validade"
									},
									{
										value: "0",
										label: "conservantes"
									}
								].map((stat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg md:text-xl font-black premium-stat",
										children: stat.value
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[9px] text-white/55 uppercase tracking-wider font-medium",
										children: stat.label
									})]
								}, i))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl md:text-2xl font-display font-black text-white leading-tight",
								children: "Facilite sua rotina alimentar"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-white/65 max-w-sm mx-auto",
								children: "Escolha, receba e tenha refeições saudáveis todos os dias."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex flex-row items-center justify-center gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "#cardapio",
									onClick: (e) => {
										e.preventDefault();
										document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
									},
									className: "inline-flex items-center gap-2 bg-sun text-sun-foreground px-5 py-2.5 rounded-full font-bold text-xs shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.04]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { size: 14 }), "Ver Cardápio →"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "https://wa.me/5547991507757?text=Olá! Gostaria de fazer um pedido.",
									target: "_blank",
									rel: "noopener noreferrer",
									className: "inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-white/25 transition-all duration-300",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
										className: "size-3.5",
										viewBox: "0 0 24 24",
										fill: "currentColor",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" })
									}), "WhatsApp"]
								})]
							})
						]
					})
				]
			})
		})
	] });
}
//#endregion
export { Index as component };
