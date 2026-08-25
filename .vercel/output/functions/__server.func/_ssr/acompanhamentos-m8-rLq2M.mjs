import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { G as PenLine, H as Plus, I as Save, _ as Trash2, ct as LoaderCircle, i as X } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/acompanhamentos-m8-rLq2M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminAcompanhamentosPage() {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		nome: "",
		descricao: "",
		preco_adicional: "0"
	});
	const [editForm, setEditForm] = (0, import_react.useState)({
		nome: "",
		descricao: "",
		preco_adicional: "0"
	});
	const { data = [], isLoading } = useQuery({
		queryKey: ["acompanhamentos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("acompanhamentos").select("*").order("nome");
			if (error) throw error;
			return data;
		}
	});
	const addMutation = useMutation({
		mutationFn: async (v) => {
			const { error } = await supabase.from("acompanhamentos").insert(v);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] });
			toast.success("Acompanhamento criado!");
			setIsAdding(false);
			setForm({
				nome: "",
				descricao: "",
				preco_adicional: "0"
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, v }) => {
			const { error } = await supabase.from("acompanhamentos").update(v).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] });
			toast.success("Atualizado!");
			setEditingId(null);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("acompanhamentos").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["acompanhamentos"] });
			toast.success("Removido.");
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
					children: "Acompanhamentos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Itens extras que podem acompanhar os pedidos."
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
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Nome"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Descrição"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Preço adicional"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 text-right",
								children: "Ações"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y",
						children: [data.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 4,
							className: "px-6 py-12 text-center text-gray-400",
							children: "Nenhum acompanhamento cadastrado."
						}) }), data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
							className: "hover:bg-gray-50",
							children: editingId === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editForm.nome,
										onChange: (e) => setEditForm({
											...editForm,
											nome: e.target.value
										}),
										className: "h-8 text-xs"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editForm.descricao,
										onChange: (e) => setEditForm({
											...editForm,
											descricao: e.target.value
										}),
										className: "h-8 text-xs"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										step: "0.01",
										value: editForm.preco_adicional,
										onChange: (e) => setEditForm({
											...editForm,
											preco_adicional: e.target.value
										}),
										className: "h-8 text-xs w-24"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-1 justify-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon",
											variant: "ghost",
											className: "h-7 w-7 text-green-600",
											onClick: () => updateMutation.mutate({
												id: item.id,
												v: {
													nome: editForm.nome,
													descricao: editForm.descricao,
													preco_adicional: Number(editForm.preco_adicional)
												}
											}),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon",
											variant: "ghost",
											className: "h-7 w-7 text-gray-400",
											onClick: () => setEditingId(null),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
										})]
									})
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 font-bold text-gray-900",
									children: item.nome
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-gray-500",
									children: item.descricao ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 text-green-600 font-bold",
									children: ["R$ ", Number(item.preco_adicional ?? 0).toFixed(2)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-1 justify-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "h-7 w-7 text-gray-400 hover:text-[#5850ec]",
											onClick: () => {
												setEditingId(item.id);
												setEditForm({
													nome: item.nome,
													descricao: item.descricao ?? "",
													preco_adicional: String(item.preco_adicional ?? 0)
												});
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "h-7 w-7 text-gray-400 hover:text-red-500",
											onClick: () => deleteMutation.mutate(item.id),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
										})]
									})
								})
							] })
						}, item.id))]
					})]
				})
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-6 text-[#5850ec]",
						children: "Novo Acompanhamento"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
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
								children: "Descrição"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.descricao,
								onChange: (e) => setForm({
									...form,
									descricao: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Preço adicional (R$)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								value: form.preco_adicional,
								onChange: (e) => setForm({
									...form,
									preco_adicional: e.target.value
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
										nome: form.nome,
										descricao: form.descricao,
										preco_adicional: Number(form.preco_adicional)
									}),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: !form.nome || addMutation.isPending,
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
export { AdminAcompanhamentosPage as component };
