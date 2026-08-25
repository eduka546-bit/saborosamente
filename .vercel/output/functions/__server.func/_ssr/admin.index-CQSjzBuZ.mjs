import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, A as ShoppingBag, H as Plus, Ht as CircleAlert, Nt as ClipboardList, T as Star, Xt as ChartNoAxesColumn, Y as Package, c as Users, h as TrendingUp, in as ArrowRight, jt as Clock, o as Utensils, p as Truck } from "../_libs/lucide-react.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createQueryConfig } from "./query-config-CV5KxvX3.mjs";
import { a as XAxis, c as Line, d as Legend, f as ResponsiveContainer, i as YAxis, l as CartesianGrid, n as BarChart, o as Bar, r as LineChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.index-CQSjzBuZ.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Calcula KPIs principais do negócio
*/
function calculateKPIs(orders, customers, previousOrders) {
	const totalRevenue = orders.reduce((sum, o) => sum + (o.valor_total || 0), 0);
	const totalOrders = orders.length;
	const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
	const conversionRate = customers.length > 0 ? totalOrders / (customers.length * 10) * 100 : 0;
	const customerOrders = {};
	orders.forEach((o) => {
		const cid = o.user_id || o.telefone_cliente;
		if (cid) customerOrders[cid] = (customerOrders[cid] || 0) + 1;
	});
	const recurringCustomers = Object.values(customerOrders).filter((qty) => qty > 1).length;
	const customerRetention = customers.length > 0 ? recurringCustomers / customers.length * 100 : 0;
	const hourMap = {};
	orders.forEach((o) => {
		const key = `${new Date(o.created_at).getHours()}:00`;
		hourMap[key] = (hourMap[key] || 0) + 1;
	});
	const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
	const paymentMap = {};
	orders.forEach((o) => {
		const method = o.metodo_pagamento || "indefinido";
		paymentMap[method] = (paymentMap[method] || 0) + 1;
	});
	const topPaymentMethod = Object.entries(paymentMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
	return {
		totalRevenue,
		totalOrders,
		averageOrderValue,
		conversionRate: Math.min(100, conversionRate),
		customerRetention: Math.min(100, customerRetention),
		peakHour,
		topPaymentMethod
	};
}
/**
* Agrupa dados de vendas por período (dia, semana, mês)
*/
function groupSalesByPeriod(orders, period = "day") {
	const groupMap = {};
	orders.forEach((order) => {
		const date = new Date(order.created_at);
		let key;
		if (period === "day") key = date.toLocaleDateString("pt-BR");
		else if (period === "week") {
			const weekStart = new Date(date);
			weekStart.setDate(date.getDate() - date.getDay());
			key = `Semana de ${weekStart.toLocaleDateString("pt-BR")}`;
		} else key = date.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric"
		});
		if (!groupMap[key]) groupMap[key] = {
			revenue: 0,
			orders: 0
		};
		groupMap[key].revenue += order.valor_total || 0;
		groupMap[key].orders += 1;
	});
	return Object.entries(groupMap).map(([date, data]) => ({
		date,
		...data
	})).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
/**
* Formata número para moeda brasileira
*/
function formatCurrency(value) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).format(value);
}
/**
* Formata percentual
*/
function formatPercent(value) {
	return `${Math.round(value)}%`;
}
var META_MENSAL = 1e4;
function AdminDashboard() {
	const { data: stats, isLoading } = useQuery({
		queryKey: ["admin-stats"],
		...createQueryConfig("dashboard"),
		queryFn: async () => {
			const today = /* @__PURE__ */ new Date();
			today.setHours(0, 0, 0, 0);
			const todayStr = today.toISOString();
			const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
			const last7Days = (/* @__PURE__ */ new Date(today.getTime() - 10080 * 60 * 1e3)).toISOString();
			const last30Days = (/* @__PURE__ */ new Date(today.getTime() - 720 * 60 * 60 * 1e3)).toISOString();
			const [ordersTodayRes, activeProductsRes, monthlyOrdersRes, recentOrdersRes, newClientsRes, pendingOrdersRes, topProductsRes, allOrdersLast7Res, allOrdersLast30Res, allOrdersItemsRes, lowStockRes, allCustomersRes] = await Promise.all([
				supabase.from("pedidos").select("*", {
					count: "exact",
					head: true
				}).gte("created_at", todayStr),
				supabase.from("produtos").select("*", {
					count: "exact",
					head: true
				}).eq("ativo", true),
				supabase.from("pedidos").select("valor_total,taxa_entrega,desconto_aplicado").gte("created_at", firstDayOfMonth).neq("status", "cancelado"),
				supabase.from("pedidos").select("id,nome_cliente,valor_total,status,created_at,endereco_bairro,metodo_entrega,origem").order("created_at", { ascending: false }).limit(8),
				supabase.from("profiles").select("id", {
					count: "exact",
					head: true
				}).gte("created_at", firstDayOfMonth),
				supabase.from("pedidos").select("*", {
					count: "exact",
					head: true
				}).eq("status", "preparando"),
				supabase.from("pedido_itens").select("produto_id,quantidade").limit(200),
				supabase.from("pedidos").select("id,valor_total,created_at,status").gte("created_at", last7Days).neq("status", "cancelado"),
				supabase.from("pedidos").select("id,valor_total,created_at,status").gte("created_at", last30Days).neq("status", "cancelado"),
				supabase.from("pedido_itens").select("preco_unitario,quantidade").gte("created_at", last30Days),
				supabase.from("produtos").select("id,nome,estoque").lt("estoque", 5),
				supabase.from("profiles").select("id", {
					count: "exact",
					head: true
				})
			]);
			const monthlyRevenue = (monthlyOrdersRes.data ?? []).reduce((acc, o) => acc + (Number(o.valor_total) || 0), 0);
			const last7Revenue = (allOrdersLast7Res.data ?? []).reduce((acc, o) => acc + (Number(o.valor_total) || 0), 0);
			const countMap = {};
			(topProductsRes.data ?? []).forEach((i) => {
				const id = i.produto_id;
				if (!id) return;
				if (!countMap[id]) countMap[id] = {
					nome: `Produto ${id.slice(0, 6)}`,
					qty: 0
				};
				countMap[id].qty += i.quantidade ?? 1;
			});
			const topProdutos = Object.values(countMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
			const salesData = groupSalesByPeriod(allOrdersLast30Res.data ?? [], "day");
			const kpis = calculateKPIs(monthlyOrdersRes.data ?? [], allCustomersRes.data ?? []);
			const lowStockProducts = (lowStockRes.data ?? []).slice(0, 5);
			return {
				ordersToday: ordersTodayRes.count ?? 0,
				activeProducts: activeProductsRes.count ?? 0,
				monthlyRevenue,
				last7Revenue,
				recentOrders: recentOrdersRes.data ?? [],
				newClients: newClientsRes.count ?? 0,
				pendingOrders: pendingOrdersRes.count ?? 0,
				topProdutos,
				salesData,
				kpis,
				lowStockProducts,
				allOrders: monthlyOrdersRes.data ?? []
			};
		}
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center min-h-[60vh]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-gray-500",
				children: "Carregando painel..."
			})]
		})
	});
	const pct = Math.min(100, Math.round((stats?.monthlyRevenue ?? 0) / META_MENSAL * 100));
	const statusColors = {
		preparando: "bg-blue-100 text-blue-700",
		pendente: "bg-yellow-100 text-yellow-700",
		"saiu para entrega": "bg-purple-100 text-purple-700",
		entregue: "bg-green-100 text-green-700",
		cancelado: "bg-red-100 text-red-700"
	};
	const fmt = (v) => v.toLocaleString("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	const skeleton = "animate-pulse bg-gray-200 rounded-lg h-7 w-20 inline-block";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-[1600px] px-4 py-8 md:py-10 space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-bold text-[#5850ec]",
				children: "Painel Administrativo"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-gray-500",
				children: "Bem-vindo ao centro de controle da Saborosamente."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					{
						label: "Pedidos Hoje",
						value: stats?.ordersToday,
						sub: `${stats?.pendingOrders ?? 0} em preparo`,
						icon: ClipboardList,
						color: "bg-[#5850ec]/10 text-[#5850ec]",
						href: "/admin/pedidos"
					},
					{
						label: "Produtos Ativos",
						value: stats?.activeProducts,
						sub: "no cardápio",
						icon: Utensils,
						color: "bg-orange-100 text-orange-600",
						href: "/admin/produtos"
					},
					{
						label: "Receita Mensal",
						value: stats?.monthlyRevenue !== void 0 ? `R$ ${fmt(stats.monthlyRevenue)}` : void 0,
						sub: `Meta: R$ ${fmt(META_MENSAL)}`,
						icon: TrendingUp,
						color: "bg-green-100 text-green-600",
						href: "/admin/relatorios"
					},
					{
						label: "Novos Clientes",
						value: stats?.newClients,
						sub: "este mês",
						icon: Users,
						color: "bg-blue-100 text-blue-600",
						href: "/admin/clientes"
					}
				].map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: card.href,
					className: "rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-[#5850ec]/30 transition-all group",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `h-11 w-11 rounded-xl ${card.color} flex items-center justify-center shrink-0`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(card.icon, { size: 22 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								size: 16,
								className: "text-gray-300 group-hover:text-[#5850ec] transition-colors mt-1"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1",
							children: card.label
						}),
						isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: skeleton }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-black text-gray-900",
							children: card.value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400 mt-1",
							children: card.sub
						})
					]
				}, card.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					{
						label: "Vendas 7 Dias",
						value: stats?.last7Revenue || 0,
						sub: "últimos 7 dias",
						icon: ChartNoAxesColumn,
						color: "bg-emerald-100 text-emerald-600"
					},
					{
						label: "Vendas 30 Dias",
						value: stats?.monthlyRevenue || 0,
						sub: "últimos 30 dias",
						icon: TrendingUp,
						color: "bg-blue-100 text-blue-600"
					},
					{
						label: "Ticket Médio",
						value: stats?.kpis?.averageOrderValue || 0,
						sub: "por pedido",
						icon: ShoppingBag,
						color: "bg-purple-100 text-purple-600",
						isCurrency: true
					},
					{
						label: "Taxa Retenção",
						value: `${Math.round(stats?.kpis?.customerRetention || 0)}%`,
						sub: "clientes recorrentes",
						icon: Users,
						color: "bg-pink-100 text-pink-600"
					}
				].map((card, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border bg-white p-6 shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-start justify-between mb-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `h-11 w-11 rounded-xl ${card.color} flex items-center justify-center shrink-0`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(card.icon, { size: 22 })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1",
							children: card.label
						}),
						isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: skeleton }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-black text-gray-900",
							children: typeof card.value === "number" && card.isCurrency ? `R$ ${fmt(card.value)}` : card.value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400 mt-1",
							children: card.sub
						})
					]
				}, idx))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[1fr_380px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border shadow-sm overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-6 py-4 border-b flex justify-between items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-bold text-gray-800 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
								className: "text-[#5850ec]",
								size: 18
							}), " Últimos Pedidos"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin/pedidos",
							className: "text-xs font-bold text-[#5850ec] uppercase hover:underline flex items-center gap-1",
							children: ["Ver todos ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 12 })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "divide-y",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-8 flex justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-6 w-6 border-2 border-[#5850ec] border-t-transparent" })
						}) : (stats?.recentOrders.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-10 text-center text-gray-400 text-sm",
							children: "Nenhum pedido ainda"
						}) : stats?.recentOrders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin/pedidos",
							className: "px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0",
									children: order.origem === "whatsapp" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
										size: 15,
										className: "text-green-600"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, {
										size: 15,
										className: "text-gray-400"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-bold text-gray-900",
									children: ["#", order.id.slice(0, 8)]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-gray-500",
									children: [
										order.nome_cliente || "Cliente",
										" · ",
										order.metodo_entrega === "entrega" ? `${order.endereco_bairro ?? "Entrega"}` : "Retirada",
										order.origem === "whatsapp" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1 text-green-600",
											children: "· WA"
										})
									]
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right shrink-0 ml-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-bold text-gray-900",
									children: ["R$ ", fmt(order.valor_total)]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`,
									children: order.status
								})]
							})]
						}, order.id))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-[#5850ec] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-base font-bold mb-1",
									children: "Acesso Rápido"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-white/70 text-xs mb-5",
									children: "Gerencie seu negócio de forma eficiente."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [
										{
											label: "Novo Produto",
											icon: Plus,
											href: "/admin/produtos"
										},
										{
											label: "Ver Pedidos",
											icon: ShoppingBag,
											href: "/admin/pedidos"
										},
										{
											label: "Relatórios",
											icon: ChartNoAxesColumn,
											href: "/admin/relatorios"
										},
										{
											label: "Entregas",
											icon: Truck,
											href: "/admin/config/taxas"
										}
									].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: item.href,
										className: "bg-white/10 hover:bg-white/20 p-3.5 rounded-xl transition-all border border-white/20 flex items-center gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
											size: 18,
											className: "shrink-0"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-bold",
											children: item.label
										})]
									}, item.label))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -right-8 -bottom-8 h-32 w-32 bg-white/10 rounded-full blur-2xl pointer-events-none" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-2xl border p-6 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-gray-800",
										children: "Meta Mensal"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
										className: pct >= 100 ? "text-green-500" : "text-[#5850ec]",
										size: 20
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-end mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-2xl font-black text-[#5850ec]",
										children: [pct, "%"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-gray-400 mt-0.5",
										children: [
											isLoading ? "..." : `R$ ${fmt(stats?.monthlyRevenue ?? 0)}`,
											" de R$ ",
											fmt(META_MENSAL)
										]
									})] }), pct >= 100 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full",
										children: "✓ Meta atingida!"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-2.5 w-full bg-gray-100 rounded-full overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-green-500" : "bg-[#5850ec]"}`,
										style: { width: `${Math.min(pct, 100)}%` }
									})
								})
							]
						}),
						(stats?.topProdutos?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-2xl border p-5 shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-bold text-gray-800 flex items-center gap-2 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
									size: 16,
									className: "text-yellow-500"
								}), " Mais Vendidos"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2",
								children: stats?.topProdutos.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-black text-gray-300 w-4",
											children: i + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-semibold text-gray-800 truncate",
												children: p.nome
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full bg-[#5850ec] rounded-full",
													style: { width: `${Math.min(100, p.qty / (stats.topProdutos[0]?.qty ?? 1) * 100)}%` }
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-bold text-gray-500 shrink-0",
											children: [p.qty, "x"]
										})
									]
								}, i))
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border shadow-sm p-6 lg:col-span-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-bold text-gray-800 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartNoAxesColumn, {
								className: "text-emerald-600",
								size: 18
							}), " Últimos 7 Dias"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400 mt-1",
							children: "Receita diária"
						})]
					}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-64 flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-6 w-6 border-2 border-[#5850ec] border-t-transparent" })
					}) : (stats?.salesData?.length ?? 0) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: 250,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data: stats.salesData.slice(-7),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "#e5e7eb"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "date",
									stroke: "#9ca3af",
									style: { fontSize: "11px" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "#9ca3af",
									style: { fontSize: "11px" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									formatter: (value) => formatCurrency(value),
									contentStyle: {
										backgroundColor: "#fff",
										border: "1px solid #e5e7eb",
										borderRadius: "8px"
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "revenue",
									fill: "#10b981",
									name: "Receita (R$)"
								})
							]
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-64 flex items-center justify-center text-gray-400",
						children: "Sem dados"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border shadow-sm p-6 lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-bold text-gray-800 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
								className: "text-[#5850ec]",
								size: 18
							}), " Vendas - Últimos 30 Dias"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400 mt-1",
							children: "Receita diária"
						})]
					}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-64 flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-6 w-6 border-2 border-[#5850ec] border-t-transparent" })
					}) : (stats?.salesData?.length ?? 0) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: 300,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data: stats.salesData,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "#e5e7eb"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "date",
									stroke: "#9ca3af",
									style: { fontSize: "12px" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "#9ca3af",
									style: { fontSize: "12px" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									formatter: (value) => formatCurrency(value),
									contentStyle: {
										backgroundColor: "#fff",
										border: "1px solid #e5e7eb",
										borderRadius: "8px"
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "revenue",
									stroke: "#5850ec",
									dot: {
										fill: "#5850ec",
										r: 4
									},
									activeDot: { r: 6 },
									name: "Receita (R$)"
								})
							]
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-64 flex items-center justify-center text-gray-400",
						children: "Sem dados"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border shadow-sm p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-gray-800 mb-4",
						children: "KPIs Principais"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center pb-3 border-b",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-gray-600",
									children: "Ticket Médio"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-lg text-[#5850ec]",
									children: isLoading ? "..." : formatCurrency(stats?.kpis?.averageOrderValue ?? 0)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center pb-3 border-b",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-gray-600",
									children: "Taxa de Retenção"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-lg text-green-600",
									children: isLoading ? "..." : formatPercent(stats?.kpis?.customerRetention ?? 0)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center pb-3 border-b",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-gray-600",
									children: "Hora de Pico"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-lg text-orange-600",
									children: isLoading ? "..." : stats?.kpis?.peakHour
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-gray-600",
									children: "Pagamento Preferido"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-lg text-blue-600",
									children: isLoading ? "..." : stats?.kpis?.topPaymentMethod
								})]
							})
						]
					})]
				}), (stats?.lowStockProducts?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-red-50 rounded-2xl border border-red-200 shadow-sm p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-red-900 flex items-center gap-2 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 18 }), " Estoque Baixo"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: stats?.lowStockProducts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-red-800",
								children: p.nome
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold text-red-600",
								children: [p.estoque, " un."]
							})]
						}, p.id))
					})]
				})]
			})
		]
	});
}
//#endregion
export { AdminDashboard as component };
