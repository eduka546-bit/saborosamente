import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { G as PenLine, H as Plus, I as Save, Wt as ChevronRight, _ as Trash2, ct as LoaderCircle, i as X, rt as MapPin } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/taxas-WSDVAVjl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EMPTY_BAIRRO = {
	bairro: "",
	taxa: ""
};
function AdminConfigTaxasPage() {
	const queryClient = useQueryClient();
	const [cidadeSelecionada, setCidadeSelecionada] = (0, import_react.useState)(null);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editForm, setEditForm] = (0, import_react.useState)({
		bairro: "",
		taxa: ""
	});
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [addForm, setAddForm] = (0, import_react.useState)(EMPTY_BAIRRO);
	const [novaCidade, setNovaCidade] = (0, import_react.useState)("");
	const [showNovaCidade, setShowNovaCidade] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const { data: locais = [], isLoading } = useQuery({
		queryKey: ["delivery-rates-admin"],
		queryFn: async () => {
			const { data, error } = await supabase.from("delivery_rates").select("*").order("cidade").order("bairro");
			if (error) throw error;
			return data ?? [];
		}
	});
	const cidades = (0, import_react.useMemo)(() => {
		const map = {};
		for (const l of locais) {
			if (!map[l.cidade]) map[l.cidade] = [];
			map[l.cidade].push(l);
		}
		return map;
	}, [locais]);
	const cidadesList = Object.keys(cidades).sort();
	const bairrosFiltrados = (0, import_react.useMemo)(() => {
		if (!cidadeSelecionada) return [];
		const lista = cidades[cidadeSelecionada] ?? [];
		if (!search) return lista;
		return lista.filter((b) => b.bairro.toLowerCase().includes(search.toLowerCase()));
	}, [
		cidadeSelecionada,
		cidades,
		search
	]);
	const addMutation = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("delivery_rates").insert({
				bairro: values.bairro.trim(),
				cidade: values.cidade.trim(),
				valor: Number(values.taxa),
				ativo: true
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
			queryClient.invalidateQueries({ queryKey: ["taxas"] });
			toast.success("Bairro adicionado!");
			setIsAdding(false);
			setAddForm(EMPTY_BAIRRO);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, values }) => {
			const { error } = await supabase.from("delivery_rates").update({
				bairro: values.bairro,
				valor: Number(values.taxa)
			}).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
			queryClient.invalidateQueries({ queryKey: ["taxas"] });
			toast.success("Atualizado!");
			setEditingId(null);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("delivery_rates").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
			queryClient.invalidateQueries({ queryKey: ["taxas"] });
			toast.success("Bairro removido.");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteCidadeMutation = useMutation({
		mutationFn: async (cidade) => {
			const { error } = await supabase.from("delivery_rates").delete().eq("cidade", cidade);
			if (error) throw error;
		},
		onSuccess: (_, cidade) => {
			queryClient.invalidateQueries({ queryKey: ["delivery-rates-admin"] });
			queryClient.invalidateQueries({ queryKey: ["taxas"] });
			if (cidadeSelecionada === cidade) setCidadeSelecionada(null);
			toast.success("Cidade removida.");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Áreas de Entrega"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: [
						cidadesList.length,
						" cidades · ",
						locais.length,
						" bairros atendidos"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => setShowNovaCidade(true),
					className: "bg-[#5850ec] hover:bg-[#5850ec]/90 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Nova cidade"]
				})]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-24",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 28
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-4 h-[calc(100vh-180px)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1",
					children: [cidadesList.map((cidade) => {
						const count = cidades[cidade]?.length ?? 0;
						const ativa = cidadeSelecionada === cidade;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								setCidadeSelecionada(cidade);
								setSearch("");
								setIsAdding(false);
								setEditingId(null);
							},
							className: `w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${ativa ? "bg-[#5850ec] text-white border-[#5850ec] shadow-md" : "bg-white text-gray-700 border-gray-100 hover:border-[#5850ec]/30 hover:bg-[#5850ec]/5"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `font-semibold text-sm ${ativa ? "text-white" : "text-gray-800"}`,
								children: cidade
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `text-[11px] mt-0.5 ${ativa ? "text-white/70" : "text-gray-400"}`,
								children: [count, " bairros"]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
								size: 16,
								className: ativa ? "text-white/70" : "text-gray-300 group-hover:text-[#5850ec]"
							})]
						}, cidade);
					}), cidadesList.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-12 text-center text-gray-400 text-sm",
						children: "Nenhuma cidade cadastrada."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 flex flex-col bg-white rounded-2xl border overflow-hidden",
					children: !cidadeSelecionada ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center justify-center h-full gap-3 text-gray-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
							size: 40,
							className: "opacity-20"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: "Selecione uma cidade para ver os bairros"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between px-6 py-4 border-b bg-gray-50/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
										size: 16,
										className: "text-[#5850ec]"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-bold text-gray-800",
										children: cidadeSelecionada
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full",
										children: [bairrosFiltrados.length, " bairros"]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Buscar bairro...",
										value: search,
										onChange: (e) => setSearch(e.target.value),
										className: "h-8 text-sm w-48"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										onClick: () => {
											setIsAdding(true);
											setAddForm(EMPTY_BAIRRO);
										},
										className: "bg-[#5850ec] text-white h-8 gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " Bairro"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											if (confirm(`Remover a cidade "${cidadeSelecionada}" e todos os seus bairros?`)) deleteCidadeMutation.mutate(cidadeSelecionada);
										},
										className: "p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all",
										title: "Remover cidade",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 })
									})
								]
							})]
						}),
						isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 px-6 py-3 bg-[#5850ec]/5 border-b",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									autoFocus: true,
									placeholder: "Nome do bairro",
									value: addForm.bairro,
									onChange: (e) => setAddForm((p) => ({
										...p,
										bairro: e.target.value
									})),
									className: "flex-1 h-8 text-sm",
									onKeyDown: (e) => e.key === "Escape" && setIsAdding(false)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-gray-400",
										children: "R$"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										step: "0.01",
										placeholder: "10.00",
										value: addForm.taxa,
										onChange: (e) => setAddForm((p) => ({
											...p,
											taxa: e.target.value
										})),
										className: "w-24 h-8 text-sm"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									className: "h-8 bg-[#5850ec] text-white",
									disabled: addMutation.isPending || !addForm.bairro || !addForm.taxa,
									onClick: () => addMutation.mutate({
										...addForm,
										cidade: cidadeSelecionada
									}),
									children: addMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 13,
										className: "animate-spin"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 13 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setIsAdding(false),
									className: "text-gray-400 hover:text-gray-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-widest border-b sticky top-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 text-left",
											children: "Bairro"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 text-left",
											children: "Taxa de entrega"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-6 py-3 text-right",
											children: "Ações"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
									className: "divide-y",
									children: [bairrosFiltrados.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
										className: "hover:bg-gray-50 transition-colors",
										children: editingId === b.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: editForm.bairro,
													onChange: (e) => setEditForm((p) => ({
														...p,
														bairro: e.target.value
													})),
													className: "h-8 text-xs",
													autoFocus: true
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs text-gray-400",
														children: "R$"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														step: "0.01",
														value: editForm.taxa,
														onChange: (e) => setEditForm((p) => ({
															...p,
															taxa: e.target.value
														})),
														className: "h-8 text-xs w-24"
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-4 py-2 text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex gap-1 justify-end",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "icon",
														variant: "ghost",
														className: "h-7 w-7 text-green-600 hover:bg-green-50",
														onClick: () => updateMutation.mutate({
															id: b.id,
															values: editForm
														}),
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 13 })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "icon",
														variant: "ghost",
														className: "h-7 w-7 text-gray-400",
														onClick: () => setEditingId(null),
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
													})]
												})
											})
										] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-3.5 font-medium text-gray-900",
												children: b.bairro
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-3.5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-green-700 font-bold bg-green-50 border border-green-100 px-3 py-1 rounded-full text-xs",
													children: ["R$ ", Number(b.valor).toFixed(2).replace(".", ",")]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-3.5 text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex gap-1 justify-end",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => {
															setEditingId(b.id);
															setEditForm({
																bairro: b.bairro,
																taxa: b.valor
															});
														},
														className: "p-1.5 text-gray-400 hover:text-[#5850ec] hover:bg-[#5850ec]/10 rounded-lg transition-all",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 14 })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => confirm(`Remover "${b.bairro}"?`) && deleteMutation.mutate(b.id),
														className: "p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
													})]
												})
											})
										] })
									}, b.id)), bairrosFiltrados.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 3,
										className: "px-6 py-12 text-center text-gray-400 text-sm",
										children: search ? `Nenhum bairro encontrado para "${search}"` : "Nenhum bairro cadastrado."
									}) })]
								})]
							})
						})
					] })
				})]
			}),
			showNovaCidade && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-sm p-6 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-bold text-[#5850ec]",
							children: "Nova Cidade"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							autoFocus: true,
							placeholder: "Nome da cidade",
							value: novaCidade,
							onChange: (e) => setNovaCidade(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter" && novaCidade.trim()) {
									setCidadeSelecionada(novaCidade.trim());
									setNovaCidade("");
									setShowNovaCidade(false);
									setIsAdding(true);
									toast.info(`Cidade "${novaCidade.trim()}" criada. Adicione os bairros agora.`);
								}
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400",
							children: "A cidade será criada quando você adicionar o primeiro bairro."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								className: "flex-1",
								onClick: () => {
									setShowNovaCidade(false);
									setNovaCidade("");
								},
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "flex-1 bg-[#5850ec] text-white",
								disabled: !novaCidade.trim(),
								onClick: () => {
									setCidadeSelecionada(novaCidade.trim());
									setNovaCidade("");
									setShowNovaCidade(false);
									setIsAdding(true);
									toast.info(`Adicione os bairros de "${novaCidade.trim()}".`);
								},
								children: "Continuar"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { AdminConfigTaxasPage as component };
