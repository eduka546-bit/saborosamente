import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { ct as LoaderCircle, h as TrendingUp, jt as Clock, kt as CreditCard, rt as MapPin } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inteligencia-C65-hahL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminRelatoriosInteligenciaPage() {
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["inteligencia-orders"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("valor_total, created_at, status, endereco_bairro, endereco_cidade, metodo_pagamento").neq("status", "cancelado");
			if (error) throw error;
			return data;
		}
	});
	const insights = (0, import_react.useMemo)(() => {
		if (!orders.length) return null;
		const hourCounts = Array(24).fill(0);
		orders.forEach((o) => hourCounts[new Date(o.created_at).getHours()]++);
		const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
		const dayCounts = Array(7).fill(0);
		orders.forEach((o) => dayCounts[new Date(o.created_at).getDay()]++);
		const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
		const dayNames = [
			"Domingo",
			"Segunda",
			"Terça",
			"Quarta",
			"Quinta",
			"Sexta",
			"Sábado"
		];
		const bairroMap = /* @__PURE__ */ new Map();
		orders.forEach((o) => {
			if (o.endereco_bairro) bairroMap.set(o.endereco_bairro, (bairroMap.get(o.endereco_bairro) ?? 0) + 1);
		});
		const topBairro = [...bairroMap.entries()].sort((a, b) => b[1] - a[1])[0];
		const pagMap = /* @__PURE__ */ new Map();
		orders.forEach((o) => {
			const k = o.metodo_pagamento ?? "Não informado";
			pagMap.set(k, (pagMap.get(k) ?? 0) + 1);
		});
		const topPag = [...pagMap.entries()].sort((a, b) => b[1] - a[1])[0];
		const ticket = orders.reduce((s, o) => s + (o.valor_total ?? 0), 0) / orders.length;
		return {
			peakHour,
			peakDay: dayNames[peakDay],
			topBairro,
			topPag,
			ticket
		};
	}, [orders]);
	const cards = insights ? [
		{
			icon: Clock,
			label: "Hora de pico",
			value: `${insights.peakHour}h–${insights.peakHour + 1}h`,
			color: "text-blue-600",
			bg: "bg-blue-50"
		},
		{
			icon: TrendingUp,
			label: "Dia mais movimentado",
			value: insights.peakDay,
			color: "text-purple-600",
			bg: "bg-purple-50"
		},
		{
			icon: MapPin,
			label: "Bairro mais atendido",
			value: insights.topBairro?.[0] ?? "—",
			color: "text-green-600",
			bg: "bg-green-50"
		},
		{
			icon: CreditCard,
			label: "Pagamento preferido",
			value: insights.topPag?.[0] ?? "—",
			color: "text-orange-600",
			bg: "bg-orange-50"
		}
	] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Inteligência de Mercado"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Insights automáticos baseados nos dados reais dos pedidos."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : !insights ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bg-white rounded-2xl border border-dashed p-20 text-center text-gray-400",
			children: "Dados insuficientes para gerar insights."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 lg:grid-cols-4 gap-4",
				children: cards.map((card, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-xl border p-5 ${card.bg}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(card.icon, {
							size: 18,
							className: card.color
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-500",
							children: card.label
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `text-xl font-black ${card.color}`,
						children: card.value
					})]
				}, i))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-gray-800 mb-4",
						children: "Ticket Médio Global"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-4xl font-black text-[#5850ec]",
						children: ["R$ ", insights.ticket.toFixed(2).replace(".", ",")]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-gray-400 mt-1",
						children: [
							"Baseado em ",
							orders.length,
							" pedidos não cancelados"
						]
					})
				]
			})]
		})]
	});
}
//#endregion
export { AdminRelatoriosInteligenciaPage as component };
