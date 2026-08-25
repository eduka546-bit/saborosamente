import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { A as ShoppingBag, F as Search, G as PenLine, H as Plus, Qt as Calendar, Rt as CircleCheck, _ as Trash2, ct as LoaderCircle, x as Ticket } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.cupons-gPaehjng.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EMPTY_FORM = {
	codigo: "",
	tipo: "Fixo",
	valor: 0,
	regra: "",
	validade: "",
	ativo: true,
	max_uso: "",
	apenas_primeira_compra: false
};
function AdminCuponsPage() {
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [isModalOpen, setIsModalOpen] = (0, import_react.useState)(false);
	const [editingCupom, setEditingCupom] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)(EMPTY_FORM);
	const { data: cupons = [], isLoading } = useQuery({
		queryKey: ["admin-cupons"],
		queryFn: async () => {
			const { data, error } = await supabase.from("cupons").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const saveMutation = useMutation({
		mutationFn: async (values) => {
			if (editingCupom?.id) {
				const { error } = await supabase.from("cupons").update(values).eq("id", editingCupom.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("cupons").insert(values);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
			toast.success(editingCupom ? "Cupom atualizado!" : "Cupom criado!");
			setIsModalOpen(false);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const toggleMutation = useMutation({
		mutationFn: async ({ id, ativo }) => {
			const { error } = await supabase.from("cupons").update({ ativo: !ativo }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-cupons"] }),
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("cupons").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
			toast.success("Cupom removido.");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const openNew = () => {
		setEditingCupom(null);
		setForm(EMPTY_FORM);
		setIsModalOpen(true);
	};
	const openEdit = (c) => {
		setEditingCupom(c);
		setForm({
			codigo: c.codigo,
			tipo: c.tipo,
			valor: c.valor,
			regra: c.regra || "",
			validade: c.validade || "",
			ativo: c.ativo,
			max_uso: c.max_uso !== null && c.max_uso !== void 0 ? String(c.max_uso) : "",
			apenas_primeira_compra: c.apenas_primeira_compra ?? false
		});
		setIsModalOpen(true);
	};
	const handleSubmit = (e) => {
		e.preventDefault();
		const max_uso = form.max_uso === "" ? null : Number(form.max_uso);
		saveMutation.mutate({
			...form,
			valor: Number(form.valor),
			uso: editingCupom?.uso || 0,
			max_uso,
			apenas_primeira_compra: form.apenas_primeira_compra
		});
	};
	const filtered = cupons.filter((c) => c.codigo?.toLowerCase().includes(searchTerm.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Cupons de Desconto"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Crie e gerencie ofertas para atrair mais clientes."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: openNew,
					className: "bg-[#5850ec] hover:bg-[#5850ec]/90 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 18 }), " Novo Cupom"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl shadow-sm border p-4 mb-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
						size: 18
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Buscar por código...",
						className: "pl-10 rounded-lg border-gray-200",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value)
					})]
				})
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border border-dashed p-16 text-center text-gray-400",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ticket, {
					size: 40,
					className: "mx-auto mb-3 opacity-30"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Nenhum cupom encontrado." })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
				children: filtered.map((cupom) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-start mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `h-12 w-12 rounded-xl flex items-center justify-center ${cupom.ativo ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ticket, { size: 24 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => openEdit(cupom),
										className: "text-gray-400 hover:text-[#5850ec] transition-colors",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 18 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => toggleMutation.mutate({
											id: cupom.id,
											ativo: cupom.ativo
										}),
										className: `transition-colors ${cupom.ativo ? "text-green-500 hover:text-green-600" : "text-gray-300 hover:text-green-400"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 18 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => deleteMutation.mutate(cupom.id),
										className: "text-gray-400 hover:text-red-500 transition-colors",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 })
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold text-gray-400 uppercase tracking-widest mb-1",
									children: "Código"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xl font-black text-gray-900",
									children: cupom.codigo
								}),
								cupom.regra && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[#5850ec] font-bold mt-1",
									children: cupom.regra
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4 mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1",
								children: "Desconto"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-gray-800",
								children: cupom.tipo === "Percentual" ? `${cupom.valor}%` : cupom.tipo === "Entrega Grátis" ? "Grátis" : `R$ ${Number(cupom.valor).toFixed(2)}`
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1",
								children: "Usos"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-bold text-gray-800",
								children: [cupom.uso ?? 0, cupom.max_uso !== null && cupom.max_uso !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-gray-400 font-normal",
									children: [" / ", cupom.max_uso]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gray-400 font-normal",
									children: " / ∞"
								})]
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between pt-4 border-t flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: cupom.ativo ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100",
										children: cupom.ativo ? "Ativo" : "Pausado"
									}),
									cupom.max_uso === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
										children: "Uso único"
									}),
									cupom.apenas_primeira_compra && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										className: "bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { size: 10 }), " 1ª compra"]
									}),
									cupom.max_uso !== null && cupom.max_uso !== void 0 && cupom.max_uso > 1 && cupom.uso >= cupom.max_uso && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "bg-gray-100 text-gray-500 hover:bg-gray-100",
										children: "Esgotado"
									})
								]
							}), cupom.validade && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[10px] font-bold text-gray-400 flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { size: 12 }),
									" ",
									new Date(cupom.validade).toLocaleDateString("pt-BR")
								]
							})]
						})
					]
				}, cupom.id))
			}),
			isModalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-6 text-[#5850ec]",
						children: editingCupom ? "Editar Cupom" : "Novo Cupom"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Código do Cupom"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.codigo,
								onChange: (e) => setForm({
									...form,
									codigo: e.target.value.toUpperCase()
								}),
								required: true,
								placeholder: "EX: SABOR20",
								className: "uppercase font-bold"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Tipo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: form.tipo,
									onChange: (e) => setForm({
										...form,
										tipo: e.target.value
									}),
									className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Fixo",
											children: "Fixo (R$)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Percentual",
											children: "Percentual (%)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Entrega Grátis",
											children: "Entrega Grátis"
										})
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Valor"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									value: form.valor,
									onChange: (e) => setForm({
										...form,
										valor: e.target.value
									}),
									placeholder: "0"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Regra / Descrição"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.regra,
								onChange: (e) => setForm({
									...form,
									regra: e.target.value
								}),
								placeholder: "EX: Mínimo R$ 100"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Data de Validade"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: form.validade,
								onChange: (e) => setForm({
									...form,
									validade: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Limite de usos"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: "1",
									value: form.max_uso,
									onChange: (e) => setForm({
										...form,
										max_uso: e.target.value
									}),
									placeholder: "Deixe vazio para sem limite"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] text-gray-400 mt-1",
									children: [
										"Ex: ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "1" }),
										" = uso único · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "50" }),
										" = 50 usos · vazio = ilimitado. Cupons gerados automaticamente pelo exit intent são sempre ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "uso único" }),
										"."
									]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between p-3 border rounded-xl bg-gray-50 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-semibold text-gray-800 flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
										size: 14,
										className: "text-blue-500"
									}), " Apenas primeira compra"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-gray-500 mt-0.5",
									children: "Bloqueia o cupom se o cliente já tiver feito algum pedido (usuário logado) ou se o mesmo e-mail/telefone já tiver comprado antes."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: !!form.apenas_primeira_compra,
									onCheckedChange: (v) => setForm({
										...form,
										apenas_primeira_compra: v
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => setIsModalOpen(false),
									className: "flex-1",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									disabled: saveMutation.isPending,
									className: "flex-1 bg-[#5850ec] text-white",
									children: [saveMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 16,
										className: "animate-spin mr-2"
									}) : null, "Salvar Cupom"]
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
export { AdminCuponsPage as component };
