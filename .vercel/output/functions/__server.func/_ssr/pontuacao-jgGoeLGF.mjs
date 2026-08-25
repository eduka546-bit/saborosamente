import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { F as Search, ct as LoaderCircle, nn as Award } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pontuacao-jgGoeLGF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPontuacaoPage() {
	const [search, setSearch] = (0, import_react.useState)("");
	const { data: profiles = [], isLoading } = useQuery({
		queryKey: ["pontuacao-clientes"],
		queryFn: async () => {
			const { data: profs, error } = await supabase.from("profiles").select("id, nome, email").order("nome");
			if (error) throw error;
			const { data: orders } = await supabase.from("pedidos").select("user_id, valor_total").neq("status", "Cancelado");
			const map = /* @__PURE__ */ new Map();
			(orders ?? []).forEach((o) => {
				if (o.user_id) map.set(o.user_id, (map.get(o.user_id) ?? 0) + Math.floor((o.valor_total ?? 0) / 10));
			});
			return (profs ?? []).map((p) => ({
				...p,
				pontos: map.get(p.id) ?? 0
			})).sort((a, b) => b.pontos - a.pontos);
		}
	});
	const filtered = (0, import_react.useMemo)(() => profiles.filter((p) => p.nome?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())), [profiles, search]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Pontuação de Clientes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Ranking de pontos acumulados (1 ponto a cada R$ 10 gastos)."
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
						placeholder: "Buscar cliente...",
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
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Pontos"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y",
						children: filtered.map((p, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 font-black text-gray-300 text-lg",
									children: idx + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-bold text-gray-900",
										children: p.nome ?? "—"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-gray-400",
										children: p.email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, {
												size: 16,
												className: "text-yellow-500"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-black text-[#5850ec] text-lg",
												children: p.pontos
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-gray-400",
												children: "pts"
											})
										]
									})
								})
							]
						}, p.id))
					})]
				})
			})
		]
	});
}
//#endregion
export { AdminPontuacaoPage as component };
