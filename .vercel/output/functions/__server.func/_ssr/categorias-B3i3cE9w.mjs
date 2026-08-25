import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { Ct as EyeOff, G as PenLine, H as Plus, I as Save, St as Eye, _ as Trash2, ct as LoaderCircle, i as X, mt as GripVertical } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { a as closestCenter, h as CSS, i as PointerSensor, m as useSensors, p as useSensor, r as KeyboardSensor, t as DndContext } from "../_libs/@dnd-kit/core+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { a as verticalListSortingStrategy, i as useSortable, n as arrayMove, r as sortableKeyboardCoordinates, t as SortableContext } from "../_libs/dnd-kit__sortable.mjs";
import { t as restrictToVerticalAxis } from "../_libs/dnd-kit__modifiers.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/categorias-B3i3cE9w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SortableRow({ cat, editingId, editForm, setEditForm, setEditingId, onUpdate, onDelete, onToggleVisible }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		ref: setNodeRef,
		style: {
			transform: CSS.Transform.toString(transform),
			transition,
			opacity: isDragging ? .5 : 1,
			zIndex: isDragging ? 10 : 0
		},
		className: cn("hover:bg-gray-50 transition-colors", !cat.visivel_no_filtro && "opacity-50"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-4 py-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				...attributes,
				...listeners,
				className: "cursor-grab text-gray-300 hover:text-gray-500 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { size: 18 })
			})
		}), editingId === cat.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
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
					className: "h-8 text-xs",
					placeholder: "Descrição opcional"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-6 py-4 text-gray-400",
				children: cat.produtos?.[0]?.count ?? 0
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-4 py-4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-3 py-2 text-right",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1 justify-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						className: "h-7 w-7 text-green-600",
						onClick: () => onUpdate(cat.id, editForm),
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
				children: cat.nome
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-6 py-4 text-gray-500 text-sm",
				children: cat.descricao ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-6 py-4 text-[#5850ec] font-bold",
				children: cat.produtos?.[0]?.count ?? 0
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: cat.visivel_no_filtro !== false,
						onCheckedChange: (v) => onToggleVisible(cat.id, v)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-gray-400",
						children: cat.visivel_no_filtro !== false ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 text-green-600",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 12 }), " Visível"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 text-gray-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 12 }), " Oculto"]
						})
					})]
				})
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
							setEditingId(cat.id);
							setEditForm({
								nome: cat.nome,
								descricao: cat.descricao ?? ""
							});
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 14 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "h-7 w-7 text-gray-400 hover:text-red-500",
						onClick: () => {
							if (confirm("Excluir categoria?")) onDelete(cat.id);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
					})]
				})
			})
		] })]
	});
}
function AdminCategoriasPage() {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		nome: "",
		descricao: ""
	});
	const [editForm, setEditForm] = (0, import_react.useState)({
		nome: "",
		descricao: ""
	});
	const [localCategories, setLocalCategories] = (0, import_react.useState)([]);
	const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
	const { isLoading } = useQuery({
		queryKey: ["admin-categories-full"],
		queryFn: async () => {
			const { data, error } = await supabase.from("categorias").select("*, produtos(count)").order("ordem_filtro", { ascending: true }).order("ordem", { ascending: true });
			if (error) throw error;
			setLocalCategories(data ?? []);
			return data;
		}
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, values }) => {
			const { error } = await supabase.from("categorias").update(values).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
			queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
			queryClient.invalidateQueries({ queryKey: ["public-categories"] });
			toast.success("Atualizado!");
			setEditingId(null);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const addMutation = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("categorias").insert({
				...values,
				ordem: localCategories.length,
				ordem_filtro: localCategories.length,
				visivel_no_filtro: true
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
			queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
			queryClient.invalidateQueries({ queryKey: ["public-categories"] });
			toast.success("Categoria criada!");
			setIsAdding(false);
			setForm({
				nome: "",
				descricao: ""
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("categorias").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
			queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
			queryClient.invalidateQueries({ queryKey: ["public-categories"] });
			toast.success("Categoria removida.");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const handleToggleVisible = async (id, visible) => {
		setLocalCategories((prev) => prev.map((c) => c.id === id ? {
			...c,
			visivel_no_filtro: visible
		} : c));
		const { error } = await supabase.from("categorias").update({ visivel_no_filtro: visible }).eq("id", id);
		if (error) {
			toast.error("Erro ao salvar: " + error.message);
			queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
		} else {
			queryClient.invalidateQueries({ queryKey: ["public-categories"] });
			toast.success(visible ? "Categoria visível no filtro!" : "Categoria oculta do filtro.");
		}
	};
	const handleDragEnd = async (event) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = localCategories.findIndex((c) => c.id === active.id);
		const newIndex = localCategories.findIndex((c) => c.id === over.id);
		const reordered = arrayMove(localCategories, oldIndex, newIndex);
		setLocalCategories(reordered);
		try {
			for (let i = 0; i < reordered.length; i++) await supabase.from("categorias").update({ ordem_filtro: i }).eq("id", reordered[i].id);
			queryClient.invalidateQueries({ queryKey: ["public-categories"] });
			toast.success("Ordem salva!");
		} catch (e) {
			toast.error("Erro ao salvar ordem: " + e.message);
			queryClient.invalidateQueries({ queryKey: ["admin-categories-full"] });
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Categorias"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Arraste para reordenar. Use o toggle para mostrar/ocultar no filtro do catálogo."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsAdding(true),
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Nova Categoria"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-700 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
					size: 14,
					className: "shrink-0"
				}), "Arraste as linhas pela alça para reordenar as categorias no filtro lateral do catálogo."]
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-4 w-8" }),
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
								children: "Produtos"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-4",
								children: "Visível no filtro"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 text-right",
								children: "Ações"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DndContext, {
						sensors,
						collisionDetection: closestCenter,
						onDragEnd: handleDragEnd,
						modifiers: [restrictToVerticalAxis],
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortableContext, {
							items: localCategories.map((c) => c.id),
							strategy: verticalListSortingStrategy,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "divide-y",
								children: localCategories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortableRow, {
									cat,
									editingId,
									editForm,
									setEditForm,
									setEditingId,
									onUpdate: (id, values) => updateMutation.mutate({
										id,
										values
									}),
									onDelete: (id) => deleteMutation.mutate(id),
									onToggleVisible: handleToggleVisible
								}, cat.id))
							})
						})
					})]
				})
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-6 text-[#5850ec]",
						children: "Nova Categoria"
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
								}),
								placeholder: "Ex: Marmitas",
								required: true
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Descrição"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.descricao,
								onChange: (e) => setForm({
									...form,
									descricao: e.target.value
								}),
								placeholder: "Ex: Refeições completas"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setIsAdding(false),
									className: "flex-1",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => addMutation.mutate(form),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: !form.nome || addMutation.isPending,
									children: [
										addMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
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
export { AdminCategoriasPage as component };
