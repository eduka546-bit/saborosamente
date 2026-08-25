import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { T as Star, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/avaliacoes-Broz2mXC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminAvaliacoesPage() {
	const { data = [], isLoading } = useQuery({
		queryKey: ["avaliacoes"],
		queryFn: async () => {
			const { data, error } = await supabase.from("avaliacoes").select("*, pedidos(nome_cliente, created_at)").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const media = (0, import_react.useMemo)(() => {
		if (!data.length) return 0;
		return data.reduce((s, a) => s + (a.nota ?? 0), 0) / data.length;
	}, [data]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-center py-20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			className: "animate-spin text-[#5850ec]",
			size: 32
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Avaliações"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Média mensal e histórico de avaliações dos clientes."
			})]
		}), data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-2xl border border-dashed p-20 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
				size: 48,
				className: "mx-auto text-gray-200 mb-4"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-400",
				children: "Nenhuma avaliação registrada ainda."
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-2xl border p-6 mb-6 flex items-center gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-5xl font-black text-[#5850ec]",
				children: media.toFixed(1)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1",
				children: [
					1,
					2,
					3,
					4,
					5
				].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
					size: 20,
					className: n <= Math.round(media) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
				}, n))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-gray-500 mt-1",
				children: [data.length, " avaliações"]
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: data.map((av) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-4 flex items-start gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec] font-black shrink-0",
					children: av.pedidos?.nome_cliente?.[0] ?? "?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-sm text-gray-900",
								children: av.pedidos?.nome_cliente ?? "Cliente"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-0.5",
								children: [
									1,
									2,
									3,
									4,
									5
								].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
									size: 14,
									className: n <= (av.nota ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
								}, n))
							})]
						}),
						av.comentario && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-gray-600 italic",
							children: [
								"\"",
								av.comentario,
								"\""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400 mt-1",
							children: format(new Date(av.created_at), "dd/MM/yyyy", { locale: ptBR })
						})
					]
				})]
			}, av.id))
		})] })]
	});
}
//#endregion
export { AdminAvaliacoesPage as component };
