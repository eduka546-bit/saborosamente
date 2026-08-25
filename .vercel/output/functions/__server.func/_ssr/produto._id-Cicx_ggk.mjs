import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Gt as ChevronLeft, T as Star, Wt as ChevronRight, an as ArrowLeft, ct as LoaderCircle, k as ShoppingCart } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { i as getOptimizedImageUrl, n as generateSizes, r as generateSrcSet } from "./image-optimizer-CaY-Ei4u.mjs";
import { i as useCart, r as formatBRL } from "./cart-h8rxrb6o.mjs";
import { t as Route } from "./produto._id-9d6riWoq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/produto._id-Cicx_ggk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Componente de imagem otimizada com:
* - Lazy loading por padrão
* - Srcset responsivo
* - Suporte a WebP com fallback JPEG
* - Sizes atributo para melhor performance
*/
function OptimizedImage({ src, alt, widths = [
	320,
	640,
	1024
], priority = false, loading = priority ? "eager" : "lazy", sizes, className, ...props }) {
	if (!src) return null;
	getOptimizedImageUrl(src, void 0, "webp");
	const jpegUrl = getOptimizedImageUrl(src, void 0, "jpeg");
	const srcSet = generateSrcSet(src, widths);
	const calculatedSizes = sizes || generateSizes();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("picture", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
			srcSet,
			sizes: calculatedSizes,
			type: "image/webp"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
			srcSet,
			sizes: calculatedSizes,
			type: "image/jpeg"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: jpegUrl,
			alt,
			loading,
			sizes: calculatedSizes,
			className,
			width: props.width,
			height: props.height,
			...props
		})
	] });
}
function ProdutoPage() {
	const { id } = Route.useParams();
	const navigate = Route.useNavigate();
	const { add } = useCart();
	const [selectedWeight, setSelectedWeight] = (0, import_react.useState)("");
	const [currentImageIndex, setCurrentImageIndex] = (0, import_react.useState)(0);
	const { data: product, isLoading, error } = useQuery({
		queryKey: ["produto", id],
		queryFn: async () => {
			const { data, error } = await supabase.from("produtos").select("*, categorias(nome, ordem_filtro)").eq("id", id).single();
			if (error) throw error;
			return data;
		}
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-primary",
				size: 48
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground",
				children: "Carregando produto..."
			})]
		})
	});
	if (error || !product) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-7xl px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center gap-4 py-24",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-5xl",
					children: "🔍"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-foreground",
					children: "Produto não encontrado"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "O produto que você procura não existe."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "default",
						className: "gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 16 }), "Voltar para Início"]
					})
				})
			]
		})
	});
	const weights = (() => {
		if (product.preco_300g || product.preco_400g) {
			const sizes = ["200g"];
			if (product.preco_300g) sizes.push("300g");
			if (product.preco_400g) sizes.push("400g");
			if (!selectedWeight) setSelectedWeight(sizes.includes("300g") ? "300g" : sizes[0]);
			return sizes;
		}
		if (product.peso?.includes("-")) return product.peso.split("-").map((w) => w.trim());
		if (product.peso?.includes(",")) return product.peso.split(",").map((w) => w.trim());
		if (!selectedWeight && product.peso) setSelectedWeight(product.peso);
		return product.peso ? [product.peso] : [];
	})();
	const rating = product.rating ?? (product.id % 2 === 0 ? 5 : 4.9);
	const allImages = [product.imagem_url];
	if (product.imagens && Array.isArray(product.imagens)) allImages.push(...product.imagens);
	const currentImage = allImages[currentImageIndex];
	const currentPrice = product.categorias?.nome?.toLowerCase().includes("sopa") ? 18 : selectedWeight === "300g" && product.preco_300g ? product.preco_300g : selectedWeight === "400g" && product.preco_400g ? product.preco_400g : product.preco;
	const currentNutritional = selectedWeight === "300g" && product.tabela_nutricional_300g ? product.tabela_nutricional_300g : selectedWeight === "400g" && product.tabela_nutricional_400g ? product.tabela_nutricional_400g : product.tabela_nutricional;
	const handleAddToCart = () => {
		add(product.id, 1, selectedWeight);
		toast.success("Adicionado ao carrinho!", { description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}` });
	};
	const isComboPronto = product.categorias?.nome?.toLowerCase().includes("combo pronto");
	const weightLabel = (w) => {
		if (!isComboPronto) return w;
		if (w === "200g") return "P";
		if (w === "300g") return "M";
		if (w === "400g") return "G";
		return w;
	};
	const nextImage = () => {
		setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
	};
	const prevImage = () => {
		setCurrentImageIndex((prev) => prev === 0 ? allImages.length - 1 : prev - 1);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 flex items-center gap-2 text-sm text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "hover:text-foreground transition-colors",
						children: "Home"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "hover:text-foreground transition-colors",
						children: "Cardápio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-foreground font-medium",
						children: product.nome
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => navigate({ to: "/" }),
				className: "mb-6 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 18 }), "Voltar"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-12 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative aspect-square rounded-2xl overflow-hidden bg-muted group",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptimizedImage, {
								src: currentImage,
								alt: product.nome,
								widths: [512, 1024],
								priority: false,
								className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								className: "absolute left-4 top-4 bg-sun text-sun-foreground hover:bg-sun z-10",
								children: product.categorias?.nome || "Marmita"
							}),
							allImages.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: prevImage,
									className: "absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-all hover:bg-white hover:scale-110",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: nextImage,
									className: "absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-all hover:bg-white hover:scale-110",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 20 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2",
									children: allImages.map((_, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setCurrentImageIndex(idx),
										className: cn("transition-all duration-300 rounded-full", currentImageIndex === idx ? "w-6 h-2 bg-white shadow-lg" : "w-2 h-2 bg-white/40 hover:bg-white/60")
									}, idx))
								})
							] })
						]
					}), allImages.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-5 gap-2",
						children: allImages.map((img, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setCurrentImageIndex(idx),
							className: cn("aspect-square rounded-lg overflow-hidden border-2 transition-all", currentImageIndex === idx ? "border-primary shadow-md scale-105" : "border-border/30 opacity-60 hover:opacity-100"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptimizedImage, {
								src: img,
								alt: `${product.nome} ${idx + 1}`,
								widths: [100],
								className: "w-full h-full object-cover"
							})
						}, idx))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-4xl font-bold text-foreground mb-2",
								children: product.nome
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex gap-0.5",
										children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `size-4 transition-colors ${i < Math.floor(rating) ? "fill-sun text-sun" : i < Math.ceil(rating) && rating % 1 !== 0 ? "fill-sun/50 text-sun" : "text-border"}` }, i))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-foreground",
										children: rating.toFixed(1)
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-bold text-muted-foreground uppercase tracking-wider",
									children: product.categorias?.nome || "Marmita"
								})]
							}),
							product.descricao && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-muted-foreground leading-relaxed",
								children: product.descricao
							})
						] }),
						weights.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-bold text-foreground mb-3 uppercase tracking-wide",
							children: "Escolha o tamanho:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-3",
							children: weights.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setSelectedWeight(w),
								className: cn("rounded-xl border-2 py-4 text-sm font-bold transition-all", selectedWeight === w ? "border-primary bg-primary/5 text-primary shadow-md" : "border-border bg-background text-muted-foreground hover:border-primary/30"),
								children: weightLabel(w)
							}, w))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold text-foreground uppercase tracking-wide",
								children: "Valor Nutricional"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: currentNutritional?.kcal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Calorias:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold text-primary",
												children: [currentNutritional.kcal, " kcal"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Carboidratos:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold",
												children: [currentNutritional.carb, "g"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Proteína:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-bold",
												children: [currentNutritional.prot, "g"]
											})]
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground italic",
									children: "Consulte a embalagem para detalhes"
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-xs font-bold text-foreground mb-2",
									children: "Informações"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: product.informacao_nutricional || "Sem Glúten | Sem Lactose"
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4 border-t border-border/30 pt-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-baseline gap-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-bold text-muted-foreground uppercase",
										children: ["Valor por ", selectedWeight || "porção"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-between",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-4xl font-black text-primary bg-gradient-brand bg-clip-text text-transparent",
										children: formatBRL(currentPrice)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleAddToCart,
									className: "w-full h-14 rounded-xl text-lg font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-5" }), "Adicionar ao Carrinho"]
								})
							]
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { ProdutoPage as component };
