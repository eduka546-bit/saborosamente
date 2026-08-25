import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, Dt as DollarSign, F as Search, Gt as ChevronLeft, Qt as Calendar, St as Eye, U as Phone, Wt as ChevronRight, _t as Funnel, c as Users, ct as LoaderCircle, d as Upload, gt as Gift, i as X, it as Mail, rt as MapPin } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as importExistingCustomers } from "./customers.functions-COVFPeM4.mjs";
import { t as createQueryConfig } from "./query-config-CV5KxvX3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.clientes-CQ5g-vtr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) {
	const pages = [];
	const maxPagesToShow = 7;
	let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
	let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
	if (endPage - startPage < maxPagesToShow - 1) startPage = Math.max(1, endPage - maxPagesToShow + 1);
	if (startPage > 1) {
		pages.push(1);
		if (startPage > 2) pages.push(-1);
	}
	for (let i = startPage; i <= endPage; i++) pages.push(i);
	if (endPage < totalPages) {
		if (endPage < totalPages - 1) pages.push(-1);
		pages.push(totalPages);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between mt-6 pt-4 border-t border-gray-200",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-gray-500 font-medium",
			children: itemsPerPage && totalItems && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				"Mostrando",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold",
					children: (currentPage - 1) * itemsPerPage + 1
				}),
				" ",
				"a",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold",
					children: Math.min(currentPage * itemsPerPage, totalItems)
				}),
				" ",
				"de",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold",
					children: totalItems
				}),
				" ",
				"itens"
			] })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => onPageChange(currentPage - 1),
					disabled: currentPage === 1,
					className: "h-8 w-8 p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 16 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1",
					children: pages.map((page, idx) => page === -1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "px-2 py-1 text-gray-400",
						children: "..."
					}, `ellipsis-${idx}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: page === currentPage ? "default" : "outline",
						size: "sm",
						onClick: () => onPageChange(page),
						className: `h-8 w-8 p-0 text-xs font-bold ${page === currentPage ? "bg-[#5850ec] border-[#5850ec]" : ""}`,
						children: page
					}, page))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => onPageChange(currentPage + 1),
					disabled: currentPage === totalPages,
					className: "h-8 w-8 p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16 })
				})
			]
		})]
	});
}
function CashbackCliente({ userId }) {
	const { data } = useQuery({
		queryKey: ["cashback-cliente", userId],
		...createQueryConfig("clients"),
		queryFn: async () => {
			const { data } = await supabase.from("cashback_saldo").select("saldo").eq("user_id", userId).maybeSingle();
			return Number(data?.saldo ?? 0);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, {
			size: 15,
			className: "text-yellow-600"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "font-bold text-yellow-700",
			children: ["Cashback: R$ ", (data ?? 0).toFixed(2)]
		})]
	});
}
function AdminClientesPage() {
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [selectedClient, setSelectedClient] = (0, import_react.useState)(null);
	const [isImporting, setIsImporting] = (0, import_react.useState)(false);
	const [currentPage, setCurrentPage] = (0, import_react.useState)(1);
	const itemsPerPage = 10;
	const importFn = useServerFn(importExistingCustomers);
	const { data: clients = [], isLoading } = useQuery({
		queryKey: ["admin-clients"],
		...createQueryConfig("clients"),
		queryFn: async () => {
			console.log("Iniciando busca de perfis...");
			const { data: profiles, error: profileError } = await supabase.from("profiles").select("*").order("nome", { ascending: true });
			if (profileError) {
				console.error("Erro ao buscar perfis:", profileError);
				toast.error("Erro ao carregar perfis: " + profileError.message);
				throw profileError;
			}
			console.log("Perfis encontrados no banco:", profiles?.length);
			const { data: orders, error: orderError } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
			if (orderError) throw orderError;
			const clientMap = /* @__PURE__ */ new Map();
			profiles?.forEach((profile) => {
				clientMap.set(profile.id, {
					id: profile.id,
					nome: profile.nome,
					telefone: profile.telefone,
					email: profile.email || "Não informado",
					cpf: profile.cpf,
					bairro: profile.bairro,
					totalPedidos: 0,
					valorGasto: 0,
					ultimoPedido: null,
					pedidos: []
				});
			});
			orders?.forEach((order) => {
				const key = order.user_id || order.email_cliente || order.telefone_cliente;
				if (!clientMap.has(key)) clientMap.set(key, {
					nome: order.nome_cliente,
					telefone: order.telefone_cliente,
					email: order.email_cliente || "Não informado",
					totalPedidos: 1,
					valorGasto: order.valor_total || 0,
					ultimoPedido: order.created_at,
					pedidos: [order]
				});
				else {
					const existing = clientMap.get(key);
					existing.totalPedidos += 1;
					existing.valorGasto += order.valor_total || 0;
					existing.pedidos.push(order);
					if (!existing.ultimoPedido || new Date(order.created_at) > new Date(existing.ultimoPedido)) existing.ultimoPedido = order.created_at;
				}
			});
			return Array.from(clientMap.values());
		}
	});
	const filteredClients = (0, import_react.useMemo)(() => {
		return clients.filter((c) => c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefone?.includes(searchTerm));
	}, [clients, searchTerm]);
	const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
	const paginatedClients = (0, import_react.useMemo)(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredClients.slice(start, start + itemsPerPage);
	}, [
		filteredClients,
		currentPage,
		itemsPerPage
	]);
	const handleImport = async () => {
		try {
			setIsImporting(true);
			const result = await importFn();
			if (result && (result.success || result.errors)) toast.success(`Importação concluída: ${result.success} sucessos, ${result.errors} erros/pulados.`, { duration: 5e3 });
		} catch (error) {
			toast.error("Falha ao iniciar importação: " + error.message);
		} finally {
			setIsImporting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Clientes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Gerencie sua base de clientes e histórico de compras."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: handleImport,
					disabled: isImporting,
					className: "bg-[#086e45] hover:bg-[#065a38] text-white flex items-center gap-2",
					children: [isImporting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 18,
						className: "animate-spin"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 18 }), "Importar Clientes Antigos"]
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
							placeholder: "Buscar por nome ou telefone...",
							className: "pl-10 rounded-lg border-gray-200",
							value: searchTerm,
							onChange: (e) => setSearchTerm(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "flex items-center gap-2 rounded-lg border-gray-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { size: 18 }), " Filtros"]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Pedidos"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Total Gasto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Última Compra"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 text-center",
								children: "Ações"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y divide-gray-100",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 5,
							className: "p-8 text-center",
							children: "Carregando clientes..."
						}) }) : paginatedClients.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 5,
							className: "p-8 text-center text-gray-400",
							children: "Nenhum cliente encontrado."
						}) }) : paginatedClients.map((client, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50/50 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-bold text-gray-900",
											children: client.nome || "Cliente Final"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] text-gray-400 font-medium",
											children: client.email
										})] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 text-sm font-medium",
									children: [client.totalPedidos, " pedidos"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 text-sm font-bold text-green-600",
									children: ["R$ ", client.valorGasto.toFixed(2).replace(".", ",")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-sm text-gray-500",
									children: client.ultimoPedido ? new Date(client.ultimoPedido).toLocaleDateString("pt-BR") : "N/A"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 rounded-full",
										onClick: () => setSelectedClient(client),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 16 })
									})
								})
							]
						}, idx))
					})]
				})
			}),
			totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
				currentPage,
				totalPages,
				onPageChange: setCurrentPage,
				itemsPerPage,
				totalItems: filteredClients.length
			}),
			selectedClient && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-end z-50",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white h-full w-full max-w-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-bold text-[#5850ec]",
								children: "Detalhes do Cliente"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => setSelectedClient(null),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 24 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-[#5850ec]/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-20 w-20 rounded-full bg-[#5850ec] flex items-center justify-center text-white text-3xl font-bold shrink-0",
								children: selectedClient.nome?.charAt(0) || "C"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xl font-bold text-gray-900",
									children: selectedClient.nome
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-4 text-sm text-gray-500 font-medium",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
													size: 14,
													className: "text-[#5850ec]"
												}),
												" ",
												selectedClient.telefone
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
													size: 14,
													className: "text-[#5850ec]"
												}),
												" ",
												selectedClient.email
											]
										}),
										selectedClient.cpf && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, {
													size: 14,
													className: "text-[#5850ec]"
												}),
												" CPF: ",
												selectedClient.cpf
											]
										}),
										selectedClient.bairro && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1 w-full md:w-auto",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
													size: 14,
													className: "text-[#5850ec]"
												}),
												" Bairro: ",
												selectedClient.bairro
											]
										})
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white border rounded-xl p-4 shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1",
										children: "Total Pedidos"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-black text-gray-900",
										children: selectedClient.totalPedidos
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white border rounded-xl p-4 shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1",
										children: "Total Gasto"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-lg font-black text-green-600",
										children: ["R$ ", selectedClient.valorGasto.toFixed(2)]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white border rounded-xl p-4 shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1",
										children: "Ticket Médio"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-lg font-black text-[#5850ec]",
										children: ["R$ ", selectedClient.totalPedidos > 0 ? (selectedClient.valorGasto / selectedClient.totalPedidos).toFixed(2) : "0,00"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white border rounded-xl p-4 shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1",
										children: "Último Pedido"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-bold text-gray-700",
										children: selectedClient.ultimoPedido ? new Date(selectedClient.ultimoPedido).toLocaleDateString("pt-BR") : "N/A"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 mb-6",
							children: [selectedClient.telefone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `https://wa.me/${selectedClient.telefone.replace(/\D/g, "")}`,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 15 }), " WhatsApp"]
							}), selectedClient.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CashbackCliente, { userId: selectedClient.id })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-lg font-bold text-gray-900 mb-4",
							children: "Histórico de Pedidos"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4",
							children: selectedClient.pedidos.map((pedido) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border rounded-xl p-4 hover:border-[#5850ec]/30 transition-colors",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-start mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm font-bold text-gray-900 flex items-center gap-2",
										children: [
											"Pedido #",
											pedido.id.slice(0, 8),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none",
												children: pedido.status
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-gray-400 flex items-center gap-1 mt-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { size: 12 }),
											" ",
											new Date(pedido.created_at).toLocaleString("pt-BR")
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-bold text-[#5850ec]",
										children: ["R$ ", pedido.valor_total.toFixed(2)]
									})]
								})
							}, pedido.id))
						})
					]
				})
			})
		]
	});
}
//#endregion
export { AdminClientesPage as component };
