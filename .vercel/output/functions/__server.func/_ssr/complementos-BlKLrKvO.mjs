import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { H as Plus, I as Save, Kt as ChevronDown, Wt as ChevronRight, _ as Trash2, ct as LoaderCircle, i as X } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/complementos-BlKLrKvO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminComplementosPage() {
	const queryClient = useQueryClient();
	const [expandedId, setExpandedId] = (0, import_react.useState)(null);
	const [isAddingGroup, setIsAddingGroup] = (0, import_react.useState)(false);
	const [addingItemFor, setAddingItemFor] = (0, import_react.useState)(null);
	const [groupForm, setGroupForm] = (0, import_react.useState)({
		nome: "",
		obrigatorio: false,
		minimo: "0",
		maximo: "1"
	});
	const [itemForm, setItemForm] = (0, import_react.useState)({
		nome: "",
		preco_adicional: "0"
	});
	const { data: groups = [], isLoading } = useQuery({
		queryKey: ["complementos-grupos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("complemento_grupos").select("*, itens:complemento_itens(*)").order("created_at");
			if (error) throw error;
			return data;
		}
	});
	const addGroupMutation = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("complemento_grupos").insert(values);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
			toast.success("Grupo criado!");
			setIsAddingGroup(false);
			setGroupForm({
				nome: "",
				obrigatorio: false,
				minimo: "0",
				maximo: "1"
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteGroupMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("complemento_grupos").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
			toast.success("Grupo removido.");
		}
	});
	const addItemMutation = useMutation({
		mutationFn: async ({ grupo_id, values }) => {
			const { error } = await supabase.from("complemento_itens").insert({
				...values,
				grupo_id
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
			toast.success("Item adicionado!");
			setAddingItemFor(null);
			setItemForm({
				nome: "",
				preco_adicional: "0"
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteItemMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("complemento_itens").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["complementos-grupos"] });
			toast.success("Item removido.");
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Itens de Complementos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Grupos e itens de complementos para vincular aos produtos."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsAddingGroup(true),
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Novo Grupo"]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-2xl border border-dashed p-16 text-center text-gray-400",
				children: "Nenhum grupo de complemento criado."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50",
						onClick: () => setExpandedId(expandedId === group.id ? null : group.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								expandedId === group.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
									size: 16,
									className: "text-gray-400"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
									size: 16,
									className: "text-gray-400"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-gray-900",
									children: group.nome
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full",
									children: [group.itens?.length ?? 0, " itens"]
								}),
								group.obrigatorio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full",
									children: "Obrigatório"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							className: "h-7 w-7 text-gray-400 hover:text-red-500",
							onClick: (e) => {
								e.stopPropagation();
								if (confirm("Excluir grupo?")) deleteGroupMutation.mutate(group.id);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
						})]
					}), expandedId === group.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t bg-gray-50 px-6 py-4 space-y-2",
						children: [group.itens?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between bg-white rounded-lg px-4 py-2 border",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-gray-900",
								children: item.nome
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm text-green-600 font-bold",
									children: ["+ R$ ", Number(item.preco_adicional ?? 0).toFixed(2)]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "h-6 w-6 text-gray-300 hover:text-red-500",
									onClick: () => deleteItemMutation.mutate(item.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 })
								})]
							})]
						}, item.id)), addingItemFor === group.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2 items-center bg-white rounded-lg px-4 py-2 border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Nome do item",
									value: itemForm.nome,
									onChange: (e) => setItemForm({
										...itemForm,
										nome: e.target.value
									}),
									className: "h-7 text-xs flex-1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "+ R$",
									type: "number",
									step: "0.01",
									value: itemForm.preco_adicional,
									onChange: (e) => setItemForm({
										...itemForm,
										preco_adicional: e.target.value
									}),
									className: "h-7 text-xs w-20"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									className: "h-7 w-7 text-green-600",
									onClick: () => addItemMutation.mutate({
										grupo_id: group.id,
										values: {
											nome: itemForm.nome,
											preco_adicional: Number(itemForm.preco_adicional)
										}
									}),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 13 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									className: "h-7 w-7 text-gray-400",
									onClick: () => setAddingItemFor(null),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setAddingItemFor(group.id),
							className: "flex items-center gap-2 text-xs font-bold text-[#5850ec] hover:text-[#5850ec]/80 transition-colors py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 13 }), " Adicionar item"]
						})]
					})]
				}, group.id))
			}),
			isAddingGroup && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-6 text-[#5850ec]",
						children: "Novo Grupo de Complemento"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Nome do Grupo *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: groupForm.nome,
								onChange: (e) => setGroupForm({
									...groupForm,
									nome: e.target.value
								}),
								placeholder: "Ex: Escolha a bebida"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Mínimo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: groupForm.minimo,
									onChange: (e) => setGroupForm({
										...groupForm,
										minimo: e.target.value
									})
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Máximo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: groupForm.maximo,
									onChange: (e) => setGroupForm({
										...groupForm,
										maximo: e.target.value
									})
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: groupForm.obrigatorio,
									onCheckedChange: (v) => setGroupForm({
										...groupForm,
										obrigatorio: v
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-sm font-medium text-gray-700",
									children: "Obrigatório"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setIsAddingGroup(false),
									className: "flex-1",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => addGroupMutation.mutate({
										nome: groupForm.nome,
										obrigatorio: groupForm.obrigatorio,
										minimo: Number(groupForm.minimo),
										maximo: Number(groupForm.maximo)
									}),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: !groupForm.nome || addGroupMutation.isPending,
									children: [
										addGroupMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											size: 16,
											className: "animate-spin mr-2"
										}) : null,
										" ",
										"Criar"
									]
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
export { AdminComplementosPage as component };
