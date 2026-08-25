import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { G as PenLine, H as Plus, I as Save, _ as Trash2, ct as LoaderCircle, i as X, p as Truck } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/entregador-Cry2KxuN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigEntregadorPage() {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		nome: "",
		telefone: "",
		veiculo: "",
		ativo: true
	});
	const [editForm, setEditForm] = (0, import_react.useState)({
		nome: "",
		telefone: "",
		veiculo: ""
	});
	const { data = [], isLoading } = useQuery({
		queryKey: ["entregadores"],
		queryFn: async () => {
			const { data, error } = await supabase.from("entregadores").select("*").order("nome");
			if (error) throw error;
			return data;
		}
	});
	const addMutation = useMutation({
		mutationFn: async (v) => {
			const { error } = await supabase.from("entregadores").insert(v);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["entregadores"] });
			toast.success("Entregador adicionado!");
			setIsAdding(false);
			setForm({
				nome: "",
				telefone: "",
				veiculo: "",
				ativo: true
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, v }) => {
			const { error } = await supabase.from("entregadores").update(v).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["entregadores"] });
			toast.success("Atualizado!");
			setEditingId(null);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("entregadores").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["entregadores"] });
			toast.success("Removido.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Entregadores"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Gerencie os entregadores da sua loja."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsAdding(true),
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Novo"]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
				children: [data.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "col-span-3 bg-white rounded-2xl border border-dashed p-16 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, {
						size: 40,
						className: "mx-auto text-gray-200 mb-3"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-400",
						children: "Nenhum entregador cadastrado."
					})]
				}), data.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-white rounded-xl border p-5",
					children: editingId === e.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.nome,
								onChange: (x) => setEditForm({
									...editForm,
									nome: x.target.value
								}),
								className: "h-8 text-sm",
								placeholder: "Nome"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.telefone,
								onChange: (x) => setEditForm({
									...editForm,
									telefone: x.target.value
								}),
								className: "h-8 text-sm",
								placeholder: "Telefone"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.veiculo,
								onChange: (x) => setEditForm({
									...editForm,
									veiculo: x.target.value
								}),
								className: "h-8 text-sm",
								placeholder: "Veículo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									className: "text-green-600",
									onClick: () => updateMutation.mutate({
										id: e.id,
										v: editForm
									}),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 14 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									className: "text-gray-400",
									onClick: () => setEditingId(null),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec] font-black",
									children: e.nome?.[0]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-gray-900",
									children: e.nome
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-gray-400",
									children: e.telefone
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "h-7 w-7 text-gray-400 hover:text-[#5850ec]",
									onClick: () => {
										setEditingId(e.id);
										setEditForm({
											nome: e.nome,
											telefone: e.telefone ?? "",
											veiculo: e.veiculo ?? ""
										});
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 13 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "h-7 w-7 text-gray-400 hover:text-red-500",
									onClick: () => deleteMutation.mutate(e.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
								})]
							})]
						}),
						e.veiculo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-gray-400 mt-2",
							children: ["🛵 ", e.veiculo]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: `mt-2 ${e.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`,
							children: e.ativo ? "Ativo" : "Inativo"
						})
					] })
				}, e.id))]
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-5 text-[#5850ec]",
						children: "Novo Entregador"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Nome *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.nome,
								onChange: (e) => setForm({
									...form,
									nome: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Telefone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.telefone,
								onChange: (e) => setForm({
									...form,
									telefone: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Veículo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.veiculo,
								onChange: (e) => setForm({
									...form,
									veiculo: e.target.value
								}),
								placeholder: "Ex: Moto Honda CG 160"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setIsAdding(false),
									className: "flex-1",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => addMutation.mutate(form),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: !form.nome,
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
export { AdminConfigEntregadorPage as component };
