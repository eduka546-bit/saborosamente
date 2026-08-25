import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { H as Plus, Z as Minus, _ as Trash2 } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useCart, r as formatBRL } from "./cart-B26u01-I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/carrinho-B-phPRT5.js
var import_jsx_runtime = require_jsx_runtime();
function Carrinho() {
	const { lines, subtotal, discount, shipping, total, count, selectedCity, setSelectedCity, selectedBairro, setSelectedBairro, taxas, setQuantity, remove, clear } = useCart();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-6xl px-4 py-14",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-4xl font-extrabold",
			children: "Seu carrinho"
		}), lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg font-semibold",
					children: "Seu carrinho está vazio"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Escolha suas marmitas favoritas e volte aqui para finalizar."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					hash: "cardapio",
					className: "mt-6 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground",
					children: "Ver catálogo"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-4",
				children: [lines.map(({ product, quantity, weight, subtotal: lineTotal }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: product.imagem,
							alt: product.nome,
							loading: "lazy",
							width: 800,
							height: 800,
							className: "size-24 rounded-2xl object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-semibold",
									children: product.nome
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										weight || product.peso,
										" • ",
										formatBRL(product.preco),
										" cada"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1 rounded-full border border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												"aria-label": `Diminuir quantidade de ${product.nome}`,
												onClick: () => setQuantity(product.id, quantity - 1, weight),
												className: "grid size-8 place-items-center rounded-full hover:bg-secondary",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
													className: "size-4",
													"aria-hidden": "true"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-6 text-center text-sm font-semibold",
												children: quantity
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												"aria-label": `Aumentar quantidade de ${product.nome}`,
												onClick: () => setQuantity(product.id, quantity + 1, weight),
												className: "grid size-8 place-items-center rounded-full hover:bg-secondary",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
													className: "size-4",
													"aria-hidden": "true"
												})
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => remove(product.id, weight),
										className: "inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
											className: "size-3.5",
											"aria-hidden": "true"
										}), " Remover"]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-base font-bold text-primary",
							children: formatBRL(lineTotal)
						})
					]
				}, product.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: clear,
					className: "text-xs font-medium text-muted-foreground hover:text-destructive",
					children: "Limpar carrinho"
				}) })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "h-fit rounded-3xl border border-border bg-card p-6 shadow-soft",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Resumo do pedido"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-semibold text-muted-foreground uppercase",
								children: "Cidade"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: selectedCity,
								onChange: (e) => {
									setSelectedCity(e.target.value);
									setSelectedBairro("");
								},
								className: "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Selecione..."
								}), [...new Set(taxas.map((t) => t.cidade))].sort().map((city) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: city,
									children: city
								}, city))]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-semibold text-muted-foreground uppercase",
								children: "Bairro"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: selectedBairro,
								onChange: (e) => setSelectedBairro(e.target.value),
								disabled: !selectedCity,
								className: "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Selecione..."
								}), taxas.filter((t) => t.cidade === selectedCity).sort((a, b) => a.bairro.localeCompare(b.bairro)).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: t.bairro,
									children: t.bairro
								}, t.id))]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-5 space-y-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "Subtotal"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: formatBRL(subtotal)
								})]
							}),
							discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-brand-dark",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-primary font-semibold",
									children: "Desconto Progressivo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
									className: "font-bold",
									children: ["-", formatBRL(discount)]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "Entrega"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-medium",
									children: shipping === 0 ? "Grátis" : formatBRL(shipping)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between border-t border-border pt-3 text-base",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "font-semibold",
									children: "Total"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-bold text-primary",
									children: formatBRL(total)
								})]
							})
						]
					}),
					selectedCity.toLowerCase().includes("são bento do sul") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-xs font-semibold uppercase tracking-wider",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Progresso Frete Reduzido (R$ 5,00)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-primary",
									children: [Math.min(100, Math.max(subtotal / 70 * 100, count / 5 * 100)).toFixed(0), "%"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-2 w-full overflow-hidden rounded-full bg-secondary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-primary transition-all duration-500 ease-out",
									style: { width: `${Math.min(100, Math.max(subtotal / 70 * 100, count / 5 * 100))}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] text-muted-foreground italic",
								children: "* Válido para pedidos acima de R$ 70,00 ou 5 itens."
							})
						]
					}),
					selectedCity.toLowerCase().includes("são bento do sul") && shipping !== 0 && subtotal < 70 && count < 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground",
						children: "Dica: Pedidos acima de R$ 70 ou 5 itens baixam o frete para R$ 5,00 em SBS!"
					}),
					!selectedCity.toLowerCase().includes("são bento do sul") && selectedCity !== "" && subtotal < 70 && count < 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive",
						children: "Pedido mínimo de R$ 70,00 ou 5 unidades para esta cidade."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/checkout",
						disabled: selectedCity !== "" && !selectedCity.toLowerCase().includes("são bento do sul") && subtotal < 70 && count < 5,
						className: cn("mt-6 flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-dark", selectedCity !== "" && !selectedCity.toLowerCase().includes("são bento do sul") && subtotal < 70 && count < 5 && "opacity-50 pointer-events-none"),
						children: "Finalizar pedido"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 rounded-3xl bg-primary/5 p-6 border-2 border-primary/10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-primary animate-pulse" }), "Desconto Progressivo"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md",
									children: [
										count,
										" ",
										count === 1 ? "item" : "itens"
									]
								})]
							}),
							(() => {
								const tiers = [
									{
										minItems: 5,
										discount: 3
									},
									{
										minItems: 10,
										discount: 5
									},
									{
										minItems: 20,
										discount: 7
									}
								];
								const nextTier = tiers.find((t) => count < t.minItems);
								const currentTier = [...tiers].reverse().find((t) => count >= t.minItems);
								if (!nextTier && currentTier) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-xs font-bold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-primary-dark uppercase",
											children: "Parabéns! Desconto máximo atingido!"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-primary",
											children: "7% OFF"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-full rounded-full bg-primary shadow-inner" })]
								});
								if (nextTier) {
									const itemsNeeded = nextTier.minItems - count;
									const prevGoal = tiers.find((t, i) => tiers[i + 1]?.minItems === nextTier.minItems)?.minItems || 0;
									const range = nextTier.minItems - prevGoal;
									const progress = (count - prevGoal) / range * 100;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-[11px] font-bold uppercase tracking-tight",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-muted-foreground",
													children: [
														"Faltam ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-primary",
															children: itemsNeeded
														}),
														" ",
														itemsNeeded === 1 ? "marmita" : "marmitas"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-primary-dark",
													children: [
														"Para ganhar ",
														nextTier.discount,
														"% OFF"
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-3 w-full overflow-hidden rounded-full bg-white border border-primary/20 p-[2px]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full bg-primary transition-all duration-700 ease-out rounded-full shadow-sm",
													style: { width: `${Math.min(100, Math.max(0, progress))}%` }
												})
											}),
											currentTier && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[10px] text-center font-bold text-primary italic",
												children: [
													"* Você já tem ",
													currentTier.discount,
													"% de desconto aplicado!"
												]
											})
										]
									});
								}
								return null;
							})(),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 grid grid-cols-3 gap-2",
								children: [
									{
										q: 5,
										d: 3
									},
									{
										q: 10,
										d: 5
									},
									{
										q: 20,
										d: 7
									}
								].map((tier) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("flex flex-col items-center justify-center p-2 rounded-2xl border transition-all", count >= tier.q ? "bg-primary text-white border-primary shadow-md scale-105 z-10" : "bg-white text-muted-foreground border-border opacity-70"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] font-black",
										children: [tier.q, " UNID."]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-black",
										children: [tier.d, "% OFF"]
									})]
								}, tier.q))
							})
						]
					})
				]
			})]
		})]
	});
}
//#endregion
export { Carrinho as component };
