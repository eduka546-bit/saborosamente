import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { F as Search, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/itens-D66UsHbj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPedidosItensPage() {
	const [search, setSearch] = (0, import_react.useState)("");
	const { data = [], isLoading } = useQuery({
		queryKey: ["pedidos-por-item"],
		queryFn: async () => {
			const { data, error } = await supabase.from("pedido_itens").select("*, produtos(nome, imagem_url), pedidos(created_at, status)").order("created_at", {
				foreignTable: "pedidos",
				ascending: false
			});
			if (error) throw error;
			return data;
		}
	});
	const grouped = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		data.forEach((item) => {
			const id = item.produto_id;
			const existing = map.get(id);
			if (existing) {
				existing.quantidade += item.quantidade;
				existing.receita += item.quantidade * item.preco_unitario;
			} else map.set(id, {
				nome: item.produtos?.nome ?? "—",
				imagem: item.produtos?.imagem_url ?? "",
				quantidade: item.quantidade,
				receita: item.quantidade * item.preco_unitario
			});
		});
		return [...map.values()].filter((i) => i.nome.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.quantidade - a.quantidade);
	}, [data, search]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Pedidos por Item"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Ranking de produtos mais pedidos."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border p-4 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
						size: 18
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Buscar produto...",
						className: "pl-10",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					})]
				})
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "#"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Produto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Qtd. vendida"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Receita gerada"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y",
						children: grouped.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 font-black text-gray-300 text-lg",
									children: idx + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [item.imagem && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: item.imagem,
											className: "h-10 w-10 rounded-lg object-cover border",
											alt: ""
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-gray-900",
											children: item.nome
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 font-bold text-[#5850ec]",
									children: [item.quantidade, "×"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 font-bold text-green-600",
									children: ["R$ ", item.receita.toFixed(2).replace(".", ",")]
								})
							]
						}, idx))
					})]
				})
			})
		]
	});
}
//#endregion
export { AdminPedidosItensPage as component };
