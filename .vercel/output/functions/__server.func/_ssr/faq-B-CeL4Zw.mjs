import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { G as PenLine, H as Plus, I as Save, It as CircleQuestionMark, _ as Trash2, ct as LoaderCircle, i as X } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/faq-B-CeL4Zw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminFaqPage() {
	const queryClient = useQueryClient();
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [form, setForm] = (0, import_react.useState)({
		pergunta: "",
		resposta: ""
	});
	const [editForm, setEditForm] = (0, import_react.useState)({
		pergunta: "",
		resposta: ""
	});
	const [contato, setContato] = (0, import_react.useState)({
		whatsapp: "",
		instagram: "",
		email: ""
	});
	const [settingsId, setSettingsId] = (0, import_react.useState)(null);
	const [savingContato, setSavingContato] = (0, import_react.useState)(false);
	const { data: faqs = [], isLoading } = useQuery({
		queryKey: ["admin-faq"],
		queryFn: async () => {
			const { data, error } = await supabase.from("faq").select("*").order("ordem");
			if (error) throw error;
			return data;
		}
	});
	useQuery({
		queryKey: ["site-settings-faq"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("id, contato_whatsapp, contato_instagram, contato_email, footer_whatsapp, footer_instagram").maybeSingle();
			if (data) {
				setSettingsId(data.id);
				setContato({
					whatsapp: data.contato_whatsapp || data.footer_whatsapp || "",
					instagram: data.contato_instagram || data.footer_instagram || "",
					email: data.contato_email || ""
				});
			}
			return data;
		}
	});
	const addMutation = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("faq").insert({
				...values,
				ordem: faqs.length,
				ativo: true
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
			toast.success("Pergunta adicionada!");
			setIsAdding(false);
			setForm({
				pergunta: "",
				resposta: ""
			});
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, values }) => {
			const { error } = await supabase.from("faq").update(values).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
			toast.success("Atualizado!");
			setEditingId(null);
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("faq").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
			toast.success("Removido.");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const saveContato = async () => {
		if (!settingsId) return;
		setSavingContato(true);
		const { error } = await supabase.from("site_settings").update({
			contato_whatsapp: contato.whatsapp,
			contato_instagram: contato.instagram,
			contato_email: contato.email,
			footer_whatsapp: contato.whatsapp,
			footer_instagram: contato.instagram
		}).eq("id", settingsId);
		setSavingContato(false);
		if (error) toast.error("Erro: " + error.message);
		else {
			queryClient.invalidateQueries({ queryKey: ["site-settings"] });
			toast.success("Links salvos!");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-3xl mx-auto space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "text-2xl font-bold text-[#5850ec] flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { size: 22 }), " Fale Conosco — Configurações"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Gerencie os links de contato e as perguntas frequentes."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border p-6 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-gray-800",
						children: "Links de Contato"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-bold uppercase text-gray-400",
									children: "WhatsApp (com DDI)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: contato.whatsapp,
									onChange: (e) => setContato({
										...contato,
										whatsapp: e.target.value
									}),
									placeholder: "5547991507757"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-bold uppercase text-gray-400",
									children: "Instagram (sem @)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: contato.instagram,
									onChange: (e) => setContato({
										...contato,
										instagram: e.target.value
									}),
									placeholder: "saborosamente.sbs"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs font-bold uppercase text-gray-400",
									children: "E-mail (opcional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: contato.email,
									onChange: (e) => setContato({
										...contato,
										email: e.target.value
									}),
									placeholder: "contato@exemplo.com"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: saveContato,
						disabled: savingContato,
						className: "bg-[#5850ec] text-white",
						children: [savingContato ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 16,
							className: "animate-spin mr-2"
						}) : null, " Salvar Links"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border p-6 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-gray-800",
						children: "Perguntas Frequentes (FAQ)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => setIsAdding(true),
						size: "sm",
						className: "bg-[#5850ec] text-white flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " Adicionar"]
					})]
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center py-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "animate-spin text-[#5850ec]",
						size: 28
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [faqs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-8 text-gray-400 text-sm border border-dashed rounded-xl",
						children: "Nenhuma pergunta cadastrada."
					}), faqs.map((faq) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `border rounded-xl p-4 space-y-2 ${!faq.ativo ? "opacity-50" : ""}`,
						children: editingId === faq.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: editForm.pergunta,
									onChange: (e) => setEditForm({
										...editForm,
										pergunta: e.target.value
									}),
									placeholder: "Pergunta"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: editForm.resposta,
									onChange: (e) => setEditForm({
										...editForm,
										resposta: e.target.value
									}),
									placeholder: "Resposta",
									className: "w-full rounded-xl border px-3 py-2 text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-[#5850ec]/30"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										className: "bg-[#5850ec] text-white",
										onClick: () => updateMutation.mutate({
											id: faq.id,
											values: editForm
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
											size: 13,
											className: "mr-1"
										}), " Salvar"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => setEditingId(null),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 })
									})]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-gray-900 text-sm",
									children: faq.pergunta
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-gray-500 mt-1 line-clamp-2",
									children: faq.resposta
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 shrink-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: faq.ativo,
										onCheckedChange: (v) => updateMutation.mutate({
											id: faq.id,
											values: { ativo: v }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-7 w-7 text-gray-400 hover:text-[#5850ec]",
										onClick: () => {
											setEditingId(faq.id);
											setEditForm({
												pergunta: faq.pergunta,
												resposta: faq.resposta
											});
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { size: 13 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-7 w-7 text-gray-400 hover:text-red-500",
										onClick: () => {
											if (confirm("Excluir?")) deleteMutation.mutate(faq.id);
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
									})
								]
							})]
						})
					}, faq.id))]
				})]
			}),
			isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl w-full max-w-lg p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-5 text-[#5850ec]",
						children: "Nova Pergunta"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Pergunta *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.pergunta,
								onChange: (e) => setForm({
									...form,
									pergunta: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Resposta *"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: form.resposta,
								onChange: (e) => setForm({
									...form,
									resposta: e.target.value
								}),
								className: "w-full rounded-xl border px-3 py-2 text-sm resize-none h-28 outline-none focus:ring-2 focus:ring-[#5850ec]/30"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setIsAdding(false),
									className: "flex-1",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => addMutation.mutate(form),
									className: "flex-1 bg-[#5850ec] text-white",
									disabled: !form.pergunta || !form.resposta || addMutation.isPending,
									children: [addMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 14,
										className: "animate-spin mr-2"
									}) : null, " Adicionar"]
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
export { AdminFaqPage as component };
