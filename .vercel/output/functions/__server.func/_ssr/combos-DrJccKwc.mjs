import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { A as ShoppingBag, G as PenLine, I as Save, S as Tag, ct as LoaderCircle, i as X } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { t as COMBO_RULES } from "./combo-rules-CAvABk5q.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/combos-DrJccKwc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var REGRAS = COMBO_RULES;
function AdminCombosPage() {
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editForm, setEditForm] = (0, import_react.useState)({
		nome: "",
		descricao: "",
		ativo: true
	});
	const { data: combos = [], isLoading } = useQuery({
		queryKey: ["admin-combos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("produtos").select("*, categorias(nome)").order("nome");
			if (error) throw error;
			return (data ?? []).filter((p) => {
				const cat = (p.categorias?.nome || "").toLowerCase();
				const nome = (p.nome || "").toLowerCase();
				return cat.includes("combo") || nome.includes("monte você mesmo") || nome.includes("monte voce mesmo") || nome.includes("combo a escolha") || nome.includes("combo à escolha");
			});
		}
	});
	const { data: categories = [] } = useQuery({
		queryKey: ["admin-categories"],
		queryFn: async () => {
			const { data } = await supabase.from("categorias").select("*").order("nome");
			return data ?? [];
		}
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, values }) => {
			const { error } = await supabase.from("produtos").update(values).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-combos"] });
			queryClient.invalidateQueries({ queryKey: ["public-products-all"] });
			toast.success("Combo atualizado!");
			setEditingId(null);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const toggleMutation = useMutation({
		mutationFn: async ({ id, ativo }) => {
			const status = ativo ? "ativo" : "pausado";
			const { error } = await supabase.from("produtos").update({ status }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-combos"] });
			queryClient.invalidateQueries({ queryKey: ["public-products-all"] });
			toast.success("Status atualizado!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const startEdit = (combo) => {
		setEditingId(combo.id);
		setEditForm({
			nome: combo.nome,
			descricao: combo.descricao ?? "",
			ativo: (combo.status || "ativo").toLowerCase() === "ativo"
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1200px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Combos \"Monte Você Mesmo\""
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Gerencie os combos do cardápio. Para criar um novo combo, adicione um produto na categoria \"Combos\" pelo Cardápio."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border p-6 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
							size: 16,
							className: "text-[#5850ec]"
						}), " Regras de Desconto Progressivo"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-gray-500 mb-4",
						children: [
							"O desconto é aplicado automaticamente com base na quantidade total de itens no carrinho. Sopas e complementos ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "contam na quantidade" }),
							" mas não recebem desconto."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-4",
						children: REGRAS.map((rule) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center p-4 rounded-xl bg-[#5850ec]/5 border border-[#5850ec]/10",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-2xl font-black text-[#5850ec]",
									children: [(rule.discount * 100).toFixed(0), "%"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-gray-500 mt-1",
									children: [
										"a partir de ",
										rule.min,
										" itens"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									className: "mt-2 bg-[#5850ec]/10 text-[#5850ec] hover:bg-[#5850ec]/10",
									children: rule.label
								})
							]
						}, rule.min))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-4 border border-amber-100",
						children: [
							"Para alterar os percentuais de desconto, entre em contato com o desenvolvedor — está definido no código em ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "src/components/combo-builder-modal.tsx" }),
							"."
						]
					})
				]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : combos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border border-dashed p-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
						size: 48,
						className: "mx-auto text-gray-200 mb-4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-400 font-medium",
						children: "Nenhum combo encontrado."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 mt-2",
						children: "Adicione um produto com categoria \"Combos\" ou nome contendo \"Monte Você Mesmo\" pelo Cardápio."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: combos.map((combo) => {
					const isAtivo = (combo.status || "ativo").toLowerCase() === "ativo";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bg-white rounded-2xl border p-5 shadow-sm",
						children: editingId === combo.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Nome"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: editForm.nome,
									onChange: (e) => setEditForm({
										...editForm,
										nome: e.target.value
									})
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Descrição"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: editForm.descricao,
									onChange: (e) => setEditForm({
										...editForm,
										descricao: e.target.value
									}),
									placeholder: "Descreva o combo..."
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									className: "bg-[#5850ec] text-white",
									onClick: () => updateMutation.mutate({
										id: combo.id,
										values: {
											nome: editForm.nome,
											descricao: editForm.descricao,
											status: editForm.ativo ? "ativo" : "pausado"
										}
									}),
									disabled: updateMutation.isPending,
									children: [updateMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 14,
										className: "animate-spin mr-1"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
										size: 14,
										className: "mr-1"
									}), "Salvar"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => setEditingId(null),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
										size: 14,
										className: "mr-1"
									}), " Cancelar"]
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4",
							children: [
								combo.imagem_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: combo.imagem_url,
									className: "h-16 w-16 rounded-xl object-cover border shrink-0",
									alt: ""
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 flex-wrap",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-bold text-gray-900",
													children: combo.nome
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													className: isAtivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
													children: isAtivo ? "Ativo" : "Pausado"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-[#5850ec]",
													children: combo.categorias?.nome ?? "Combo"
												})
											]
										}),
										combo.descricao && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-gray-500 mt-1 truncate",
											children: combo.descricao
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-gray-400 mt-1",
											children: ["A partir de ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
												className: "text-[#086e45]",
												children: ["R$ ", Number(combo.preco).toFixed(2)]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-gray-500",
											children: isAtivo ? "Ativo" : "Pausado"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											checked: isAtivo,
											onCheckedChange: (v) => toggleMutation.mutate({
												id: combo.id,
												ativo: v
											})
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8 text-gray-400 hover:text-[#5850ec]",
										onClick: () => startEdit(combo),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 15 })
									})]
								})
							]
						})
					}, combo.id);
				})
			})
		]
	});
}
//#endregion
export { AdminCombosPage as component };
