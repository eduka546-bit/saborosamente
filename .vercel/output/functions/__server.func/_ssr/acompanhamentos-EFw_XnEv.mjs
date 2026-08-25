import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { ct as LoaderCircle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/acompanhamentos-EFw_XnEv.js
var import_jsx_runtime = require_jsx_runtime();
function AdminPedidosAcompanhamentosPage() {
	const { data = [], isLoading } = useQuery({
		queryKey: ["pedidos-acompanhamentos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedido_itens").select("observacao, quantidade, produtos(nome), pedidos(created_at, status)").not("observacao", "is", null).neq("observacao", "").order("created_at", {
				foreignTable: "pedidos",
				ascending: false
			}).limit(200);
			if (error) throw error;
			return data;
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Acompanhamentos Solicitados"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Observações e acompanhamentos pedidos pelos clientes."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bg-white rounded-2xl border border-dashed p-16 text-center text-gray-400",
			children: "Nenhuma observação registrada."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bg-white rounded-xl border overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-sm text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-6 py-4",
							children: "Produto"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-6 py-4",
							children: "Observação / Acompanhamento"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-6 py-4",
							children: "Qtd"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-6 py-4",
							children: "Data"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y",
					children: data.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "hover:bg-gray-50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-6 py-4 font-semibold text-gray-900",
								children: item.produtos?.nome ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-6 py-4 text-gray-600 italic",
								children: [
									"\"",
									item.observacao,
									"\""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-6 py-4 text-[#5850ec] font-bold",
								children: [item.quantidade, "×"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-6 py-4 text-gray-400 text-xs",
								children: item.pedidos?.created_at ? new Date(item.pedidos.created_at).toLocaleDateString("pt-BR") : "—"
							})
						]
					}, idx))
				})]
			})
		})]
	});
}
//#endregion
export { AdminPedidosAcompanhamentosPage as component };
