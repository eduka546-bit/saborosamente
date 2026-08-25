import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Et as Download, F as Search, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/transacoes-C0jCMbYy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminTransacoesPage() {
	const [search, setSearch] = (0, import_react.useState)("");
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("Todos");
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["transacoes-pedidos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("id, nome_cliente, valor_total, taxa_entrega, desconto_aplicado, metodo_pagamento, status, created_at").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const filtered = (0, import_react.useMemo)(() => orders.filter((o) => (filterStatus === "Todos" || o.status === filterStatus) && (o.nome_cliente?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search))), [
		orders,
		search,
		filterStatus
	]);
	const exportCSV = () => {
		const header = "ID,Cliente,Valor,Entrega,Desconto,Pagamento,Status,Data\n";
		const rows = filtered.map((o) => `${o.id},${o.nome_cliente ?? ""},${o.valor_total},${o.taxa_entrega ?? 0},${o.desconto_aplicado ?? 0},${o.metodo_pagamento ?? ""},${o.status},${o.created_at}`).join("\n");
		const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "transacoes.csv";
		a.click();
		URL.revokeObjectURL(url);
	};
	const statusColors = {
		pendente: "bg-yellow-100 text-yellow-700",
		preparando: "bg-blue-100 text-blue-700",
		"saiu para entrega": "bg-purple-100 text-purple-700",
		entregue: "bg-green-100 text-green-700",
		cancelado: "bg-red-100 text-red-700"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Transações"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Histórico financeiro de todos os pedidos."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: exportCSV,
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 16 }), " Exportar CSV"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-4 mb-6 flex gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 min-w-[200px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
						size: 18
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Buscar por cliente ou ID...",
						className: "pl-10",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: filterStatus,
					onChange: (e) => setFilterStatus(e.target.value),
					className: "h-10 px-3 rounded-md border border-input bg-background text-sm font-medium",
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
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "ID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Pagamento"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Valor"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Desconto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Data"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y",
						children: [filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 7,
							className: "px-6 py-12 text-center text-gray-400",
							children: "Nenhuma transação encontrada."
						}) }), filtered.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 font-mono text-xs text-[#5850ec]",
									children: ["#", o.id.slice(0, 8)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 font-medium text-gray-900",
									children: o.nome_cliente ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-gray-500",
									children: o.metodo_pagamento ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 font-bold text-green-600",
									children: ["R$ ", Number(o.valor_total).toFixed(2)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-red-500",
									children: o.desconto_aplicado ? `- R$ ${Number(o.desconto_aplicado).toFixed(2)}` : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`,
										children: o.status
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-gray-400 text-xs",
									children: format(new Date(o.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
								})
							]
						}, o.id))]
					})]
				})
			})
		]
	});
}
//#endregion
export { AdminTransacoesPage as component };
