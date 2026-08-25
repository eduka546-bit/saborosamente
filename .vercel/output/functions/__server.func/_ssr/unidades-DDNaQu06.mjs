import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { G as PenLine, H as Plus, I as Save, _ as Trash2, ct as LoaderCircle, i as X, w as Store } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/unidades-DDNaQu06.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigUnidadesPage() {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		nome: "",
		endereco: "",
		telefone: "",
		horario: ""
	});
	const [editForm, setEditForm] = (0, import_react.useState)({
		nome: "",
		endereco: "",
		telefone: "",
		horario: ""
	});
	const { data = [], isLoading } = useQuery({
		queryKey: ["unidades"],
		queryFn: async () => {
			const { data, error } = await supabase.from("unidades").select("*").order("nome");
			if (error) throw error;
			return data;
		}
	});
	const addMutation = useMutation({
		mutationFn: async (v) => {
			const { error } = await supabase.from("unidades").insert(v);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["unidades"] });
			toast.success("Unidade criada!");
			setIsAdding(false);
			setForm({
				nome: "",
				endereco: "",
				telefone: "",
				horario: ""
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, v }) => {
			const { error } = await supabase.from("unidades").update(v).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["unidades"] });
			toast.success("Atualizado!");
			setEditingId(null);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("unidades").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["unidades"] });
			toast.success("Removida.");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Unidades"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Gerencie as unidades / pontos de atendimento."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsAdding(true),
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Nova Unidade"]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [data.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "md:col-span-2 bg-white rounded-2xl border border-dashed p-16 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, {
						size: 40,
						className: "mx-auto text-gray-200 mb-3"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-400",
						children: "Nenhuma unidade cadastrada."
					})]
				}), data.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-white rounded-xl border p-5",
					children: editingId === u.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.nome,
								onChange: (e) => setEditForm({
									...editForm,
									nome: e.target.value
								}),
								placeholder: "Nome",
								className: "h-8 text-sm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.endereco,
								onChange: (e) => setEditForm({
									...editForm,
									endereco: e.target.value
								}),
								placeholder: "Endereço",
								className: "h-8 text-sm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.telefone,
								onChange: (e) => setEditForm({
									...editForm,
									telefone: e.target.value
								}),
								placeholder: "Telefone",
								className: "h-8 text-sm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.horario,
								onChange: (e) => setEditForm({
									...editForm,
									horario: e.target.value
								}),
								placeholder: "Horário",
								className: "h-8 text-sm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									className: "text-green-600",
									onClick: () => updateMutation.mutate({
										id: u.id,
										v: editForm
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
										size: 14,
										className: "mr-1"
									}), " Salvar"]
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
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-gray-900",
								children: u.nome
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-gray-500 mt-1",
								children: u.endereco
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "h-7 w-7 text-gray-400 hover:text-[#5850ec]",
									onClick: () => {
										setEditingId(u.id);
										setEditForm({
											nome: u.nome,
											endereco: u.endereco ?? "",
											telefone: u.telefone ?? "",
											horario: u.horario ?? ""
										});
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 13 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "h-7 w-7 text-gray-400 hover:text-red-500",
									onClick: () => deleteMutation.mutate(u.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
								})]
							})]
						}),
						u.telefone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-gray-400 mt-2",
							children: ["📞 ", u.telefone]
						}),
						u.horario && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-gray-400 mt-1",
							children: ["🕐 ", u.horario]
						})
					] })
				}, u.id))]
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-5 text-[#5850ec]",
						children: "Nova Unidade"
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
								children: "Endereço"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.endereco,
								onChange: (e) => setForm({
									...form,
									endereco: e.target.value
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
								children: "Horário"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.horario,
								onChange: (e) => setForm({
									...form,
									horario: e.target.value
								}),
								placeholder: "Ex: Seg-Sex 9h–18h"
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
									children: "Criar"
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
export { AdminConfigUnidadesPage as component };
