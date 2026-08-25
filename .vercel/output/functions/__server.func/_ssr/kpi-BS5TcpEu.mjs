import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Dt as DollarSign, T as Star, Y as Package, Zt as ChartColumn, c as Users, ct as LoaderCircle, h as TrendingUp, rt as MapPin } from "../_libs/lucide-react.mjs";
import { a as XAxis, c as Line, f as ResponsiveContainer, i as YAxis, l as CartesianGrid, n as BarChart, o as Bar, r as LineChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
import { c as startOfMonth, o as format, r as subDays, t as ptBR, u as eachDayOfInterval } from "../_libs/date-fns.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-BXjpJ96D.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kpi-BS5TcpEu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminRelatoriosKpiPage() {
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["kpi-orders"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("id, valor_total, taxa_entrega, created_at, status, user_id, endereco_cidade, endereco_bairro").order("created_at", { ascending: true });
			if (error) throw error;
			return data;
		}
	});
	const { data: clients = [] } = useQuery({
		queryKey: ["kpi-clients"],
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("id, created_at");
			if (error) throw error;
			return data;
		}
	});
	const { data: itens = [] } = useQuery({
		queryKey: ["kpi-itens"],
		queryFn: async () => {
			const monthStart = startOfMonth(/* @__PURE__ */ new Date()).toISOString();
			const { data } = await supabase.from("pedido_itens").select("quantidade, produto_id, preco_unitario, produtos:produto_id(nome)").gte("created_at", monthStart);
			return data ?? [];
		}
	});
	const stats = (0, import_react.useMemo)(() => {
		const now = /* @__PURE__ */ new Date();
		const curr30Start = subDays(now, 30).toISOString();
		const prev30Start = subDays(now, 60).toISOString();
		const monthStart = startOfMonth(now).toISOString();
		const notCancelled = orders.filter((o) => o.status !== "cancelado");
		const curr = notCancelled.filter((o) => o.created_at >= curr30Start);
		const prev = notCancelled.filter((o) => o.created_at >= prev30Start && o.created_at < curr30Start);
		const thisMonth = notCancelled.filter((o) => o.created_at >= monthStart);
		const ticketMedio = curr.length ? curr.reduce((s, o) => s + (o.valor_total || 0), 0) / curr.length : 0;
		const prevTicket = prev.length ? prev.reduce((s, o) => s + (o.valor_total || 0), 0) / prev.length : 0;
		const ticketTrend = prevTicket > 0 ? (ticketMedio - prevTicket) / prevTicket * 100 : 0;
		const clientOrderCount = /* @__PURE__ */ new Map();
		notCancelled.forEach((o) => {
			if (o.user_id) clientOrderCount.set(o.user_id, (clientOrderCount.get(o.user_id) || 0) + 1);
		});
		const retornantes = [...clientOrderCount.values()].filter((c) => c > 1).length;
		const retencao = clientOrderCount.size > 0 ? retornantes / clientOrderCount.size * 100 : 0;
		const monthRevenue = thisMonth.reduce((s, o) => s + (o.valor_total || 0), 0);
		const salesChart = eachDayOfInterval({
			start: subDays(now, 29),
			end: now
		}).map((day) => {
			const key = format(day, "yyyy-MM-dd");
			const dayOrders = notCancelled.filter((o) => format(new Date(o.created_at), "yyyy-MM-dd") === key);
			return {
				name: format(day, "dd/MM", { locale: ptBR }),
				vendas: dayOrders.reduce((s, o) => s + (o.valor_total || 0), 0),
				pedidos: dayOrders.length
			};
		});
		const prodMap = {};
		itens.forEach((item) => {
			const id = item.produto_id;
			if (!id) return;
			if (!prodMap[id]) prodMap[id] = {
				nome: item.produtos?.nome ?? "Produto",
				qty: 0,
				receita: 0
			};
			prodMap[id].qty += item.quantidade ?? 1;
			prodMap[id].receita += (item.preco_unitario ?? 0) * (item.quantidade ?? 1);
		});
		const topProdutos = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 8);
		const cidadeMap = {};
		thisMonth.forEach((o) => {
			if (o.endereco_cidade) cidadeMap[o.endereco_cidade] = (cidadeMap[o.endereco_cidade] || 0) + (o.valor_total || 0);
		});
		const receitaCidade = Object.entries(cidadeMap).map(([cidade, receita]) => ({
			cidade,
			receita
		})).sort((a, b) => b.receita - a.receita).slice(0, 8);
		return {
			ticketMedio,
			ticketTrend,
			retencao,
			monthRevenue,
			totalOrders: notCancelled.length,
			salesChart,
			topProdutos,
			receitaCidade
		};
	}, [
		orders,
		clients,
		itens
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "KPI e Indicadores"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Métricas reais baseadas nos pedidos do banco de dados."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
							children: "Ticket Médio (30d)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "h-4 w-4 text-[#5850ec]" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-2xl font-black",
						children: ["R$ ", stats.ticketMedio.toFixed(2).replace(".", ",")]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground mt-1 font-bold",
						children: [
							stats.ticketTrend >= 0 ? "+" : "",
							stats.ticketTrend.toFixed(1),
							"% vs 30d anteriores"
						]
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
							children: "Taxa de Retenção"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4 text-[#5850ec]" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-2xl font-black",
						children: [stats.retencao.toFixed(1), "%"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground mt-1 font-bold",
						children: "Clientes com +1 compra"
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
							children: "Receita do Mês"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4 text-[#5850ec]" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-2xl font-black",
						children: ["R$ ", stats.monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground mt-1 font-bold",
						children: "Pedidos não cancelados"
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-bold text-gray-400 uppercase tracking-widest",
							children: "Total de Pedidos"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4 text-[#5850ec]" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl font-black",
						children: stats.totalOrders
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground mt-1 font-bold",
						children: "Histórico completo"
					})] })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid md:grid-cols-2 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl shadow-sm border p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-gray-800 mb-6 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, {
							className: "text-[#5850ec]",
							size: 20
						}), " Receita Diária (30 dias)"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-[300px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: stats.salesChart,
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
										tick: { fontSize: 10 },
										tickFormatter: (v) => `R$${v}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => [`R$ ${Number(v).toFixed(2)}`, "Receita"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "vendas",
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
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl shadow-sm border p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-gray-800 mb-6 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
							className: "text-[#5850ec]",
							size: 20
						}), " Pedidos por Dia (30 dias)"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-[300px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
								data: stats.salesChart,
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
										tick: { fontSize: 10 },
										allowDecimals: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										type: "monotone",
										dataKey: "pedidos",
										stroke: "#5850ec",
										strokeWidth: 2,
										dot: false
									})
								]
							})
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid md:grid-cols-2 gap-6 mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl shadow-sm border p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-gray-800 mb-4 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
							className: "text-yellow-500",
							size: 18
						}), " Top Produtos do Mês"]
					}), stats.topProdutos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-400 text-sm text-center py-8",
						children: "Nenhum dado ainda"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: stats.topProdutos.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-black text-gray-300 w-4",
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-semibold text-gray-800 truncate",
											children: p.nome
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-bold text-gray-500 shrink-0 ml-2",
											children: [p.qty, "x"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-1.5 bg-gray-100 rounded-full overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full bg-[#5850ec] rounded-full",
											style: { width: `${p.qty / (stats.topProdutos[0]?.qty || 1) * 100}%` }
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-bold text-green-600 shrink-0",
									children: ["R$ ", p.receita.toFixed(0)]
								})
							]
						}, i))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl shadow-sm border p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-gray-800 mb-4 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
							className: "text-[#5850ec]",
							size: 18
						}), " Receita por Cidade (mês)"]
					}), stats.receitaCidade.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-400 text-sm text-center py-8",
						children: "Nenhum dado ainda"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-[220px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: stats.receitaCidade,
								layout: "vertical",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										horizontal: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										type: "number",
										tick: { fontSize: 10 },
										tickFormatter: (v) => `R$${v}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										type: "category",
										dataKey: "cidade",
										tick: { fontSize: 10 },
										width: 90
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => [`R$ ${Number(v).toFixed(2)}`, "Receita"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "receita",
										fill: "#00a884",
										radius: [
											0,
											4,
											4,
											0
										]
									})
								]
							})
						})
					})]
				})]
			})
		] })]
	});
}
//#endregion
export { AdminRelatoriosKpiPage as component };
