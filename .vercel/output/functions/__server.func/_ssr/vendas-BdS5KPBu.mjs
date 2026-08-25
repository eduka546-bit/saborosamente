import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as XAxis, c as Line, d as Legend, f as ResponsiveContainer, i as YAxis, l as CartesianGrid, r as LineChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
import { o as format, r as subDays, t as ptBR, u as eachDayOfInterval } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vendas-BdS5KPBu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminRelatoriosVendasPage() {
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["relatorio-vendas"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("valor_total, created_at, status, metodo_pagamento").gte("created_at", subDays(/* @__PURE__ */ new Date(), 30).toISOString()).order("created_at");
			if (error) throw error;
			return data;
		}
	});
	const chartData = (0, import_react.useMemo)(() => {
		return eachDayOfInterval({
			start: subDays(/* @__PURE__ */ new Date(), 29),
			end: /* @__PURE__ */ new Date()
		}).map((day) => {
			const key = format(day, "yyyy-MM-dd");
			const dayOrders = orders.filter((o) => o.created_at.startsWith(key) && o.status !== "cancelado");
			return {
				name: format(day, "dd/MM", { locale: ptBR }),
				pedidos: dayOrders.length,
				receita: dayOrders.reduce((s, o) => s + (o.valor_total ?? 0), 0)
			};
		});
	}, [orders]);
	const byPayment = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		orders.filter((o) => o.status !== "cancelado").forEach((o) => {
			const key = o.metodo_pagamento ?? "Não informado";
			map.set(key, (map.get(key) ?? 0) + 1);
		});
		return [...map.entries()].sort((a, b) => b[1] - a[1]);
	}, [orders]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Pedidos e Vendas"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Evolução de pedidos e receita nos últimos 30 dias."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-bold text-gray-800 mb-4",
					children: "Pedidos e Receita (30 dias)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[300px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data: chartData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "name",
									tick: { fontSize: 10 },
									interval: 4
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									yAxisId: "left",
									allowDecimals: false,
									tick: { fontSize: 10 }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									yAxisId: "right",
									orientation: "right",
									tickFormatter: (v) => `R$${v}`,
									tick: { fontSize: 10 }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									yAxisId: "left",
									type: "monotone",
									dataKey: "pedidos",
									stroke: "#5850ec",
									strokeWidth: 2,
									dot: false,
									name: "Pedidos"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									yAxisId: "right",
									type: "monotone",
									dataKey: "receita",
									stroke: "#22c55e",
									strokeWidth: 2,
									dot: false,
									name: "Receita (R$)"
								})
							]
						})
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-bold text-gray-800 mb-4",
					children: "Métodos de Pagamento"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: byPayment.map(([method, count]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-gray-700 w-40 truncate",
								children: method
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1 bg-gray-100 rounded-full h-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-[#5850ec] h-2 rounded-full",
									style: { width: `${Math.min(count / orders.length * 100, 100)}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold text-gray-600 w-8 text-right",
								children: count
							})
						]
					}, method))
				})]
			})]
		})]
	});
}
//#endregion
export { AdminRelatoriosVendasPage as component };
