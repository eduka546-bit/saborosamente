import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { F as Search, H as Plus, _ as Trash2, ct as LoaderCircle, gt as Gift } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cashback-CbcEc00K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminCashbackPage() {
	const queryClient = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		user_id: "",
		valor: "",
		descricao: ""
	});
	const { data = [], isLoading } = useQuery({
		queryKey: ["admin-cashback"],
		queryFn: async () => {
			const { data, error } = await supabase.from("cashback").select("*, profiles(nome, email)").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const addMutation = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("cashback").insert(values);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-cashback"] });
			toast.success("Cashback adicionado!");
			setIsAdding(false);
			setForm({
				user_id: "",
				valor: "",
				descricao: ""
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("cashback").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-cashback"] });
			toast.success("Registro removido.");
		}
	});
	const filtered = data.filter((c) => c.profiles?.nome?.toLowerCase().includes(search.toLowerCase()) || c.profiles?.email?.toLowerCase().includes(search.toLowerCase()));
	const total = data.reduce((s, c) => s + (c.valor ?? 0), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Cashback"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Gerencie saldos de cashback dos clientes."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setIsAdding(true),
					className: "bg-[#5850ec] text-white flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Adicionar"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold uppercase text-gray-400 tracking-widest",
						children: "Total distribuído"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-2xl font-black text-green-600 mt-1",
						children: ["R$ ", total.toFixed(2).replace(".", ",")]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold uppercase text-gray-400 tracking-widest",
						children: "Registros"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-2xl font-black text-[#5850ec] mt-1",
						children: data.length
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border p-4 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
						size: 18
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Buscar por cliente...",
						className: "pl-10",
						value: search,
						onChange: (e) => setSearch(e.target.value)
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
				className: "bg-white rounded-2xl border border-dashed p-16 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, {
					size: 40,
					className: "mx-auto text-gray-200 mb-3"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-400",
					children: "Nenhum cashback registrado."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Valor"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Descrição"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4",
								children: "Data"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-6 py-4" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y",
						children: filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-bold text-gray-900",
										children: c.profiles?.nome ?? "—"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-gray-400",
										children: c.profiles?.email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-4 font-bold text-green-600",
									children: ["R$ ", Number(c.valor).toFixed(2)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-gray-600",
									children: c.descricao ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 text-gray-400 text-xs",
									children: new Date(c.created_at).toLocaleDateString("pt-BR")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "text-gray-400 hover:text-red-500 h-7 w-7",
										onClick: () => deleteMutation.mutate(c.id),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
									})
								})
							]
						}, c.id))
					})]
				})
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-md p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-6 text-[#5850ec]",
						children: "Adicionar Cashback"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "ID do Usuário"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.user_id,
								onChange: (e) => setForm({
									...form,
									user_id: e.target.value
								}),
								placeholder: "UUID do usuário"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Valor (R$)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								value: form.valor,
								onChange: (e) => setForm({
									...form,
									valor: e.target.value
								}),
								placeholder: "10.00"
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
								placeholder: "Ex: Bônus de fidelidade"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setIsAdding(false),
									className: "flex-1",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => addMutation.mutate({
										user_id: form.user_id,
										valor: Number(form.valor),
										descricao: form.descricao
									}),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: addMutation.isPending,
									children: [addMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 16,
										className: "animate-spin mr-2"
									}) : null, " Salvar"]
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
export { AdminCashbackPage as component };
