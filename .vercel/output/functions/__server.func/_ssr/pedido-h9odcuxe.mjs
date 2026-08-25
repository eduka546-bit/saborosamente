import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { F as Search, Ft as CircleX, Rt as CircleCheck, Y as Package, jt as Clock, p as Truck, rt as MapPin } from "../_libs/lucide-react.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
import { t as Route } from "./pedido-D3ThksIl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pedido-h9odcuxe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Calcula o percentual de progresso do pedido
*/
function getOrderProgress(status) {
	return {
		novo_pedido: 0,
		pagamento_confirmado: 20,
		preparando: 50,
		"saiu para entrega": 80,
		entregue: 100,
		cancelado: 0
	}[status] || 0;
}
var STATUS_CONFIG = {
	pendente: {
		label: "Aguardando confirmação",
		icon: Clock,
		color: "text-yellow-600",
		bg: "bg-yellow-50 border-yellow-200",
		step: 1
	},
	preparando: {
		label: "Em preparação",
		icon: Package,
		color: "text-blue-600",
		bg: "bg-blue-50 border-blue-200",
		step: 2
	},
	"saiu para entrega": {
		label: "Saiu para entrega",
		icon: Truck,
		color: "text-purple-600",
		bg: "bg-purple-50 border-purple-200",
		step: 3
	},
	entregue: {
		label: "Entregue",
		icon: CircleCheck,
		color: "text-green-600",
		bg: "bg-green-50 border-green-200",
		step: 4
	},
	cancelado: {
		label: "Cancelado",
		icon: CircleX,
		color: "text-red-600",
		bg: "bg-red-50 border-red-200",
		step: 0
	}
};
var STEPS = [
	{
		step: 1,
		label: "Recebido",
		icon: Clock
	},
	{
		step: 2,
		label: "Preparando",
		icon: Package
	},
	{
		step: 3,
		label: "A caminho",
		icon: Truck
	},
	{
		step: 4,
		label: "Entregue",
		icon: CircleCheck
	}
];
function RastrearPedidoPage() {
	const search = Route.useSearch();
	const [protocolo, setProtocolo] = (0, import_react.useState)(search.p ?? "");
	const [busca, setBusca] = (0, import_react.useState)(search.p ?? "");
	const { data: pedido, isLoading, error } = useQuery({
		queryKey: ["rastrear", busca],
		enabled: busca.length >= 6,
		queryFn: async () => {
			const termo = busca.trim().replace("#", "");
			const { data, error } = await supabase.rpc("rastrear_pedido", { p_protocolo: termo });
			if (error) throw error;
			return data?.[0] ?? null;
		}
	});
	const config = pedido ? STATUS_CONFIG[pedido.status] ?? STATUS_CONFIG["pendente"] : null;
	const currentStep = config?.step ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-gray-50 py-12 px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-lg mx-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center mb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 28 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-bold text-gray-900",
							children: "Rastrear Pedido"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-gray-500 text-sm mt-1",
							children: "Digite o protocolo do seu pedido"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border shadow-sm p-4 mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								size: 16,
								className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: protocolo,
								onChange: (e) => setProtocolo(e.target.value.toUpperCase()),
								onKeyDown: (e) => e.key === "Enter" && setBusca(protocolo),
								placeholder: "Ex: B42018AD",
								className: "w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 font-mono tracking-wider",
								maxLength: 8
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setBusca(protocolo),
							disabled: protocolo.length < 6,
							className: "px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-all",
							children: "Buscar"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-gray-400 mt-2 ml-1",
						children: "O protocolo está no e-mail de confirmação ou na mensagem do WhatsApp"
					})]
				}),
				isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-white rounded-2xl border p-8 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" })
				}),
				!isLoading && busca && !pedido && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border p-8 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
							size: 40,
							className: "mx-auto text-gray-300 mb-3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-gray-500 font-medium",
							children: "Pedido não encontrado"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400 mt-1",
							children: "Verifique o protocolo e tente novamente"
						})
					]
				}),
				pedido && config && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `rounded-2xl border p-6 ${config.bg}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `h-12 w-12 rounded-2xl flex items-center justify-center ${config.bg} border ${config.color}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(config.icon, { size: 24 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs font-bold text-gray-500 uppercase tracking-wider",
									children: ["Pedido #", pedido.id.slice(-8).toUpperCase()]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-lg font-black ${config.color}`,
									children: config.label
								})] })]
							}),
							pedido.status !== "cancelado" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-full h-2 bg-gray-200 rounded-full overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-primary transition-all duration-500",
										style: { width: `${getOrderProgress(pedido.status)}%` }
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-gray-500 mt-2 text-center",
									children: [getOrderProgress(pedido.status), "% completo"]
								})]
							}),
							pedido.status !== "cancelado" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-2 mt-4",
								children: STEPS.map((s, i) => {
									const done = currentStep >= s.step;
									s.step;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `flex flex-col items-center gap-1 flex-1`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? "bg-primary border-primary text-white" : "bg-white border-gray-200 text-gray-300"}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { size: 14 })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-[10px] font-bold text-center ${done ? "text-primary" : "text-gray-300"}`,
												children: s.label
											})]
										}), i < STEPS.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-0.5 flex-1 mb-4 rounded-full ${currentStep > s.step ? "bg-primary" : "bg-gray-200"}` })]
									}, s.step);
								})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-2xl border p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-gray-800",
								children: "Detalhes do Pedido"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase",
										children: "Cliente"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-gray-900",
										children: pedido.nome_cliente
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase",
										children: "Data"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-gray-900",
										children: format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase",
										children: "Entrega"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-gray-900 flex items-center gap-1",
										children: pedido.metodo_entrega === "entrega" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 12 }),
											" ",
											pedido.endereco_bairro,
											", ",
											pedido.endereco_cidade
										] }) : "🏪 Retirada na loja"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase",
										children: "Pagamento"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-gray-900",
										children: pedido.metodo_pagamento
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t pt-4 space-y-2",
								children: [(pedido.itens ?? []).map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-gray-700",
										children: [
											item.quantidade,
											"x ",
											item.produtos?.nome ?? "Produto"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-medium text-gray-900",
										children: ["R$ ", (item.preco_unitario * item.quantidade).toFixed(2).replace(".", ",")]
									})]
								}, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-t pt-2 flex justify-between font-bold text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-primary",
										children: [
											"R$",
											" ",
											((pedido.valor_total ?? 0) - (pedido.desconto_aplicado ?? 0) + (pedido.taxa_entrega ?? 0)).toFixed(2).replace(".", ",")
										]
									})]
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-xs text-gray-400 mt-6",
					children: "Dúvidas? Fale conosco pelo WhatsApp 😊"
				})
			]
		})
	});
}
//#endregion
export { RastrearPedidoPage as component };
