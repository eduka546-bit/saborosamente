import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, Dt as DollarSign, F as Search, Rt as CircleCheck, St as Eye, ct as LoaderCircle, i as X, k as ShoppingCart, z as RefreshCw } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as formatDistanceToNow, o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/carrinhos-abandonados-Hzyx5aBf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_COLORS = {
	abandonado: "bg-red-100 text-red-700",
	recuperado: "bg-yellow-100 text-yellow-700",
	convertido: "bg-green-100 text-green-700"
};
function ItemsPreview({ itens }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1 text-xs text-gray-600",
		children: [itens.slice(0, 3).map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				item.imagem && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: item.imagem,
					className: "h-6 w-6 rounded object-cover border shrink-0",
					alt: ""
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate max-w-[160px]",
					children: item.nome ?? item.productId
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-gray-400 shrink-0",
					children: ["×", item.quantity]
				})
			]
		}, i)), itens.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-gray-400",
			children: [
				"+",
				itens.length - 3,
				" mais"
			]
		})]
	});
}
function AdminCarrinhosAbandonadosPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("todos");
	const [selectedCarrinho, setSelectedCarrinho] = (0, import_react.useState)(null);
	const { data = [], isLoading } = useQuery({
		queryKey: ["carrinhos-abandonados-admin"],
		queryFn: async () => {
			const { data, error } = await supabase.from("carrinhos_abandonados").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		},
		refetchInterval: 3e4
	});
	const markRecuperadoMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("carrinhos_abandonados").update({ status: "recuperado" }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["carrinhos-abandonados-admin"] });
			toast.success("Marcado como recuperado!");
		}
	});
	const filtered = (0, import_react.useMemo)(() => data.filter((c) => {
		const matchStatus = filterStatus === "todos" || c.status === filterStatus;
		const matchSearch = !search || c.nome?.toLowerCase().includes(search.toLowerCase()) || c.telefone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase());
		return matchStatus && matchSearch;
	}), [
		data,
		search,
		filterStatus
	]);
	const stats = (0, import_react.useMemo)(() => {
		const total = data.length;
		const abandonados = data.filter((c) => c.status === "abandonado").length;
		const convertidos = data.filter((c) => c.status === "convertido").length;
		return {
			total,
			abandonados,
			convertidos,
			valorPerdido: data.filter((c) => c.status === "abandonado").reduce((s, c) => s + (c.valor_total ?? 0), 0),
			taxaConversao: total > 0 ? (convertidos / total * 100).toFixed(1) : "0"
		};
	}, [data]);
	const buildWhatsAppUrl = (carrinho) => {
		const phone = carrinho.telefone?.replace(/\D/g, "");
		if (!phone) return null;
		const itens = carrinho.itens.map((i) => `• ${i.nome ?? i.productId} ×${i.quantity}`).join("\n");
		const coupon = carrinho.cupom_oferta ? `\n\n🎟️ Use o cupom *${carrinho.cupom_oferta}* para 10% OFF!` : "";
		return `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá${carrinho.nome ? `, ${carrinho.nome}` : ""}! 👋\n\nVimos que você deixou itens no carrinho da Saborosamente:\n\n${itens}\n\n💰 Total: R$ ${Number(carrinho.valor_total).toFixed(2)}${coupon}\n\nPosso te ajudar a finalizar o pedido? 😊`)}`;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Carrinhos Abandonados"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Recupere vendas perdidas entrando em contato com clientes via WhatsApp."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, {
								size: 16,
								className: "text-gray-400"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-gray-400",
								children: "Total"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-black text-gray-900",
							children: stats.total
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-4 border-red-100",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								size: 16,
								className: "text-red-400"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-red-400",
								children: "Abandonados"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-black text-red-500",
							children: stats.abandonados
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-4 border-green-100",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
									size: 16,
									className: "text-green-500"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold uppercase text-green-500",
									children: "Convertidos"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-2xl font-black text-green-600",
								children: stats.convertidos
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-green-400",
								children: [stats.taxaConversao, "% taxa"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-4 border-orange-100",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, {
								size: 16,
								className: "text-orange-400"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-orange-400",
								children: "Valor perdido"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-2xl font-black text-orange-500",
							children: ["R$ ", stats.valorPerdido.toFixed(2).replace(".", ",")]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 min-w-[200px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
							size: 16
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Buscar por nome, telefone ou e-mail...",
							className: "pl-9",
							value: search,
							onChange: (e) => setSearch(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: [
							"todos",
							"abandonado",
							"recuperado",
							"convertido"
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilterStatus(s),
							className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${filterStatus === s ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-500 hover:border-[#5850ec]"}`,
							children: s === "todos" ? "Todos" : s
						}, s))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "gap-2",
						onClick: () => queryClient.invalidateQueries({ queryKey: ["carrinhos-abandonados-admin"] }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 14 }), " Atualizar"]
					})
				]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border border-dashed p-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, {
					size: 48,
					className: "mx-auto text-gray-200 mb-4"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-400 font-medium",
					children: "Nenhum carrinho encontrado."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Itens"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Valor"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Cupom"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Há quanto tempo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 text-center",
								children: "Ações"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y",
						children: filtered.map((c) => {
							const waUrl = buildWhatsAppUrl(c);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-gray-50 transition-colors",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-6 py-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-bold text-gray-900",
												children: c.nome ?? "Anônimo"
											}),
											c.telefone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-gray-400",
												children: c.telefone
											}),
											c.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-gray-400",
												children: c.email
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4",
										children: Array.isArray(c.itens) && c.itens.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemsPreview, { itens: c.itens }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-gray-400",
											children: "—"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-6 py-4 font-bold text-green-600",
										children: ["R$ ", Number(c.valor_total).toFixed(2).replace(".", ",")]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4",
										children: c.cupom_oferta ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-black tracking-widest text-[#5850ec] bg-[#5850ec]/10 px-2 py-1 rounded-lg",
											children: c.cupom_oferta
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-gray-300",
											children: "—"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-500"}`,
											children: c.status
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 text-gray-400 text-xs",
										children: formatDistanceToNow(new Date(c.created_at), {
											locale: ptBR,
											addSuffix: true
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 justify-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												className: "h-8 w-8 text-gray-400 hover:text-[#5850ec]",
												title: "Ver detalhes",
												onClick: () => setSelectedCarrinho(c),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 15 })
											}), waUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: waUrl,
												target: "_blank",
												rel: "noopener noreferrer",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													size: "icon",
													className: "h-8 w-8 bg-green-500 hover:bg-green-600 text-white",
													title: "Enviar mensagem no WhatsApp",
													onClick: () => {
														if (c.status === "abandonado") markRecuperadoMutation.mutate(c.id);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 15 })
												})
											})]
										})
									})
								]
							}, c.id);
						})
					})]
				})
			}),
			selectedCarrinho && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-end z-50",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white h-full w-full max-w-md p-6 overflow-y-auto animate-in slide-in-from-right duration-300",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold text-[#5850ec]",
							children: "Detalhes do Carrinho"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							onClick: () => setSelectedCarrinho(null),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-gray-50 rounded-2xl p-4 space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-bold text-gray-900",
										children: selectedCarrinho.nome ?? "Anônimo"
									}),
									selectedCarrinho.telefone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-gray-500",
										children: ["📞 ", selectedCarrinho.telefone]
									}),
									selectedCarrinho.email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-gray-500",
										children: ["✉️ ", selectedCarrinho.email]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-gray-400 pt-1",
										children: format(new Date(selectedCarrinho.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-gray-400 mb-3",
								children: "Itens no carrinho"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2",
								children: selectedCarrinho.itens.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 bg-white rounded-xl border p-3",
									children: [
										item.imagem && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: item.imagem,
											className: "h-10 w-10 rounded-lg object-cover border",
											alt: ""
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-semibold text-gray-900 truncate",
												children: item.nome ?? item.productId
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-gray-400",
												children: [
													item.quantity,
													"× — R$ ",
													Number(item.preco ?? 0).toFixed(2)
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm font-bold text-green-600",
											children: ["R$ ", Number(item.subtotal ?? 0).toFixed(2)]
										})
									]
								}, i))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t pt-4 flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-gray-700",
									children: "Total"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xl font-black text-[#5850ec]",
									children: ["R$ ", Number(selectedCarrinho.valor_total).toFixed(2).replace(".", ",")]
								})]
							}),
							selectedCarrinho.cupom_oferta && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-[#5850ec]/5 rounded-xl p-3 text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-gray-500 mb-1",
									children: "Cupom gerado pelo exit intent"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-black tracking-widest text-[#5850ec]",
									children: selectedCarrinho.cupom_oferta
								})]
							}),
							buildWhatsAppUrl(selectedCarrinho) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: buildWhatsAppUrl(selectedCarrinho),
								target: "_blank",
								rel: "noopener noreferrer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "w-full bg-green-500 hover:bg-green-600 text-white gap-2",
									onClick: () => {
										if (selectedCarrinho.status === "abandonado") markRecuperadoMutation.mutate(selectedCarrinho.id);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 16 }), "Entrar em contato via WhatsApp"]
								})
							}),
							selectedCarrinho.status === "abandonado" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								className: "w-full gap-2",
								onClick: () => {
									markRecuperadoMutation.mutate(selectedCarrinho.id);
									setSelectedCarrinho({
										...selectedCarrinho,
										status: "recuperado"
									});
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
									size: 16,
									className: "text-yellow-500"
								}), "Marcar como recuperado (sem WA)"]
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { AdminCarrinhosAbandonadosPage as component };
