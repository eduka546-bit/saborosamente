import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, c as Users, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/comunicacao-CERzi3Sh.js
var import_jsx_runtime = require_jsx_runtime();
function AdminRelatoriosComunicacaoPage() {
	const { data: orders = [], isLoading } = useQuery({
		queryKey: ["comunicacao-orders"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedidos").select("telefone_cliente, nome_cliente, valor_total, created_at, status").neq("status", "Cancelado").order("created_at", { ascending: false }).limit(500);
			if (error) throw error;
			return data;
		}
	});
	const uniquePhones = [...new Set(orders.map((o) => o.telefone_cliente).filter(Boolean))];
	const generateWhatsAppList = () => {
		const lines = uniquePhones.map((phone) => `https://wa.me/55${phone?.replace(/\D/g, "")}`).join("\n");
		const blob = new Blob([lines], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "contatos_whatsapp.txt";
		a.click();
		URL.revokeObjectURL(url);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Comunicação"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Base de contatos para campanhas e mensagens."
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
				className: "grid grid-cols-2 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
								className: "text-[#5850ec]",
								size: 20
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase text-gray-400",
								children: "Contatos únicos (WhatsApp)"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-black text-[#5850ec]",
							children: uniquePhones.length
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: generateWhatsAppList,
							className: "mt-3 text-xs font-bold text-[#5850ec] hover:underline flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 13 }), " Exportar lista de links"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 mb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
							className: "text-green-600",
							size: 20
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Pedidos com telefone"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-3xl font-black text-green-600",
						children: orders.filter((o) => o.telefone_cliente).length
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-6 py-4 border-b flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-gray-800",
						children: "Últimos clientes"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-gray-400",
						children: [orders.length, " registros"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Telefone"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Link WhatsApp"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y",
						children: orders.slice(0, 50).map((o, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-3 font-medium text-gray-900",
									children: o.nome_cliente ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-3 text-gray-500",
									children: o.telefone_cliente ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-3",
									children: o.telefone_cliente && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: `https://wa.me/55${o.telefone_cliente.replace(/\D/g, "")}`,
										target: "_blank",
										rel: "noopener noreferrer",
										className: "text-green-600 font-bold text-xs hover:underline flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { size: 12 }), " Abrir"]
									})
								})
							]
						}, i))
					})]
				})]
			})]
		})]
	});
}
//#endregion
export { AdminRelatoriosComunicacaoPage as component };
