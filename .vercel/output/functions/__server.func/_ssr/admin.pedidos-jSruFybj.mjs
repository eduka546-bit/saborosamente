import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { B as Receipt, F as Search, Ft as CircleX, Ht as CircleAlert, Mt as Clock3, O as Smartphone, P as Send, R as RotateCcwClock, Rt as CircleCheck, St as Eye, Tt as EllipsisVertical, V as Printer, Wt as ChevronRight, Y as Package, jt as Clock, l as User, rt as MapPin, xt as FileText } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { a as DialogTitle, c as DropdownMenuItem, i as DialogHeader, n as DialogContent, o as DropdownMenu, s as DropdownMenuContent, t as Dialog, u as DropdownMenuTrigger } from "./dropdown-menu-BcaY44CS.mjs";
import { t as imprimirTCP } from "./qz-print-8Cg_f1Lu.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.pedidos-jSruFybj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
"─".repeat(32);
"·".repeat(32);
/**
* Abre janela de impressão com a comanda.
* Chamar após montar o componente no DOM.
*/
function printReceipt(order) {
	const win = window.open("", "_blank", "width=400,height=600");
	if (!win) {
		alert("Permita pop-ups para imprimir a comanda.");
		return;
	}
	const date = new Date(order.created_at);
	const dateStr = date.toLocaleDateString("pt-BR");
	const timeStr = date.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit"
	});
	const seq = order.id.slice(-6).toUpperCase();
	const isDelivery = order.metodo_entrega === "entrega";
	const subtotal = order.itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
	const desconto = order.desconto_aplicado ?? 0;
	const entrega = order.taxa_entrega ?? 0;
	const c = (t) => t.padStart(Math.floor((32 + t.length) / 2)).padEnd(32);
	const r = (l, v) => l + " ".repeat(Math.max(1, 32 - l.length - v.length)) + v;
	const sep = "─".repeat(32);
	const thin = "·".repeat(32);
	const itensLines = order.itens.map((item) => {
		const tot = item.preco_unitario * item.quantidade;
		const prod = `${item.quantidade}x ${item.nome}`;
		const val = `R$ ${tot.toFixed(2)}`;
		const line = prod + " ".repeat(Math.max(1, 32 - prod.length - val.length)) + val;
		return item.observacao ? `${line}\n  Obs: ${item.observacao}` : line;
	}).join("\n");
	const body = [
		c("SABOROSAMENTE"),
		c("Atacado de Refeicoes"),
		c("e Sopas Congeladas"),
		sep,
		c(`PEDIDO #${seq}`),
		c(`${dateStr}  ${timeStr}`),
		sep,
		"CLIENTE:",
		order.nome_cliente,
		order.telefone_cliente ?? "",
		sep,
		c(isDelivery ? "** DELIVERY **" : "** RETIRADA **"),
		...isDelivery && order.endereco_rua ? [
			"ENTREGA:",
			`${order.endereco_rua}${order.endereco_numero ? ", " + order.endereco_numero : ""}`,
			`${order.endereco_bairro ?? ""}  ${order.endereco_cidade ?? ""}`,
			order.endereco_cep ?? ""
		] : [],
		sep,
		"ITENS",
		thin,
		itensLines,
		thin,
		r("Subtotal:", `R$ ${subtotal.toFixed(2)}`),
		r("Entrega:", entrega > 0 ? `R$ ${entrega.toFixed(2)}` : "GRATIS"),
		...desconto > 0 ? [r(`Desconto${order.cupom_codigo ? ` (${order.cupom_codigo})` : ""}:`, `- R$ ${desconto.toFixed(2)}`)] : [],
		sep,
		r("TOTAL:", `R$ ${order.valor_total.toFixed(2)}`),
		sep,
		"PAGAMENTO:",
		order.metodo_pagamento ?? "Nao informado",
		...order.troco ? [`Troco para: R$ ${order.troco}`] : [],
		...order.observacao ? [`\nOBS: ${order.observacao}`] : [],
		sep,
		c("Obrigado pela preferencia!"),
		c("@saborosamente.sbs"),
		" "
	].filter((l) => l !== null && l !== void 0).join("\n");
	win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Comanda #${seq}</title>
  <style>
    @page { margin: 2mm; size: 58mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 10pt;
      font-weight: bold;
      line-height: 1.4;
      width: 58mm;
      background: white;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    pre {
      white-space: pre;
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      color: #000;
    }
  </style>
</head>
<body>
<pre>${body}</pre>
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1000);
  };
