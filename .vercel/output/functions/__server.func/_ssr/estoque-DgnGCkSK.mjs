import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { Y as Package, ct as LoaderCircle, m as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/estoque-DgnGCkSK.js
var import_jsx_runtime = require_jsx_runtime();
function AdminRelatoriosEstoquePage() {
	const { data: products = [], isLoading } = useQuery({
		queryKey: ["relatorio-estoque"],
		queryFn: async () => {
			const { data, error } = await supabase.from("produtos").select("id, nome, imagem_url, estoque_atual, estoque_minimo, controle_estoque, status, categorias(nome)").eq("controle_estoque", true).order("estoque_atual");
			if (error) throw error;
			return data;
		}
	});
	const baixoEstoque = products.filter((p) => (p.estoque_atual ?? 0) <= (p.estoque_minimo ?? 5));
	const semEstoque = products.filter((p) => (p.estoque_atual ?? 0) === 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Estoque e Produção"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Produtos com controle de estoque ativo."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-4 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Com estoque"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-black text-[#5850ec] mt-1",
							children: products.length
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5 border-yellow-200 bg-yellow-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-yellow-600",
							children: "Estoque baixo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-black text-yellow-600 mt-1",
							children: baixoEstoque.length
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5 border-red-200 bg-red-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-red-500",
							children: "Sem estoque"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-3xl font-black text-red-500 mt-1",
							children: semEstoque.length
						})]
					})
				]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : products.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border border-dashed p-20 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, {
						size: 48,
						className: "mx-auto text-gray-200 mb-4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-400",
						children: "Nenhum produto com controle de estoque ativo."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 mt-1",
						children: "Ative o controle de estoque em Cardápio → editar produto."
					})
				]
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
								children: "Categoria"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Estoque atual"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Mínimo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Situação"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y",
						children: products.map((p) => {
							const atual = p.estoque_atual ?? 0;
							const minimo = p.estoque_minimo ?? 5;
							const situacao = atual === 0 ? "sem" : atual <= minimo ? "baixo" : "ok";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-gray-50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [p.imagem_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: p.imagem_url,
												className: "h-8 w-8 rounded object-cover border",
												alt: ""
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-gray-900",
												children: p.nome
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 text-gray-500",
										children: p.categorias?.nome ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 font-bold text-gray-900",
										children: atual
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 text-gray-400",
										children: minimo
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-6 py-4",
										children: [
											situacao === "sem" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												className: "bg-red-100 text-red-700 flex items-center gap-1 w-fit",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 11 }), " Sem estoque"]
											}),
											situacao === "baixo" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												className: "bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 11 }), " Estoque baixo"]
											}),
											situacao === "ok" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												className: "bg-green-100 text-green-700 w-fit",
												children: "Normal"
											})
										]
									})
								]
							}, p.id);
						})
					})]
				})
			})
		]
	});
}
//#endregion
export { AdminRelatoriosEstoquePage as component };
