import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, C as Sun, Ct as EyeOff, D as Smile, F as Search, Gt as ChevronLeft, H as Plus, I as Save, K as Paperclip, N as Settings, P as Send, St as Eye, W as Pencil, X as Moon, Yt as CheckCheck, _ as Trash2, bt as File, ct as LoaderCircle, d as Upload, l as User, m as TriangleAlert, r as Zap, tn as Bot, ut as Info, v as ToggleLeft, xt as FileText, y as ToggleRight } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { i as isToday, n as isYesterday, o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agente-BzCql850.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function sendManualMessage(to, text) {
	try {
		const response = await fetch(`https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-send`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg"
			},
			body: JSON.stringify({
				to,
				text
			})
		});
		const body = await response.json().catch(() => ({}));
		if (!response.ok) {
			const detail = body?.error?.error?.message ?? body?.error ?? JSON.stringify(body);
			return {
				ok: false,
				errorMsg: String(detail)
			};
		}
		return { ok: true };
	} catch (e) {
		return {
			ok: false,
			errorMsg: e.message
		};
	}
}
function formatMsgTime(iso) {
	const d = new Date(iso);
	if (isToday(d)) return format(d, "HH:mm");
	if (isYesterday(d)) return "Ontem";
	return format(d, "dd/MM", { locale: ptBR });
}
function getInitials(name) {
	return name?.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?";
}
var DARK = {
	app: "bg-[#111b21]",
	sidebar: "bg-[#111b21]",
	sidebarHeader: "bg-[#202c33]",
	sidebarSearch: "bg-[#202c33]",
	sidebarSearchInput: "bg-[#2a3942] text-[#d1d7db]",
	chatBg: "bg-[#0b141a]",
	chatPattern: "opacity-[0.03]",
	chatHeader: "bg-[#202c33]",
	chatInput: "bg-[#202c33]",
	chatInputField: "bg-[#2a3942] text-[#d1d7db]",
	contactItem: "hover:bg-[#202c33]",
	contactItemActive: "bg-[#2a3942]",
	contactDivider: "bg-[#2a3942]",
	text: "text-[#e9edef]",
	textSub: "text-[#8696a0]",
	textTime: "text-[#8696a0]",
	bubbleOut: "bg-[#005c4b] text-[#e9edef]",
	bubbleIn: "bg-[#202c33] text-[#e9edef]",
	bubbleManual: "bg-[#1d4b3a] text-[#e9edef]",
	settingsPanel: "bg-[#111b21]",
	settingsCard: "bg-[#202c33] border-[#2a3942]",
	settingsInput: "bg-[#2a3942] border-[#3b4a54] text-[#e9edef]",
	settingsLabel: "text-[#8696a0]",
	badge: "bg-[#00a884] text-white",
	badgeHumano: "bg-[#f0a202] text-white",
	divider: "border-[#2a3942]"
};
var LIGHT = {
	app: "bg-[#f0f2f5]",
	sidebar: "bg-white",
	sidebarHeader: "bg-[#f0f2f5]",
	sidebarSearch: "bg-[#f0f2f5]",
	sidebarSearchInput: "bg-white text-[#3b4a54]",
	chatBg: "bg-[#efeae2]",
	chatPattern: "opacity-[0.06]",
	chatHeader: "bg-[#f0f2f5]",
	chatInput: "bg-[#f0f2f5]",
	chatInputField: "bg-white text-[#3b4a54]",
	contactItem: "hover:bg-[#f5f6f6]",
	contactItemActive: "bg-[#f0f2f5]",
	contactDivider: "bg-[#e9edef]",
	text: "text-[#111b21]",
	textSub: "text-[#667781]",
	textTime: "text-[#667781]",
	bubbleOut: "bg-[#d9fdd3] text-[#111b21]",
	bubbleIn: "bg-white text-[#111b21]",
	bubbleManual: "bg-[#fff3cd] text-[#111b21]",
	settingsPanel: "bg-[#f0f2f5]",
	settingsCard: "bg-white border-[#e9edef]",
	settingsInput: "bg-white border-[#e9edef] text-[#111b21]",
	settingsLabel: "text-[#667781]",
	badge: "bg-[#25d366] text-white",
	badgeHumano: "bg-[#f0a202] text-white",
	divider: "border-[#e9edef]"
};
var CATEGORIAS = {
	identidade: {
		label: "Identidade",
		cor: "bg-purple-100 text-purple-700 border-purple-200"
	},
	cardapio: {
		label: "Cardápio",
		cor: "bg-green-100 text-green-700 border-green-200"
	},
	pedidos: {
		label: "Pedidos",
		cor: "bg-blue-100 text-blue-700 border-blue-200"
	},
	entregas: {
		label: "Entregas",
		cor: "bg-orange-100 text-orange-700 border-orange-200"
	},
	comportamento: {
		label: "Comportamento",
		cor: "bg-gray-100 text-gray-700 border-gray-200"
	}
};
function AbaModulos({ dark }) {
	const t = dark ? DARK : LIGHT;
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editForm, setEditForm] = (0, import_react.useState)({
		nome: "",
		categoria: "comportamento",
		conteudo: ""
	});
	const [criando, setCriando] = (0, import_react.useState)(false);
	const [novoForm, setNovoForm] = (0, import_react.useState)({
		nome: "",
		categoria: "comportamento",
		conteudo: ""
	});
	const [filtroCategoria, setFiltroCategoria] = (0, import_react.useState)("todos");
	const { data: modulos = [], isLoading } = useQuery({
		queryKey: ["agente-modulos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("agente_modulos").select("*").order("ordem");
			if (error) throw error;
			return data ?? [];
		},
		staleTime: 1e3 * 60 * 5,
		gcTime: 300 * 1e3
	});
	const updateMutation = useMutation({
		mutationFn: async ({ id, values }) => {
			const { error } = await supabase.from("agente_modulos").update({
				...values,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["agente-modulos"],
				exact: true
			});
			setEditingId(null);
			toast.success("Módulo salvo!");
		},
		onError: (e) => {
			console.error("Erro ao salvar módulo:", e);
			toast.error(e.message || "Erro ao salvar");
		}
	});
	const toggleMutation = useMutation({
		mutationFn: async ({ id, ativo }) => {
			const { error } = await supabase.from("agente_modulos").update({ ativo }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({
			queryKey: ["agente-modulos"],
			exact: true
		})
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("agente_modulos").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["agente-modulos"],
				exact: true
			});
			toast.success("Módulo removido.");
		},
		onError: (e) => {
			console.error("Erro ao remover módulo:", e);
			toast.error(e.message || "Erro ao remover");
		}
	});
	const criarMutation = useMutation({
		mutationFn: async (values) => {
			const maxOrdem = modulos.reduce((m, mod) => Math.max(m, mod.ordem ?? 0), 0);
			const { error } = await supabase.from("agente_modulos").insert({
				...values,
				ativo: true,
				ordem: maxOrdem + 1
			});
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["agente-modulos"],
				exact: true
			});
			setCriando(false);
			setNovoForm({
				nome: "",
				categoria: "comportamento",
				conteudo: ""
			});
			toast.success("Módulo criado!");
		},
		onError: (e) => {
			console.error("Erro ao criar módulo:", e);
			toast.error(e.message || "Erro ao criar");
		}
	});
	const modulosFiltrados = filtroCategoria === "todos" ? modulos : modulos.filter((m) => m.categoria === filtroCategoria);
	const ativosCount = modulos.filter((m) => m.ativo).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `rounded-xl border p-4 flex items-center justify-between ${t.settingsCard}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `text-sm font-semibold ${t.text}`,
					children: "Módulos do Prompt"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `text-xs ${t.textSub}`,
					children: [
						ativosCount,
						" de ",
						modulos.length,
						" ativos · A IA usa apenas os módulos ativados"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setCriando(true),
					className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00a884] text-white text-xs font-semibold hover:bg-[#008f72] transition-all",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 13 }), " Novo módulo"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setFiltroCategoria("todos"),
					className: `px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filtroCategoria === "todos" ? "bg-[#00a884] text-white border-[#00a884]" : `${t.settingsCard} ${t.textSub}`}`,
					children: [
						"Todos (",
						modulos.length,
						")"
					]
				}), Object.entries(CATEGORIAS).map(([key, cat]) => {
					const count = modulos.filter((m) => m.categoria === key).length;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setFiltroCategoria(key),
						className: `px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filtroCategoria === key ? cat.cor + " font-bold" : `${t.settingsCard} ${t.textSub}`}`,
						children: [
							cat.label,
							" (",
							count,
							")"
						]
					}, key);
				})]
			}),
			criando && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `rounded-xl border p-4 space-y-3 ${t.settingsCard}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `text-sm font-bold ${t.text}`,
						children: "Novo módulo"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
							children: "Nome"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: novoForm.nome,
							onChange: (e) => setNovoForm((p) => ({
								...p,
								nome: e.target.value
							})),
							placeholder: "Ex: Promoções especiais",
							className: `mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
							children: "Categoria"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: novoForm.categoria,
							onChange: (e) => setNovoForm((p) => ({
								...p,
								categoria: e.target.value
							})),
							className: `mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`,
							children: Object.entries(CATEGORIAS).map(([key, cat]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: key,
								children: cat.label
							}, key))
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
						children: "Conteúdo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: novoForm.conteudo,
						onChange: (e) => setNovoForm((p) => ({
							...p,
							conteudo: e.target.value
						})),
						placeholder: "Escreva as instruções deste módulo...",
						rows: 5,
						className: `mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] resize-none leading-relaxed ${t.settingsInput}`
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => criarMutation.mutate(novoForm),
							disabled: !novoForm.nome.trim() || !novoForm.conteudo.trim() || criarMutation.isPending,
							className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-semibold disabled:opacity-50",
							children: [
								criarMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									size: 12,
									className: "animate-spin"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 12 }),
								" ",
								"Criar"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setCriando(false);
								setNovoForm({
									nome: "",
									categoria: "comportamento",
									conteudo: ""
								});
							},
							className: `px-3 py-1.5 rounded-lg text-xs font-semibold ${t.textSub}`,
							children: "Cancelar"
						})]
					})
				]
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#00a884]",
					size: 20
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: modulosFiltrados.map((mod) => {
					const cat = CATEGORIAS[mod.categoria] ?? CATEGORIAS.comportamento;
					const isEditing = editingId === mod.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `rounded-xl border transition-all ${t.settingsCard} ${!mod.ativo ? "opacity-50" : ""}`,
						children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
										children: "Nome"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: editForm.nome,
										onChange: (e) => setEditForm((p) => ({
											...p,
											nome: e.target.value
										})),
										className: `mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
										children: "Categoria"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: editForm.categoria,
										onChange: (e) => setEditForm((p) => ({
											...p,
											categoria: e.target.value
										})),
										className: `mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`,
										children: Object.entries(CATEGORIAS).map(([key, c]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: key,
											children: c.label
										}, key))
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center mb-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
										children: "Conteúdo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `text-[10px] ${t.textSub}`,
										children: [editForm.conteudo.length, " chars"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: editForm.conteudo,
									onChange: (e) => setEditForm((p) => ({
										...p,
										conteudo: e.target.value
									})),
									rows: 8,
									className: `w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] resize-none leading-relaxed font-mono ${t.settingsInput}`
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => updateMutation.mutate({
											id: mod.id,
											values: editForm
										}),
										disabled: updateMutation.isPending,
										className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-semibold",
										children: [
											updateMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												size: 12,
												className: "animate-spin"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 12 }),
											" ",
											"Salvar"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setEditingId(null),
										className: `px-3 py-1.5 rounded-lg text-xs font-semibold ${t.textSub}`,
										children: "Cancelar"
									})]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 flex-wrap",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-xs font-bold px-2 py-0.5 rounded-full border ${cat.cor}`,
											children: cat.label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-sm font-semibold ${t.text}`,
											children: mod.nome
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1 shrink-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => toggleMutation.mutate({
													id: mod.id,
													ativo: !mod.ativo
												}),
												title: mod.ativo ? "Desativar" : "Ativar",
												className: `p-1.5 rounded-lg transition-all ${mod.ativo ? "text-[#00a884]" : t.textSub}`,
												children: mod.ativo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRight, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleLeft, { size: 18 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													setEditingId(mod.id);
													setEditForm({
														nome: mod.nome,
														categoria: mod.categoria,
														conteudo: mod.conteudo
													});
												},
												className: `p-1.5 rounded-lg hover:text-[#00a884] transition-all ${t.textSub}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => confirm(`Remover o módulo "${mod.nome}"?`) && deleteMutation.mutate(mod.id),
												className: "p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-all",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-[11px] mt-2 leading-relaxed line-clamp-2 ${t.textSub}`,
									children: mod.conteudo
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: `text-[10px] mt-1 ${t.textSub} opacity-60`,
									children: [mod.conteudo.length, " chars"]
								})
							]
						})
					}, mod.id);
				})
			})
		]
	});
}
function PainelConfig({ dark, config, setConfig, saveConfig, saving, onClose }) {
	const t = dark ? DARK : LIGHT;
	const queryClient = useQueryClient();
	const fileInputRef = (0, import_react.useRef)(null);
	const [tab, setTab] = (0, import_react.useState)("instrucoes");
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [novoArquivo, setNovoArquivo] = (0, import_react.useState)({
		nome: "",
		descricao: "",
		tipo: "imagem"
	});
	const [arquivoSelecionado, setArquivoSelecionado] = (0, import_react.useState)(null);
	const { data: arquivos = [], isLoading: loadingArquivos } = useQuery({
		queryKey: ["agente-arquivos"],
		queryFn: async () => {
			const { data } = await supabase.from("agente_arquivos").select("*").order("ordem").order("created_at");
			return data ?? [];
		}
	});
	const toggleAtivoMutation = useMutation({
		mutationFn: async ({ id, ativo }) => {
			const { error } = await supabase.from("agente_arquivos").update({ ativo }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] })
	});
	const deleteMutation = useMutation({
		mutationFn: async ({ id, storagePath }) => {
			if (storagePath) await supabase.storage.from("agente-arquivos").remove([storagePath]);
			const { error } = await supabase.from("agente_arquivos").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] });
			toast.success("Removido!");
		}
	});
	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setArquivoSelecionado(file);
		if (!novoArquivo.nome) setNovoArquivo((p) => ({
			...p,
			nome: file.name.replace(/\.[^/.]+$/, "")
		}));
		if (file.type.startsWith("image/")) setNovoArquivo((p) => ({
			...p,
			tipo: "imagem"
		}));
		else if (file.type === "application/pdf") setNovoArquivo((p) => ({
			...p,
			tipo: "pdf"
		}));
		else setNovoArquivo((p) => ({
			...p,
			tipo: "documento"
		}));
	};
	const handleUpload = async () => {
		if (!arquivoSelecionado) {
			toast.error("Selecione um arquivo");
			return;
		}
		if (!novoArquivo.nome.trim()) {
			toast.error("Informe um nome");
			return;
		}
		if (!novoArquivo.descricao.trim()) {
			toast.error("Informe a descrição para a IA");
			return;
		}
		setUploading(true);
		try {
			const ext = arquivoSelecionado.name.split(".").pop();
			const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
			console.log("Iniciando upload para:", path, "Tamanho:", arquivoSelecionado.size);
			const { error: upErr, data } = await supabase.storage.from("agente-arquivos").upload(path, arquivoSelecionado);
			console.log("Resposta upload:", {
				upErr,
				data
			});
			if (upErr) {
				console.error("Erro detalhado:", upErr);
				throw new Error(`Erro ao fazer upload: ${upErr.message}`);
			}
			const { data: { publicUrl } } = supabase.storage.from("agente-arquivos").getPublicUrl(path);
			console.log("URL pública:", publicUrl);
			const { error: insErr } = await supabase.from("agente_arquivos").insert({
				nome: novoArquivo.nome.trim(),
				descricao: novoArquivo.descricao.trim(),
				tipo: novoArquivo.tipo,
				url: publicUrl,
				storage_path: path,
				ativo: true,
				ordem: arquivos.length
			});
			if (insErr) throw new Error(`Erro ao salvar no banco: ${insErr.message}`);
			toast.success("Arquivo adicionado!");
			setNovoArquivo({
				nome: "",
				descricao: "",
				tipo: "imagem"
			});
			setArquivoSelecionado(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] });
		} catch (e) {
			console.error("Erro completo:", e);
			toast.error(e.message);
		} finally {
			setUploading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex flex-col h-full ${t.settingsPanel}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex items-center gap-4 px-4 py-4 ${t.sidebarHeader}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: `p-1.5 rounded-full hover:bg-black/10 ${t.text}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `font-semibold text-base ${t.text}`,
					children: "Configurações"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `flex border-b ${t.divider} shrink-0`,
				children: [
					{
						id: "instrucoes",
						label: "Instruções"
					},
					{
						id: "modulos",
						label: "🧩 Módulos"
					},
					{
						id: "arquivos",
						label: "📎 Arquivos"
					},
					{
						id: "webhook",
						label: "Técnico"
					}
				].map((tb) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTab(tb.id),
					className: `flex-1 py-3 text-xs font-semibold transition-all ${tab === tb.id ? "border-b-2 border-[#00a884] text-[#00a884]" : t.textSub}`,
					children: tb.label
				}, tb.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto p-4 space-y-4",
				children: [
					tab === "instrucoes" && config && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `flex items-center justify-between p-4 rounded-xl border ${t.settingsCard}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-sm font-semibold ${t.text}`,
								children: "Agente ativo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-xs ${t.textSub}`,
								children: "Saborosa responde automaticamente"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: config.ativo,
								onCheckedChange: (v) => setConfig({
									...config,
									ativo: v
								}),
								className: "data-[state=checked]:bg-[#00a884]"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `rounded-xl border p-4 space-y-3 ${config.modo_treino ? dark ? "border-yellow-600 bg-yellow-900/20" : "border-yellow-300 bg-yellow-50" : t.settingsCard}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: `text-sm font-semibold flex items-center gap-1.5 ${config.modo_treino ? "text-yellow-500" : t.text}`,
									children: ["🎓 Modo Treino", config.modo_treino && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse",
										children: "ATIVO"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-xs ${t.textSub}`,
									children: "Ensine a IA conversando pelo WhatsApp"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: !!config.modo_treino,
									onCheckedChange: (v) => setConfig({
										...config,
										modo_treino: v
									}),
									className: "data-[state=checked]:bg-yellow-500"
								})]
							}), config.modo_treino && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 animate-in fade-in duration-200",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `text-[11px] rounded-lg px-3 py-2.5 leading-relaxed ${dark ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-50 text-yellow-800"} border ${dark ? "border-yellow-700" : "border-yellow-200"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-bold mb-1",
											children: "Como funciona:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1. Informe seu número abaixo e salve" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2. No WhatsApp, converse normalmente com a Saborosa" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3. Envie qualquer instrução e ela salva como módulo" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1.5 font-bold",
											children: "Comandos especiais:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "bg-black/10 px-1 rounded",
											children: "#ver"
										}), " — ver módulos recentes"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "bg-black/10 px-1 rounded",
											children: "#testar"
										}), " — ela responde como cliente"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "bg-black/10 px-1 rounded",
											children: "#sair"
										}), " — desativa o modo treino"] })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
									children: "Seu número (com DDI, sem +)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: config.treinador_telefone ?? "",
									onChange: (e) => setConfig({
										...config,
										treinador_telefone: e.target.value.replace(/\D/g, "")
									}),
									placeholder: "Ex: 5547997391514",
									className: `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${t.settingsInput}`
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `rounded-xl border p-4 space-y-3 ${t.settingsCard}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: `text-[10px] font-bold uppercase tracking-wider ${t.settingsLabel}`,
									children: "Nome da assistente"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: config.nome_agente,
									onChange: (e) => setConfig({
										...config,
										nome_agente: e.target.value
									}),
									className: `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00a884]/40 ${t.settingsInput}`
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between items-center mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: `text-[10px] font-bold uppercase tracking-wider ${t.settingsLabel}`,
											children: "System Prompt"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `text-[10px] ${t.textSub}`,
											children: [config.system_prompt?.length ?? 0, " chars"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `text-[10px] rounded-lg px-3 py-2 mb-2 flex gap-1.5 items-start ${dark ? "bg-[#1b3a2d] text-[#5cad8a]" : "bg-[#f0fff8] text-[#128c7e]"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
											size: 11,
											className: "shrink-0 mt-0.5"
										}), "Cardápio, bairros, formas de pagamento e arquivos são injetados automaticamente."]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: config.system_prompt,
										onChange: (e) => setConfig({
											...config,
											system_prompt: e.target.value
										}),
										rows: 14,
										className: `w-full rounded-lg border px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#00a884]/40 resize-none leading-relaxed ${t.settingsInput}`
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: saveConfig,
									disabled: saving,
									className: "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00a884] text-white text-sm font-semibold hover:bg-[#008f72] transition-all disabled:opacity-60",
									children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 15,
										className: "animate-spin"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 15 }), "Salvar"]
								})
							]
						})
					] }),
					tab === "modulos" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AbaModulos, { dark }),
					tab === "arquivos" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `rounded-xl border p-4 space-y-3 ${t.settingsCard}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-sm font-semibold ${t.text}`,
								children: "Adicionar arquivo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `text-xs ${t.textSub}`,
								children: [
									"A ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "descrição" }),
									" é usada pela IA para decidir quando enviar o arquivo."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								onClick: () => fileInputRef.current?.click(),
								className: `border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all hover:border-[#00a884] ${dark ? "border-[#2a3942]" : "border-[#e9edef]"}`,
								children: arquivoSelecionado ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-sm ${t.text}`,
									children: arquivoSelecionado.name
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
									size: 22,
									className: `mx-auto mb-1 ${t.textSub}`
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-xs ${t.textSub}`,
									children: "Clique para selecionar imagem, PDF ou documento"
								})] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileInputRef,
								type: "file",
								className: "hidden",
								accept: "image/*,.pdf,.doc,.docx",
								onChange: handleFileChange
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
									children: "Nome"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: novoArquivo.nome,
									onChange: (e) => setNovoArquivo((p) => ({
										...p,
										nome: e.target.value
									})),
									placeholder: "Ex: Cardápio PDF",
									className: `mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
									children: "Tipo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: novoArquivo.tipo,
									onChange: (e) => setNovoArquivo((p) => ({
										...p,
										tipo: e.target.value
									})),
									className: `mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "imagem",
											children: "🖼️ Imagem"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "pdf",
											children: "📄 PDF"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "documento",
											children: "📎 Documento"
										})
									]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: novoArquivo.descricao,
								onChange: (e) => setNovoArquivo((p) => ({
									...p,
									descricao: e.target.value
								})),
								placeholder: "Quando a IA deve enviar este arquivo? Ex: Cardápio completo em PDF. Enviar quando cliente pedir o cardápio.",
								rows: 2,
								className: `w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] resize-none ${t.settingsInput}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleUpload,
								disabled: uploading || !arquivoSelecionado,
								className: "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00a884] text-white text-sm font-semibold hover:bg-[#008f72] transition-all disabled:opacity-60",
								children: [
									uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 14,
										className: "animate-spin"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 14 }),
									" ",
									"Enviar arquivo"
								]
							})
						]
					}), loadingArquivos ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center py-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "animate-spin text-[#00a884]",
							size: 20
						})
					}) : arquivos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: `text-center text-sm py-8 ${t.textSub}`,
						children: "Nenhum arquivo ainda."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `rounded-xl border overflow-hidden ${t.settingsCard}`,
						children: arquivos.map((arq, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `flex items-center gap-3 px-4 py-3 ${i > 0 ? `border-t ${t.divider}` : ""} ${!arq.ativo ? "opacity-40" : ""}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${dark ? "bg-[#2a3942]" : "bg-[#f0f2f5]"} overflow-hidden`,
									children: arq.tipo === "imagem" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: arq.url,
										className: "h-full w-full object-cover",
										alt: ""
									}) : arq.tipo === "pdf" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
										size: 18,
										className: "text-red-400"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(File, {
										size: 18,
										className: t.textSub
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: `text-xs font-semibold truncate ${t.text}`,
										children: arq.nome
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: `text-[10px] truncate ${t.textSub}`,
										children: arq.descricao
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => toggleAtivoMutation.mutate({
											id: arq.id,
											ativo: !arq.ativo
										}),
										className: `p-1.5 rounded-lg ${arq.ativo ? "text-[#00a884]" : t.textSub}`,
										children: arq.ativo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 14 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => confirm(`Remover "${arq.nome}"?`) && deleteMutation.mutate({
											id: arq.id,
											storagePath: arq.storage_path
										}),
										className: "p-1.5 rounded-lg text-red-400",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
									})]
								})
							]
						}, arq.id))
					})] }),
					tab === "webhook" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `rounded-xl border p-4 space-y-3 ${t.settingsCard}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-sm font-semibold ${t.text}`,
							children: "Webhook Meta"
						}), [
							{
								label: "URL de Callback",
								val: `https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-agent`
							},
							{
								label: "Verify Token",
								val: "saborosamente-webhook-2026"
							},
							{
								label: "Campo assinado",
								val: "messages"
							}
						].map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: `text-[10px] font-bold uppercase ${t.settingsLabel}`,
							children: row.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `mt-1 font-mono text-[11px] rounded-lg border px-3 py-2 break-all select-all ${t.settingsInput}`,
							children: row.val
						})] }, row.label))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `rounded-xl border p-4 space-y-2 ${t.settingsCard}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: `text-sm font-semibold flex items-center gap-1.5 text-red-400`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 14 }), " Segurança"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-[11px] leading-relaxed ${t.textSub}`,
							children: "Nunca compartilhe o WHATSAPP_TOKEN publicamente. Se exposto, revogue imediatamente em Meta for Developers e gere um novo token permanente."
						})]
					})] })
				]
			})
		]
	});
}
function ChatView({ conversa, dark, onBack, onToggleModo }) {
	const t = dark ? DARK : LIGHT;
	const queryClient = useQueryClient();
	const [msgText, setMsgText] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const bottomRef = (0, import_react.useRef)(null);
	const mensagens = conversa.mensagens ?? [];
	const isHumano = conversa.modo === "humano";
	(0, import_react.useEffect)(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [mensagens.length]);
	const handleSend = async () => {
		if (!msgText.trim() || sending) return;
		setSending(true);
		try {
			const novas = [...mensagens, {
				role: "assistant",
				content: msgText,
				manual: true
			}].slice(-30);
			await supabase.from("whatsapp_conversas").update({
				mensagens: novas,
				ultima_msg: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", conversa.id);
			const { ok, errorMsg } = await sendManualMessage(conversa.telefone, msgText);
			if (ok) {
				toast.success("Enviado!");
				setMsgText("");
				queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] });
			} else toast.error(errorMsg ? `Erro: ${errorMsg}` : "Falha ao enviar");
		} catch (e) {
			toast.error(e.message);
		} finally {
			setSending(false);
		}
	};
	const grupos = [];
	for (const msg of mensagens) {
		const d = msg.timestamp ? format(new Date(msg.timestamp), "dd/MM/yyyy") : "Hoje";
		const last = grupos[grupos.length - 1];
		if (last?.date === d) last.msgs.push(msg);
		else grupos.push({
			date: d,
			msgs: [msg]
		});
	}
	const avatarColor = isHumano ? "bg-[#f0a202]" : "bg-[#00a884]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex flex-col h-full ${t.chatBg}`,
		style: {
			backgroundImage: dark ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23ffffff'/%3E%3C/svg%3E\")" : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23000000'/%3E%3C/svg%3E\")",
			backgroundSize: "60px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex items-center gap-3 px-4 py-3 shrink-0 ${t.chatHeader}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onBack,
						className: `p-1 rounded-full md:hidden ${t.textSub}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 20 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`,
						children: getInitials(conversa.nome || conversa.telefone)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `font-semibold text-sm leading-tight truncate ${t.text}`,
							children: conversa.nome || "Desconhecido"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `text-xs ${t.textSub}`,
							children: conversa.telefone
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onToggleModo(conversa.id, conversa.modo),
						className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isHumano ? "bg-[#00a884] text-white hover:bg-[#008f72]" : "bg-[#f0a202] text-white hover:bg-[#d99200]"}`,
						children: isHumano ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 11 }), " IA responder"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { size: 11 }), " Assumir"] })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto px-4 py-3 space-y-1",
				children: [
					mensagens.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center mt-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `px-4 py-2 rounded-lg text-xs ${dark ? "bg-[#182229] text-[#8696a0]" : "bg-[#e2ffc7] text-[#667781]"}`,
							children: "Nenhuma mensagem ainda"
						})
					}),
					mensagens.map((msg, i) => {
						const isOut = msg.role === "assistant";
						const isManual = msg.manual === true;
						const bubbleClass = isOut ? isManual ? t.bubbleManual : t.bubbleOut : t.bubbleIn;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `flex ${isOut ? "justify-end" : "justify-start"} mb-0.5`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `relative max-w-[72%] rounded-2xl px-3 py-2 shadow-sm text-sm leading-relaxed ${bubbleClass} ${isOut ? "rounded-tr-sm" : "rounded-tl-sm"}`,
								children: [
									isOut && isManual && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[9px] font-bold opacity-60 mb-0.5",
										children: "👤 Você"
									}),
									isOut && !isManual && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[9px] font-bold opacity-60 mb-0.5",
										children: "🤖 Saborosa"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "whitespace-pre-wrap break-words",
										children: msg.content
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `flex items-center justify-end gap-1 mt-0.5`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] opacity-50",
											children: msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""
										}), isOut && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCheck, {
											size: 12,
											className: "opacity-50"
										})]
									})
								]
							})
						}, i);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `px-3 py-3 shrink-0 ${t.chatInput}`,
				children: !isHumano ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${dark ? "bg-[#182229] text-[#8696a0]" : "bg-[#f0f2f5] text-[#667781]"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { size: 16 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saborosa está respondendo automaticamente." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onToggleModo(conversa.id, conversa.modo),
							className: "ml-auto text-[#00a884] font-semibold text-xs hover:underline",
							children: "Assumir conversa"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 ${t.chatInputField} border ${t.divider}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smile, {
								size: 18,
								className: t.textSub
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: msgText,
								onChange: (e) => setMsgText(e.target.value),
								onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend()),
								placeholder: "Digite uma mensagem",
								className: "flex-1 bg-transparent outline-none text-sm"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, {
								size: 18,
								className: t.textSub
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleSend,
						disabled: !msgText.trim() || sending,
						className: "h-11 w-11 rounded-full bg-[#00a884] flex items-center justify-center text-white hover:bg-[#008f72] transition-all disabled:opacity-50 shrink-0",
						children: sending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 18,
							className: "animate-spin"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 })
					})]
				})
			})
		]
	});
}
function AdminAgentePage() {
	const queryClient = useQueryClient();
	const [dark, setDark] = (0, import_react.useState)(true);
	const [config, setConfig] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const [showConfig, setShowConfig] = (0, import_react.useState)(false);
	const [filterModo, setFilterModo] = (0, import_react.useState)("todos");
	const t = dark ? DARK : LIGHT;
	useQuery({
		queryKey: ["agente-config"],
		queryFn: async () => {
			const { data } = await supabase.from("agente_config").select("*").maybeSingle();
			if (data) setConfig(data);
			return data;
		}
	});
	const { data: conversas = [], isLoading } = useQuery({
		queryKey: ["whatsapp-conversas"],
		queryFn: async () => {
			const { data, error } = await supabase.from("whatsapp_conversas").select("*").order("ultima_msg", { ascending: false }).limit(100);
			if (error) throw error;
			return data;
		},
		refetchInterval: 8e3
	});
	const toggleModoMutation = useMutation({
		mutationFn: async ({ id, modoAtual }) => {
			const novoModo = modoAtual === "humano" ? "ia" : "humano";
			const { error } = await supabase.from("whatsapp_conversas").update({ modo: novoModo }).eq("id", id);
			if (error) throw error;
			return novoModo;
		},
		onSuccess: (novoModo) => {
			queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] });
			toast.success(novoModo === "humano" ? "Você assumiu a conversa!" : "IA voltou a responder!");
		}
	});
	const saveConfig = async () => {
		if (!config) return;
		setSaving(true);
		const { error } = await supabase.from("agente_config").update({
			nome_agente: config.nome_agente,
			system_prompt: config.system_prompt,
			ativo: config.ativo,
			modo_treino: config.modo_treino ?? false,
			treinador_telefone: config.treinador_telefone ?? null,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", config.id);
		setSaving(false);
		if (error) toast.error(error.message);
		else {
			queryClient.invalidateQueries({ queryKey: ["agente-config"] });
			toast.success("Salvo!");
		}
	};
	const humanasCount = conversas.filter((c) => c.modo === "humano").length;
	const filtered = conversas.filter((c) => {
		const matchModo = filterModo === "todos" || c.modo === filterModo;
		const matchSearch = !search || c.nome?.toLowerCase().includes(search.toLowerCase()) || c.telefone?.includes(search);
		return matchModo && matchSearch;
	});
	const activeConversa = conversas.find((c) => c.id === activeId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex h-[calc(100vh-56px)] overflow-hidden ${t.app}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex flex-col w-full md:w-[380px] shrink-0 border-r ${t.sidebar} ${t.divider} ${activeId && !showConfig ? "hidden md:flex" : "flex"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `flex items-center justify-between px-4 py-3 shrink-0 ${t.sidebarHeader}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { size: 18 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `font-semibold text-sm ${t.text}`,
								children: "Saborosa"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-[10px] ${t.textSub}`,
								children: config?.ativo ? "🟢 Ativa" : "🔴 Pausada"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								humanasCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `text-xs font-bold px-2 py-0.5 rounded-full ${t.badgeHumano}`,
									children: humanasCount
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setDark(!dark),
									className: `p-2 rounded-full hover:bg-black/10 ${t.textSub}`,
									title: "Alternar tema",
									children: dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { size: 18 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setShowConfig(!showConfig);
										setActiveId(null);
									},
									className: `p-2 rounded-full hover:bg-black/10 ${t.textSub}`,
									title: "Configurações",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { size: 18 })
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `px-3 py-2 shrink-0 ${t.sidebarSearch}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `flex items-center gap-2 rounded-full px-4 py-2 ${t.sidebarSearchInput}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								size: 15,
								className: t.textSub
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: search,
								onChange: (e) => setSearch(e.target.value),
								placeholder: "Pesquisar ou começar nova conversa",
								className: "flex-1 bg-transparent text-sm outline-none"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `flex gap-2 px-3 py-2 shrink-0`,
						children: [
							"todos",
							"humano",
							"ia"
						].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilterModo(f),
							className: `px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterModo === f ? "bg-[#00a884] text-white" : `${dark ? "bg-[#2a3942] text-[#8696a0]" : "bg-[#f0f2f5] text-[#667781]"}`}`,
							children: f === "todos" ? "Tudo" : f === "humano" ? "👤 Você" : "🤖 IA"
						}, f))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 overflow-y-auto",
						children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center py-12",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								className: "animate-spin text-[#00a884]",
								size: 22
							})
						}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `py-16 text-center ${t.textSub} text-sm`,
							children: "Nenhuma conversa"
						}) : filtered.map((c) => {
							const isActive = activeId === c.id;
							const isHumano = c.modo === "humano";
							const lastMsg = c.mensagens?.at(-1);
							const avatarColor = isHumano ? "bg-[#f0a202]" : "bg-[#00a884]";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								onClick: () => {
									setActiveId(c.id);
									setShowConfig(false);
								},
								className: `flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b ${t.divider} ${isActive ? t.contactItemActive : t.contactItem}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `h-12 w-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`,
									children: getInitials(c.nome || c.telefone)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between mb-0.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: `font-semibold text-sm truncate ${t.text}`,
											children: c.nome || c.telefone
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[11px] shrink-0 ml-2 ${isHumano ? "text-[#f0a202]" : t.textTime}`,
											children: formatMsgTime(c.ultima_msg)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: `text-xs truncate ${t.textSub}`,
											children: [lastMsg?.role === "assistant" ? "🤖 " : "", lastMsg?.content?.slice(0, 45) ?? ""]
										}), isHumano && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `ml-2 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${t.badgeHumano}`,
											children: "!"
										})]
									})]
								})]
							}, c.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 hidden md:flex flex-col overflow-hidden",
				children: showConfig ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PainelConfig, {
					dark,
					config,
					setConfig,
					saveConfig,
					saving,
					onClose: () => setShowConfig(false)
				}) : activeConversa ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatView, {
					conversa: activeConversa,
					dark,
					onBack: () => setActiveId(null),
					onToggleModo: (id, modo) => toggleModoMutation.mutate({
						id,
						modoAtual: modo
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex flex-col items-center justify-center h-full gap-4 ${t.chatBg}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `h-20 w-20 rounded-full ${dark ? "bg-[#202c33]" : "bg-[#f0f2f5]"} flex items-center justify-center`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
								size: 36,
								className: t.textSub
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-lg font-semibold ${t.text}`,
								children: "Painel Saborosa"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-sm ${t.textSub}`,
								children: "Selecione uma conversa para começar"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `flex gap-6 text-center mt-2`,
							children: [
								{
									label: "Contatos",
									val: conversas.length
								},
								{
									label: "Aguardando",
									val: humanasCount
								},
								{
									label: "Com IA",
									val: conversas.filter((c) => c.modo === "ia").length
								}
							].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-2xl font-black ${dark ? "text-[#00a884]" : "text-[#128c7e]"}`,
								children: s.val
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-xs ${t.textSub}`,
								children: s.label
							})] }, s.label))
						})
					]
				})
			}),
			activeId && !showConfig && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden fixed inset-0 z-50 flex flex-col",
				children: activeConversa && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatView, {
					conversa: activeConversa,
					dark,
					onBack: () => setActiveId(null),
					onToggleModo: (id, modo) => toggleModoMutation.mutate({
						id,
						modoAtual: modo
					})
				})
			})
		]
	});
}
//#endregion
export { AdminAgentePage as component };
