import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { Q as MessageSquare, Rt as CircleCheck, ct as LoaderCircle, jt as Clock } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ouvidoria-DAbwDYjm.js
var import_jsx_runtime = require_jsx_runtime();
function AdminOuvidoriaPage() {
	const queryClient = useQueryClient();
	const { data = [], isLoading } = useQuery({
		queryKey: ["ouvidoria"],
		queryFn: async () => {
			const { data, error } = await supabase.from("ouvidoria").select("*, profiles(nome, email)").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const resolveMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("ouvidoria").update({ status: "resolvido" }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ouvidoria"] });
			toast.success("Marcado como resolvido!");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Ouvidoria"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Mensagens e reclamações dos clientes."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-2xl border border-dashed p-20 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, {
				size: 48,
				className: "mx-auto text-gray-200 mb-4"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-400",
				children: "Nenhuma mensagem na ouvidoria."
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-4",
			children: data.map((msg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-gray-900",
									children: msg.profiles?.nome ?? msg.nome ?? "Anônimo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									className: msg.status === "resolvido" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700",
									children: msg.status === "resolvido" ? "Resolvido" : "Pendente"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-gray-400 mb-3 flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 12 }),
									" ",
									format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
								]
							}),
							msg.assunto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-gray-700 mb-1",
								children: msg.assunto
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-gray-600 leading-relaxed",
								children: msg.mensagem ?? msg.texto ?? "—"
							})
						]
					}), msg.status !== "resolvido" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: () => resolveMutation.mutate(msg.id),
						className: "bg-green-600 hover:bg-green-700 text-white shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
							size: 14,
							className: "mr-1"
						}), " Resolver"]
					})]
				})
			}, msg.id))
		})]
	});
}
//#endregion
export { AdminOuvidoriaPage as component };