<\/script>
</body>
</html>`);
	win.document.close();
}
function OrderDetailsModal({ isOpen, onClose, order }) {
	const queryClient = useQueryClient();
	const confirmMutation = useMutation({
		mutationFn: async (pedidoId) => {
			const { confirmarPedidoRascunho } = await import("./order-confirmation-kOC8cJng.mjs");
			return await confirmarPedidoRascunho(pedidoId);
		},
		onSuccess: async (data) => {
			toast.success(`✓ Pedido #${order.id.slice(0, 8)} confirmado!`);
			queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
			try {
				fetch(`https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-notify`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg"
					},
					body: JSON.stringify({
						pedido_id: order.id,
						status_novo: "pendente"
					})
				});
			} catch (e) {
				console.warn("Falha ao notificar WhatsApp:", e);
			}
			onClose();
		},
		onError: (error) => {
			toast.error(`Erro: ${error.message}`);
		}
	});
	const confirmarRascunho = (pedidoId) => {
		confirmMutation.mutate(pedidoId);
	};
	const statusColors = {
		rascunho: "bg-gray-100 text-gray-700 border-gray-200",
		pendente: "bg-yellow-100 text-yellow-700 border-yellow-200",
		preparando: "bg-blue-100 text-blue-700 border-blue-200",
		"saiu para entrega": "bg-purple-100 text-purple-700 border-purple-200",
		entregue: "bg-green-100 text-green-700 border-green-200",
		cancelado: "bg-red-100 text-red-700 border-red-200"
	};
	if (!order) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: isOpen,
		onOpenChange: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-4xl p-0 overflow-hidden bg-white rounded-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
				className: "px-6 py-4 border-b flex flex-row items-center justify-between bg-gray-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-xl font-bold text-gray-800",
						children: ["Pedido #", order.id.slice(0, 8)]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						className: statusColors[order.status] || "bg-gray-100 text-gray-700",
						children: order.status
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [order.status === "rascunho" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "default",
						size: "sm",
						className: "flex items-center gap-2 bg-green-600 hover:bg-green-700",
						onClick: () => {
							confirmarRascunho(order.id);
						},
						children: "✓ Confirmar Pedido"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "flex items-center gap-2",
						onClick: () => {
							if (!order) return;
							printReceipt({
								...order,
								itens: (order.itens ?? []).map((i) => ({
									nome: i.produtos?.nome ?? i.nome ?? "Produto",
									quantidade: i.quantidade,
									preco_unitario: i.preco_unitario,
									observacao: i.observacao
								}))
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { size: 14 }), " Imprimir"]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-6 grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[70vh] overflow-y-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "md:col-span-2 space-y-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { size: 16 }), " Itens do Pedido"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border rounded-lg overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "bg-gray-50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "text-left",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-3 font-semibold text-gray-600",
												children: "Produto"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-3 font-semibold text-gray-600 text-center",
												children: "Qtd"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-3 font-semibold text-gray-600 text-right",
												children: "Preço"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "px-4 py-3 font-semibold text-gray-600 text-right",
												children: "Total"
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
									className: "divide-y",
									children: order.itens?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-medium text-gray-900",
												children: item.produtos?.nome
											}), item.observacao && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-xs text-red-500 mt-1 italic",
												children: ["Obs: ", item.observacao]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-4 text-center",
											children: [item.quantidade, "x"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-4 text-right",
											children: ["R$ ", item.preco_unitario.toFixed(2).replace(".", ",")]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-4 text-right font-medium",
											children: ["R$ ", (item.quantidade * item.preco_unitario).toFixed(2).replace(".", ",")]
										})
									] }, item.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tfoot", {
									className: "bg-gray-50/50 font-semibold",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											colSpan: 3,
											className: "px-4 py-3 text-right text-gray-500",
											children: "Subtotal:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-3 text-right",
											children: ["R$ ", order.valor_total.toFixed(2).replace(".", ",")]
										})] }),
										order.desconto_aplicado > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "text-red-500",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 3,
												className: "px-4 py-3 text-right",
												children: "Desconto:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-4 py-3 text-right",
												children: ["- R$ ", order.desconto_aplicado.toFixed(2).replace(".", ",")]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											colSpan: 3,
											className: "px-4 py-3 text-right text-gray-500",
											children: "Taxa de Entrega:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-3 text-right",
											children: ["R$ ", order.taxa_entrega?.toFixed(2).replace(".", ",") || "0,00"]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "text-lg text-[#5850ec]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												colSpan: 3,
												className: "px-4 py-3 text-right",
												children: "Total:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "px-4 py-3 text-right font-bold",
												children: [
													"R$",
													" ",
													(order.valor_total - (order.desconto_aplicado || 0) + (order.taxa_entrega || 0)).toFixed(2).replace(".", ",")
												]
											})]
										})
									]
								})
							]
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-blue-50/50 p-4 rounded-lg border border-blue-100",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-sm font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { size: 16 }), " Pagamento"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-gray-500 uppercase font-bold mb-1",
								children: "Método"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-gray-800",
								children: order.metodo_pagamento || "Não informado"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-gray-500 uppercase font-bold mb-1",
								children: "Status do Pagamento"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold text-green-600 flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 14 }), " Confirmado"]
							})] })]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { size: 16 }), " Cliente"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
										className: "text-gray-400",
										size: 20
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-gray-900",
									children: order.nome_cliente || "Cliente Final"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-gray-500 flex items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { size: 12 }),
										" ",
										order.telefone_cliente || "(00) 00000-0000"
									]
								})] })]
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 16 }), " Endereço de Entrega"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 bg-gray-50 rounded-lg text-sm border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-bold mb-1",
									children: [
										order.endereco_rua || "Endereço não informado",
										", ",
										order.endereco_numero
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-gray-600",
									children: [
										order.endereco_bairro,
										" - ",
										order.endereco_cidade || "Cidade"
									]
								}),
								order.endereco_referencia && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs text-gray-500 italic",
									children: ["Ref: ", order.endereco_referencia]
								})
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 16 }), " Horários"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gray-500",
									children: "Realizado:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
								})]
							}), order.updated_at !== order.created_at && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gray-500",
									children: "Última atualização:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: format(new Date(order.updated_at), "HH:mm")
								})]
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcwClock, { size: 16 }), " Status Atual"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gray-100",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative pl-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary shadow-sm" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-bold text-gray-800",
										children: order.status
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-gray-500",
										children: format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })
									})
								]
							})
						})] })
					]
				})]
			})]
		})
	});
}
function AdminOrdersPage() {
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [selectedOrder, setSelectedOrder] = (0, import_react.useState)(null);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = (0, import_react.useState)(false);
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("Todos");
	const [filterDate, setFilterDate] = (0, import_react.useState)("todos");
	const [filterMinValue, setFilterMinValue] = (0, import_react.useState)(0);
	const [filterMaxValue, setFilterMaxValue] = (0, import_react.useState)(99999);
	const [autoPrint, setAutoPrint] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem("admin.autoPrint") === "true";
	});
	const knownIdsRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const [notifPermission, setNotifPermission] = (0, import_react.useState)("default");
	const { data: configImpressaoData } = useQuery({
		queryKey: ["config-impressao"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("config_impressao").maybeSingle();
			return data?.config_impressao ?? null;
		},
		staleTime: 6e4
	});
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined" || !("Notification" in window)) return;
		setNotifPermission(Notification.permission);
		if (Notification.permission === "default") Notification.requestPermission().then((p) => setNotifPermission(p));
	}, []);
	(0, import_react.useEffect)(() => {
		const channelName = `pedidos-realtime-${Math.random().toString(36).slice(2, 8)}`;
		const channel = supabase.channel(channelName).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "pedidos"
		}, async (payload) => {
			const newOrder = payload.new;
			if (knownIdsRef.current.has(newOrder.id)) return;
			knownIdsRef.current.add(newOrder.id);
			queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
			try {
				if (typeof window === "undefined") return;
				const ctx = new (window.AudioContext || window.webkitAudioContext)();
				if (ctx.state === "suspended") await ctx.resume();
				const play = (freq, delay) => {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.connect(gain);
					gain.connect(ctx.destination);
					osc.frequency.value = freq;
					gain.gain.setValueAtTime(.4, ctx.currentTime + delay);
					gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + .3);
					osc.start(ctx.currentTime + delay);
					osc.stop(ctx.currentTime + delay + .3);
				};
				play(880, 0);
				play(1100, .3);
				play(1320, .6);
			} catch (e) {
				console.warn("Beep falhou:", e);
			}
			if ("Notification" in window && Notification.permission === "granted") try {
				const n = new Notification("🛒 Novo pedido!", {
					body: `${newOrder.nome_cliente ?? "Cliente"} — R$ ${Number(newOrder.valor_total ?? 0).toFixed(2)}`,
					icon: "/favicon.png",
					tag: `pedido-${newOrder.id}`,
					requireInteraction: true
				});
				n.onclick = () => {
					window.focus();
					setSelectedOrder(newOrder);
					setIsDetailsModalOpen(true);
					n.close();
				};
			} catch (e) {
				console.warn("Notificação falhou:", e);
			}
			toast.info(`🛒 Novo pedido de ${newOrder.nome_cliente ?? "cliente"}!`, {
				duration: 15e3,
				action: {
					label: "Ver",
					onClick: () => {
						setSelectedOrder(newOrder);
						setIsDetailsModalOpen(true);
					}
				}
			});
			if ((autoPrint || configImpressaoData?.impressao_automatica) && configImpressaoData?.imprimir_ao_confirmar !== false) try {
				await new Promise((r) => setTimeout(r, 1200));
				const { data: itens } = await supabase.from("pedido_itens").select("*").eq("pedido_id", newOrder.id);
				const ids = (itens ?? []).map((i) => i.produto_id).filter(Boolean);
				const nomesMap = {};
				if (ids.length > 0) {
					const { data: prods } = await supabase.from("produtos").select("id, nome").in("id", ids);
					(prods ?? []).forEach((p) => {
						nomesMap[p.id] = p.nome;
					});
				}
				const orderComItens = {
					...newOrder,
					itens: (itens ?? []).map((i) => ({
						nome: nomesMap[i.produto_id] ?? "Produto",
						quantidade: i.quantidade,
						preco_unitario: i.preco_unitario,
						observacao: i.observacao
					}))
				};
				const ip = configImpressaoData?.impressora_ip;
				const porta = Number(configImpressaoData?.impressora_porta ?? 9100);
				const copias = Number(configImpressaoData?.copias ?? 1);
				const papel = configImpressaoData?.tamanho_papel ?? "80mm";
				if (ip) {
					if (!await imprimirTCP(orderComItens, ip, porta, copias, papel)) printReceipt(orderComItens);
				} else printReceipt(orderComItens);
			} catch (e) {
				console.error("Erro ao imprimir automaticamente:", e);
			}
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [
		autoPrint,
		queryClient,
		configImpressaoData
	]);
	(0, import_react.useEffect)(() => {
		const knownHandoffIds = /* @__PURE__ */ new Set();
		const playHandoffSound = async () => {
			try {
				if (typeof window === "undefined") return;
				const ctx = new (window.AudioContext || window.webkitAudioContext)();
				if (ctx.state === "suspended") await ctx.resume();
				const play = (freq, delay, dur = .25) => {
					const osc = ctx.createOscillator();
					const gain = ctx.createGain();
					osc.type = "sine";
					osc.connect(gain);
					gain.connect(ctx.destination);
					osc.frequency.value = freq;
					gain.gain.setValueAtTime(.5, ctx.currentTime + delay);
					gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + dur);
					osc.start(ctx.currentTime + delay);
					osc.stop(ctx.currentTime + delay + dur);
				};
				play(1400, 0);
				play(1100, .28);
				play(880, .56);
				play(1400, 1);
				play(1100, 1.28);
				play(880, 1.56);
			} catch (e) {
				console.warn("Handoff beep falhou:", e);
			}
		};
		const channelHandoff = supabase.channel(`handoff-realtime-${Math.random().toString(36).slice(2, 8)}`).on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "whatsapp_conversas",
			filter: "modo=eq.humano"
		}, async (payload) => {
			const conversa = payload.new;
			if (knownHandoffIds.has(conversa.id)) return;
			knownHandoffIds.add(conversa.id);
			setTimeout(() => knownHandoffIds.delete(conversa.id), 3e4);
			await playHandoffSound();
			if ("Notification" in window && Notification.permission === "granted") try {
				new Notification("👤 Cliente aguardando atendente!", {
					body: `${conversa.nome ?? conversa.telefone ?? "Cliente"} quer falar com você`,
					icon: "/favicon.png",
					tag: `handoff-${conversa.id}`,
					requireInteraction: true
				});
			} catch (_) {}
			toast.warning(`👤 ${conversa.nome ?? conversa.telefone ?? "Cliente"} pediu atendente!`, {
				duration: 2e4,
				action: {
					label: "Assumir",
					onClick: () => window.location.href = "/admin/agente"
				}
			});
		}).subscribe();
		return () => {
			supabase.removeChannel(channelHandoff);
		};
	}, []);
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["admin-orders"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("*,itens:pedido_itens(*)").order("created_at", { ascending: false });
			if (error) throw error;
			const produtoIds = [...new Set((data ?? []).flatMap((p) => (p.itens ?? []).map((i) => i.produto_id).filter(Boolean)))];
			const produtosMap = {};
			if (produtoIds.length > 0) {
				const { data: prods } = await supabase.from("produtos").select("id, nome").in("id", produtoIds);
				(prods ?? []).forEach((p) => {
					produtosMap[p.id] = p.nome;
				});
			}
			return (data ?? []).map((pedido) => ({
				...pedido,
				itens: (pedido.itens ?? []).map((item) => ({
					...item,
					produtos: { nome: produtosMap[item.produto_id] ?? "Produto" }
				}))
			}));
		}
	});
	const updateOrderStatus = useMutation({
		mutationFn: async ({ id, status, statusAnterior }) => {
			const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
			if (error) throw error;
			try {
				await fetch(`https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-notify`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg"
					},
					body: JSON.stringify({
						pedido_id: id,
						status_anterior: statusAnterior,
						status_novo: status
					})
				});
			} catch (e) {
				console.warn("Notificação WhatsApp falhou:", e);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
			toast.success("Status do pedido atualizado!");
		},
		onError: (error) => {
			toast.error("Erro ao atualizar status: " + error.message);
		}
	});
	const filteredOrders = (0, import_react.useMemo)(() => {
		const now = /* @__PURE__ */ new Date();
		return orders.filter((order) => {
			const matchText = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || order.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase());
			const matchStatus = filterStatus === "Todos" || order.status === filterStatus;
			const matchValue = order.valor_total >= filterMinValue && order.valor_total <= filterMaxValue;
			const oDate = new Date(order.created_at);
			let matchDate = true;
			if (filterDate === "hoje") matchDate = oDate.toDateString() === now.toDateString();
			else if (filterDate === "semana") {
				const weekAgo = new Date(now);
				weekAgo.setDate(now.getDate() - 7);
				matchDate = oDate >= weekAgo;
			} else if (filterDate === "mes") matchDate = oDate.getMonth() === now.getMonth() && oDate.getFullYear() === now.getFullYear();
			return matchText && matchStatus && matchDate && matchValue;
		});
	}, [
		orders,
		searchTerm,
		filterStatus,
		filterDate,
		filterMinValue,
		filterMaxValue
	]);
	const stats = (0, import_react.useMemo)(() => {
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const todayOrders = orders.filter((o) => o.created_at.startsWith(today));
		return {
			totalToday: todayOrders.length,
			revenueToday: todayOrders.reduce((acc, o) => acc + (o.valor_total || 0), 0),
			pendingCount: orders.filter((o) => o.status === "pendente").length
		};
	}, [orders]);
	const handleOrderClick = (order) => {
		setSelectedOrder(order);
		setIsDetailsModalOpen(true);
	};
	const statusOptions = [
		{
			label: "rascunho",
			icon: FileText,
			color: "text-gray-500"
		},
		{
			label: "pendente",
			icon: Clock3,
			color: "text-yellow-500"
		},
		{
			label: "preparando",
			icon: Package,
			color: "text-blue-500"
		},
		{
			label: "saiu para entrega",
			icon: MapPin,
			color: "text-purple-500"
		},
		{
			label: "entregue",
			icon: CircleCheck,
			color: "text-green-500"
		},
		{
			label: "cancelado",
			icon: CircleX,
			color: "text-red-500"
		}
	];
	const statusBadgeColors = {
		rascunho: "bg-gray-50 text-gray-600 border-gray-200",
		pendente: "bg-yellow-50 text-yellow-600 border-yellow-200",
		preparando: "bg-blue-50 text-blue-600 border-blue-200",
		"saiu para entrega": "bg-purple-50 text-purple-600 border-purple-200",
		entregue: "bg-green-50 text-green-600 border-green-200",
		cancelado: "bg-red-50 text-red-600 border-red-200"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen",
		children: [
			notifPermission === "denied" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-lg",
					children: "🔔"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-bold text-red-700",
						children: "Notificações bloqueadas no navegador"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-red-600",
						children: "Novos pedidos não vão gerar alertas. Para habilitar: clique no cadeado na barra de endereço → Notificações → Permitir."
					})]
				})]
			}),
			notifPermission === "default" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-lg",
						children: "🔔"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-bold text-yellow-700",
							children: "Permissão de notificação pendente"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-yellow-600",
							children: "Permita notificações para receber alertas de novos pedidos mesmo com a aba minimizada."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => Notification.requestPermission().then((p) => setNotifPermission(p)),
						className: "px-3 py-1.5 bg-yellow-500 text-white text-xs font-bold rounded-lg hover:bg-yellow-600 shrink-0",
						children: "Permitir"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Gestão de Pedidos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Acompanhe e gerencie as entregas em tempo real."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3 items-center flex-wrap",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white px-6 py-3 rounded-xl border flex flex-col items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest",
								children: "Hoje"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xl font-black text-[#5850ec]",
								children: stats.totalToday
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white px-6 py-3 rounded-xl border flex flex-col items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest",
								children: "Pendentes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xl font-black text-yellow-500",
								children: stats.pendingCount
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								const next = !autoPrint;
								setAutoPrint(next);
								localStorage.setItem("admin.autoPrint", String(next));
								toast.success(next ? "Impressão automática ativada!" : "Impressão automática desativada.");
							},
							title: "Impressão automática ao receber novo pedido",
							className: cn("flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all", autoPrint ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-500 border-gray-200 hover:border-green-300"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { size: 16 }), autoPrint ? "Auto-imprimir ON" : "Auto-imprimir OFF"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl shadow-sm border p-4 mb-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col md:flex-row gap-4 items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 w-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
							size: 18
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Buscar por ID ou nome do cliente...",
							className: "pl-10 rounded-lg border-gray-200",
							value: searchTerm,
							onChange: (e) => setSearchTerm(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 w-full md:w-auto flex-wrap",
						children: [
							[
								"todos",
								"hoje",
								"semana",
								"mes"
							].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setFilterDate(d),
								className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterDate === d ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-500 hover:border-[#5850ec]"}`,
								children: d === "todos" ? "Todos" : d === "hoje" ? "Hoje" : d === "semana" ? "7 dias" : "Este mês"
							}, d)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: filterStatus,
								onChange: (e) => setFilterStatus(e.target.value),
								className: "h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 bg-white",
								children: [
									"Todos",
									"pendente",
									"preparando",
									"saiu para entrega",
									"entregue",
									"cancelado"
								].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s,
									children: s
								}, s))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										placeholder: "Min",
										value: filterMinValue || "",
										onChange: (e) => setFilterMinValue(Number(e.target.value) || 0),
										className: "h-9 w-20 px-2 rounded-lg border border-gray-200 text-xs font-bold"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-gray-400 text-xs",
										children: "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										placeholder: "Max",
										value: filterMaxValue || "",
										onChange: (e) => setFilterMaxValue(Number(e.target.value) || 99999),
										className: "h-9 w-20 px-2 rounded-lg border border-gray-200 text-xs font-bold"
									})
								]
							})
						]
					})]
				})
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center py-24 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loader2$1, {
					className: "animate-spin text-primary",
					size: 40
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground font-medium",
					children: "Carregando pedidos..."
				})]
			}) : filteredOrders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
					className: "mx-auto text-gray-300 mb-4",
					size: 48
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground font-medium",
					children: "Nenhum pedido encontrado."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4",
									children: "ID / Hora"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4",
									children: "Cliente / Local"
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
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4 text-center",
									children: "Ações"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-gray-100",
							children: filteredOrders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-gray-50/50 transition-colors group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-sm font-bold text-[#5850ec]",
												children: ["#", order.id.slice(0, 8)]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-gray-500 flex items-center gap-1 mt-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 10 }),
													" ",
													format(new Date(order.created_at), "HH:mm")
												]
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-bold text-gray-900",
													children: order.nome_cliente || "Cliente Final"
												}),
												order.origem === "whatsapp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 mt-1 w-fit",
													children: "📱 WhatsApp"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs text-gray-500 flex items-center gap-1 mt-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 10 }),
														" ",
														order.endereco_bairro || "Retirada"
													]
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex -space-x-2 overflow-hidden",
											children: [order.itens?.slice(0, 3).map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold",
												title: item.produtos?.nome,
												children: item.quantidade
											}, item.id)), order.itens?.length > 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "h-7 w-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-black",
												children: ["+", order.itens.length - 3]
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-bold text-gray-900",
											children: ["R$ ", order.valor_total.toFixed(2).replace(".", ",")]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
											asChild: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												className: cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border", statusBadgeColors[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200"),
												children: [order.status, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
													size: 12,
													className: "rotate-90"
												})]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent, {
											align: "start",
											className: "w-56 p-1",
											children: statusOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => updateOrderStatus.mutate({
													id: order.id,
													status: opt.label,
													statusAnterior: order.status
												}),
												className: "flex items-center gap-3 py-2 px-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(opt.icon, {
													size: 16,
													className: opt.color
												}), opt.label]
											}, opt.label))
										})] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-5 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-9 w-9 rounded-full bg-gray-100 hover:bg-[#5850ec] hover:text-white transition-all",
													onClick: () => handleOrderClick(order),
													title: "Ver detalhes",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
												}),
												order.telefone_cliente && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													title: "Enviar WhatsApp",
													className: "h-9 w-9 rounded-full bg-green-50 hover:bg-green-500 hover:text-white transition-all",
													onClick: () => window.open(`https://wa.me/${order.telefone_cliente.replace(/\D/g, "")}?text=Olá! Seu pedido #${order.id.slice(0, 8)} está sendo preparado.`, "_blank"),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
														size: 16,
														className: "text-green-600 hover:text-white"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													title: "Imprimir comanda",
													className: "h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-all",
													onClick: () => printReceipt({
														...order,
														itens: (order.itens ?? []).map((i) => ({
															nome: i.produtos?.nome ?? "Produto",
															quantidade: i.quantidade,
															preco_unitario: i.preco_unitario,
															observacao: i.observacao
														}))
													}),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { size: 16 })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
													asChild: true,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "h-9 w-9 rounded-full",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { size: 18 })
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
													align: "end",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
														className: "text-xs font-bold uppercase flex gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { size: 14 }), " Imprimir Ticket"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
														className: "text-xs font-bold uppercase flex gap-2 text-red-600",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { size: 14 }), " Cancelar Pedido"]
													})]
												})] })
											]
										})
									})
								]
							}, order.id))
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderDetailsModal, {
				isOpen: isDetailsModalOpen,
				onClose: () => setIsDetailsModalOpen(false),
				order: selectedOrder
			})
		]
	});
}
function Loader2$1({ className, size }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
		className: cn("animate-spin", className),
		size
	});
}
//#endregion
export { AdminOrdersPage as component };
