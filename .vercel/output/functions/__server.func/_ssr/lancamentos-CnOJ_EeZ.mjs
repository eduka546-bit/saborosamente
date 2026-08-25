import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { Bt as CircleArrowUp, H as Plus, Vt as CircleArrowDown, _ as Trash2, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lancamentos-CnOJ_EeZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminLancamentosPage() {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		descricao: "",
		tipo: "receita",
		valor: "",
		categoria: "",
		data: "2024-01-01"
	});
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setForm((prev) => ({
			...prev,
			data: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
		}));
		setMounted(true);
	}, []);
	const { data = [], isLoading } = useQuery({
		queryKey: ["lancamentos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("lancamentos").select("*").order("data", { ascending: false }).order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const addMutation = useMutation({
		mutationFn: async (v) => {
			const { error } = await supabase.from("lancamentos").insert(v);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
			toast.success("Lançamento adicionado!");
			setIsAdding(false);
			setForm({
				descricao: "",
				tipo: "receita",
				valor: "",
				categoria: "",
				data: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("lancamentos").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
			toast.success("Removido.");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const totalReceitas = data.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
	const totalDespesas = data.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Lançamentos"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Registre receitas e despesas manualmente."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsAdding(true),
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Novo Lançamento"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-4 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Receitas"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-2xl font-black text-green-600 mt-1",
							children: ["R$ ", totalReceitas.toFixed(2).replace(".", ",")]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Despesas"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-2xl font-black text-red-500 mt-1",
							children: ["R$ ", totalDespesas.toFixed(2).replace(".", ",")]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Saldo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: `text-2xl font-black mt-1 ${totalReceitas - totalDespesas >= 0 ? "text-blue-600" : "text-red-600"}`,
							children: ["R$ ", (totalReceitas - totalDespesas).toFixed(2).replace(".", ",")]
						})]
					})
				]
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
								children: "Tipo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Descrição"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Categoria"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Valor"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Data"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-6 py-4" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y",
						children: [data.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 6,
							className: "px-6 py-12 text-center text-gray-400",
							children: "Nenhum lançamento registrado."
						}) }), data.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: l.tipo === "receita" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1 text-green-600 font-bold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleArrowUp, { size: 14 }), " Receita"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1 text-red-500 font-bold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleArrowDown, { size: 14 }), " Despesa"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-gray-900",
									children: l.descricao
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										children: l.categoria ?? "—"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: `px-6 py-4 font-bold ${l.tipo === "receita" ? "text-green-600" : "text-red-500"}`,
									children: ["R$ ", Number(l.valor).toFixed(2)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-gray-400 text-xs",
									children: l.data ? format(new Date(l.data), "dd/MM/yyyy", { locale: ptBR }) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-7 w-7 text-gray-400 hover:text-red-500",
										onClick: () => deleteMutation.mutate(l.id),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
									})
								})
							]
						}, l.id))]
					})]
				})
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-6 text-[#5850ec]",
						children: "Novo Lançamento"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
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
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "receita",
										children: "Receita"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "despesa",
										children: "Despesa"
									})]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Valor (R$) *"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									step: "0.01",
									value: form.valor,
									onChange: (e) => setForm({
										...form,
										valor: e.target.value
									}),
									placeholder: "0,00"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Descrição *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.descricao,
								onChange: (e) => setForm({
									...form,
									descricao: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Categoria"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.categoria,
								onChange: (e) => setForm({
									...form,
									categoria: e.target.value
								}),
								placeholder: "Ex: Ingredientes, Aluguel..."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Data"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: form.data,
								onChange: (e) => setForm({
									...form,
									data: e.target.value
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
										descricao: form.descricao,
										tipo: form.tipo,
										valor: Number(form.valor),
										categoria: form.categoria,
										data: form.data
									}),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: !form.descricao || !form.valor,
									children: "Salvar"
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
export { AdminLancamentosPage as component };
