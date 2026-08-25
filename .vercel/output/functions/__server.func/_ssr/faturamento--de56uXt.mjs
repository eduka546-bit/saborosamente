import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Et as Download, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { a as XAxis, f as ResponsiveContainer, i as YAxis, l as CartesianGrid, n as BarChart, o as Bar, u as Tooltip } from "../_libs/recharts+[...].mjs";
import { l as eachMonthOfInterval, o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/faturamento--de56uXt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminRelatoriosFaturamentoPage() {
	const [year, setYear] = (0, import_react.useState)(2024);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setYear((/* @__PURE__ */ new Date()).getFullYear());
		setMounted(true);
	}, []);
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["relatorio-faturamento", year],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("valor_total, created_at, status").gte("created_at", `${year}-01-01`).lte("created_at", `${year}-12-31`).neq("status", "Cancelado");
			if (error) throw error;
			return data;
		}
	});
	const chartData = (0, import_react.useMemo)(() => {
		return eachMonthOfInterval({
			start: new Date(year, 0, 1),
			end: new Date(year, 11, 31)
		}).map((month) => {
			const key = format(month, "yyyy-MM");
			const monthOrders = orders.filter((o) => o.created_at.startsWith(key));
			const receita = monthOrders.reduce((s, o) => s + (o.valor_total ?? 0), 0);
			return {
				name: format(month, "MMM", { locale: ptBR }),
				receita,
				pedidos: monthOrders.length
			};
		});
	}, [orders, year]);
	const total = orders.reduce((s, o) => s + (o.valor_total ?? 0), 0);
	const exportCSV = () => {
		const rows = chartData.map((d) => `${d.name},${d.receita.toFixed(2)},${d.pedidos}`).join("\n");
		const blob = new Blob([`Mês,Receita,Pedidos\n${rows}`], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `faturamento_${year}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Faturamento e Evolução"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Receita mensal ao longo do ano."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: year,
						onChange: (e) => setYear(Number(e.target.value)),
						className: "h-10 px-3 rounded-md border border-input bg-white text-sm font-bold",
						children: [
							2024,
							2025,
							2026
						].map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: y,
							children: y
						}, y))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: exportCSV,
						variant: "outline",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 16 }), " CSV"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-bold uppercase text-gray-400",
					children: ["Total ", year]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-3xl font-black text-green-600",
					children: ["R$ ", total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[350px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data: chartData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									strokeDasharray: "3 3",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, { dataKey: "name" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tickFormatter: (v) => `R$${v}` }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => [`R$ ${Number(v).toFixed(2)}`, "Receita"] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "receita",
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
				})
			})
		]
	});
}
//#endregion
export { AdminRelatoriosFaturamentoPage as component };
