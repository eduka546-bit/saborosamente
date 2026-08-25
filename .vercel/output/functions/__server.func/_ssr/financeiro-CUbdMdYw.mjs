import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Et as Download, Lt as CircleDollarSign, ct as LoaderCircle, g as TrendingDown, h as TrendingUp, rn as ArrowUpRight, xt as FileText } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { a as XAxis, f as ResponsiveContainer, i as YAxis, l as CartesianGrid, s as Area, t as AreaChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
import { c as startOfMonth, l as eachMonthOfInterval, o as format, r as subDays, s as startOfYear, t as ptBR, u as eachDayOfInterval } from "../_libs/date-fns.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-BXjpJ96D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/financeiro-CUbdMdYw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminFinanceiroIndex() {
	const [period, setPeriod] = (0, import_react.useState)("Mensal");
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["financeiro-orders"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("valor_total, taxa_entrega, desconto_aplicado, created_at, status").neq("status", "cancelado").order("created_at", { ascending: true });
			if (error) throw error;
			return data;
		}
	});
	const { chartData, totals } = (0, import_react.useMemo)(() => {
		const now = /* @__PURE__ */ new Date();
		let intervals = [];
		let fmt = "dd/MM";
		if (period === "Semanal") intervals = eachDayOfInterval({
			start: subDays(now, 6),
			end: now
		});
		else if (period === "Mensal") intervals = eachDayOfInterval({
			start: startOfMonth(now),
			end: now
		});
		else {
			intervals = eachMonthOfInterval({
				start: startOfYear(now),
				end: now
			});
			fmt = "MMM";
		}
		const chartData = intervals.map((date) => {
			const key = period === "Anual" ? format(date, "yyyy-MM") : format(date, "yyyy-MM-dd");
			const receita = orders.filter((o) => {
				return (period === "Anual" ? format(new Date(o.created_at), "yyyy-MM") : format(new Date(o.created_at), "yyyy-MM-dd")) === key;
			}).reduce((s, o) => s + (o.valor_total || 0), 0);
			return {
				name: format(date, fmt, { locale: ptBR }),
				receita
			};
		});
		const now30 = subDays(now, 30).toISOString();
		const prev30 = subDays(now, 60).toISOString();
		const currOrders = orders.filter((o) => o.created_at >= now30);
		const prevOrders = orders.filter((o) => o.created_at >= prev30 && o.created_at < now30);
		const receita = currOrders.reduce((s, o) => s + (o.valor_total || 0), 0);
		const prevReceita = prevOrders.reduce((s, o) => s + (o.valor_total || 0), 0);
		return {
			chartData,
			totals: {
				receita,
				desconto: currOrders.reduce((s, o) => s + (o.desconto_aplicado || 0), 0),
				pct: prevReceita > 0 ? (receita - prevReceita) / prevReceita * 100 : 0
			}
		};
	}, [orders, period]);
	const exportCSV = () => {
		const headers = "Data,Receita,Pedidos\n";
		const rows = chartData.map((d) => `${d.name},${d.receita},`).join("\n");
		const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `financeiro_${period.toLowerCase()}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Financeiro"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Fluxo de receitas baseado nos pedidos concluídos."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: exportCSV,
				className: "flex items-center gap-2 bg-[#5850ec] text-white",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 18 }), " Exportar CSV"]
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 md:grid-cols-3 mb-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "border-green-100 bg-green-50/30",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
							children: "Receita (30 dias)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4 text-green-600" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-2xl font-black text-green-700",
						children: ["R$ ", totals.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 text-xs text-green-600 mt-1 font-bold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { size: 14 }),
							totals.pct >= 0 ? "+" : "",
							totals.pct.toFixed(1),
							"% vs 30 dias anteriores"
						]
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "border-orange-100 bg-orange-50/30",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
							children: "Descontos (30 dias)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "h-4 w-4 text-orange-600" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-2xl font-black text-orange-700",
						children: ["R$ ", totals.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 mt-1",
						children: "Cupons e promoções aplicados"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "border-blue-100 bg-blue-50/30",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
							children: "Pedidos (30 dias)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleDollarSign, { className: "h-4 w-4 text-blue-600" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl font-black text-blue-700",
						children: orders.filter((o) => new Date(o.created_at) >= subDays(/* @__PURE__ */ new Date(), 30)).length
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 mt-1",
						children: "Pedidos não cancelados"
					})] })]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-xl shadow-sm border p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between items-center mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "font-bold text-gray-800 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
						className: "text-[#5850ec]",
						size: 20
					}), " Receita por período"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex bg-gray-100 p-1 rounded-lg",
					children: [
						"Semanal",
						"Mensal",
						"Anual"
					].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPeriod(p),
						className: `px-3 py-1 rounded-md text-xs font-bold transition-all ${period === p ? "bg-white shadow-sm text-[#5850ec]" : "text-gray-400 hover:text-gray-600"}`,
						children: p
					}, p))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-[350px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
						data: chartData,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
								id: "colorReceita",
								x1: "0",
								y1: "0",
								x2: "0",
								y2: "1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
									offset: "5%",
									stopColor: "#22c55e",
									stopOpacity: .15
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
									offset: "95%",
									stopColor: "#22c55e",
									stopOpacity: 0
								})]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								strokeDasharray: "3 3",
								vertical: false,
								stroke: "#f1f5f9"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "name",
								axisLine: false,
								tickLine: false,
								tick: {
									fill: "#94a3b8",
									fontSize: 12
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								axisLine: false,
								tickLine: false,
								tick: {
									fill: "#94a3b8",
									fontSize: 12
								},
								tickFormatter: (v) => `R$${v}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								formatter: (v) => [`R$ ${Number(v).toFixed(2)}`, "Receita"],
								contentStyle: {
									borderRadius: "12px",
									border: "none",
									boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
								type: "monotone",
								dataKey: "receita",
								stroke: "#22c55e",
								strokeWidth: 3,
								fillOpacity: 1,
								fill: "url(#colorReceita)"
							})
						]
					})
				})
			})]
		})] })]
	});
}
//#endregion
export { AdminFinanceiroIndex as component };
