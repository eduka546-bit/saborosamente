import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { H as Plus, _ as Trash2, ct as LoaderCircle, s as UtensilsCrossed } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/mesas-4sANsGJs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigMesasPage() {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		numero: "",
		capacidade: "4",
		ativo: true
	});
	const { data = [], isLoading } = useQuery({
		queryKey: ["mesas"],
		queryFn: async () => {
			const { data, error } = await supabase.from("mesas").select("*").order("numero");
			if (error) throw error;
			return data;
		}
	});
	const addMutation = useMutation({
		mutationFn: async (v) => {
			const { error } = await supabase.from("mesas").insert(v);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["mesas"] });
			toast.success("Mesa adicionada!");
			setIsAdding(false);
			setForm({
				numero: "",
				capacidade: "4",
				ativo: true
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const toggleMutation = useMutation({
		mutationFn: async ({ id, ativo }) => {
			const { error } = await supabase.from("mesas").update({ ativo: !ativo }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mesas"] })
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("mesas").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["mesas"] });
			toast.success("Mesa removida.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Mesas"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Gerencie as mesas do estabelecimento."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsAdding(true),
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Nova Mesa"]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
				children: [data.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "col-span-8 bg-white rounded-2xl border border-dashed p-16 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UtensilsCrossed, {
						size: 40,
						className: "mx-auto text-gray-200 mb-3"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-400",
						children: "Nenhuma mesa cadastrada."
					})]
				}), data.map((mesa) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `relative bg-white rounded-xl border p-4 text-center ${mesa.ativo ? "" : "opacity-50"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl font-black text-[#5850ec]",
							children: mesa.numero
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-gray-400",
							children: [mesa.capacidade, " lugares"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-center gap-2 mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: mesa.ativo,
								onCheckedChange: () => toggleMutation.mutate({
									id: mesa.id,
									ativo: mesa.ativo
								}),
								className: "scale-75"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => deleteMutation.mutate(mesa.id),
								className: "text-gray-300 hover:text-red-500 transition-colors",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
							})]
						})
					]
				}, mesa.id))]
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-sm p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-5 text-[#5850ec]",
						children: "Nova Mesa"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Número da Mesa *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.numero,
								onChange: (e) => setForm({
									...form,
									numero: e.target.value
								}),
								placeholder: "Ex: 1, 2, A1..."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Capacidade (lugares)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: form.capacidade,
								onChange: (e) => setForm({
									...form,
									capacidade: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setIsAdding(false),
									className: "flex-1",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => addMutation.mutate({
										numero: form.numero,
										capacidade: Number(form.capacidade),
										ativo: true
									}),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: !form.numero,
									children: "Adicionar"
								})]
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { AdminConfigMesasPage as component };
