import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as XAxis, f as ResponsiveContainer, i as YAxis, l as CartesianGrid, n as BarChart, o as Bar, u as Tooltip } from "../_libs/recharts+[...].mjs";
import { l as eachMonthOfInterval, o as format, s as startOfYear, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clientes-TQvQXy7c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminRelatoriosClientesPage() {
	const { data: profiles = [], isLoading } = useQuery({
		queryKey: ["relatorio-clientes"],
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, nome, created_at").order("created_at");
			if (error) throw error;
			return data;
		}
	});
	const { data: orders = [] } = useQuery({
		queryKey: ["relatorio-clientes-orders"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("user_id, valor_total, status").neq("status", "cancelado");
			if (error) throw error;
			return data;
		}
	});
	const monthlyGrowth = (0, import_react.useMemo)(() => {
		return eachMonthOfInterval({
			start: startOfYear(/* @__PURE__ */ new Date()),
			end: /* @__PURE__ */ new Date()
		}).map((month) => {
			const key = format(month, "yyyy-MM");
			const count = profiles.filter((p) => p.created_at?.startsWith(key)).length;
			return {
				name: format(month, "MMM", { locale: ptBR }),
				novos: count
			};
		});
	}, [profiles]);
	const topClients = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		orders.forEach((o) => {
			if (!o.user_id) return;
			const existing = map.get(o.user_id);
			const prof = profiles.find((p) => p.id === o.user_id);
			if (existing) {
				existing.total += o.valor_total ?? 0;
				existing.pedidos += 1;
			} else map.set(o.user_id, {
				nome: prof?.nome ?? "—",
				total: o.valor_total ?? 0,
				pedidos: 1
			});
		});
		return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
	}, [orders, profiles]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Relatório de Clientes"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Crescimento da base e top clientes."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Total de Clientes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-black text-[#5850ec] mt-1",
							children: profiles.length
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Novos este mês"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-black text-green-600 mt-1",
							children: monthlyGrowth[monthlyGrowth.length - 1]?.novos ?? 0
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-gray-800 mb-4",
						children: [
							"Novos clientes por mês (",
							(/* @__PURE__ */ new Date()).getFullYear(),
							")"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-[250px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: monthlyGrowth,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										vertical: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { dataKey: "name" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { allowDecimals: false }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "novos",
										fill: "#5850ec",
										radius: [
											4,
											4,
											0,
											0
										]
									})
								]
							})
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-6 py-4 border-b",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-bold text-gray-800",
							children: "Top 10 Clientes por Receita"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-3",
									children: "#"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-3",
									children: "Cliente"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-3",
									children: "Pedidos"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-3",
									children: "Total gasto"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y",
							children: topClients.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-gray-50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-3 font-black text-gray-300",
										children: i + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-3 font-semibold text-gray-900",
										children: c.nome
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-3 text-[#5850ec] font-bold",
										children: c.pedidos
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-6 py-3 text-green-600 font-bold",
										children: ["R$ ", c.total.toFixed(2)]
									})
								]
							}, i))
						})]
					})]
				})
			]
		})]
	});
}
//#endregion
export { AdminRelatoriosClientesPage as component };
