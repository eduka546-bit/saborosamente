import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { Ht as CircleAlert, P as Send, Rt as CircleCheck, St as Eye, c as Users, d as Upload, dt as Image, jt as Clock, r as Zap } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.campanhas-etGkNxSI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
function AdminCampaignPage() {
	const [tabAtivo, setTabAtivo] = (0, import_react.useState)("criar");
	const [nomesCampanha, setNomesCampanha] = (0, import_react.useState)("");
	const [mensagem, setMensagem] = (0, import_react.useState)("");
	const [imagemPreview, setImagemPreview] = (0, import_react.useState)(null);
	const [imagemFile, setImagemFile] = (0, import_react.useState)(null);
	const [videoPreview, setVideoPreview] = (0, import_react.useState)(null);
	const [videoFile, setVideoFile] = (0, import_react.useState)(null);
	const [midiaTipo, setMidiaTipo] = (0, import_react.useState)("nenhuma");
	const [enviando, setEnviando] = (0, import_react.useState)(false);
	const [mostrarListaCompleta, setMostrarListaCompleta] = (0, import_react.useState)(false);
	const [contatosEditaveis, setContatosEditaveis] = (0, import_react.useState)([]);
	const [campanhaDetalhes, setCampanhaDetalhes] = (0, import_react.useState)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const videoInputRef = (0, import_react.useRef)(null);
	const csvInputRef = (0, import_react.useRef)(null);
	const queryClient = useQueryClient();
	const { data: campanhas = [], isLoading: carregandoCampanhas } = useQuery({
		queryKey: ["campanhas-historico"],
		queryFn: async () => {
			const { data } = await supabase.from("campanhas_whatsapp").select("*").order("created_at", { ascending: false });
			return data || [];
		},
		staleTime: 3e4
	});
	const { data: listas = [], isLoading: carregandoListas, refetch: refetchListas } = useQuery({
		queryKey: ["listas-contatos"],
		queryFn: async () => {
			const { data } = await supabase.from("listas_contatos").select("*").order("created_at", { ascending: false });
			console.log("Listas carregadas:", data);
			return data || [];
		},
		staleTime: 5e3,
		refetchOnWindowFocus: true,
		refetchOnMount: true
	});
	const [novaListaNome, setNovaListaNome] = (0, import_react.useState)("");
	const [novaListaDescricao, setNovaListaDescricao] = (0, import_react.useState)("");
	const [listaEditando, setListaEditando] = (0, import_react.useState)(null);
	const [contatosLista, setContatosLista] = (0, import_react.useState)([]);
	const listaInputRef = (0, import_react.useRef)(null);
	const [listaCarregada, setListaCarregada] = (0, import_react.useState)(null);
	const [templateSelecionado, setTemplateSelecionado] = (0, import_react.useState)(null);
	const [templateVariaveis, setTemplateVariaveis] = (0, import_react.useState)([]);
	const [usarTemplate, setUsarTemplate] = (0, import_react.useState)(false);
	const { data: templates = [], isLoading: carregandoTemplates, refetch: refetchTemplates } = useQuery({
		queryKey: ["whatsapp-templates"],
		queryFn: async () => {
			const { data, error } = await supabase.functions.invoke("whatsapp-templates");
			if (error) throw error;
			return data?.templates || [];
		},
		staleTime: 5 * 6e4,
		enabled: false
	});
	const { data: enviosCampanha = [], refetch: refetchEnvios } = useQuery({
		queryKey: ["envios-campanha", campanhaDetalhes],
		queryFn: async () => {
			if (!campanhaDetalhes) return [];
			const { data } = await supabase.from("campanhas_whatsapp_envios").select("*").eq("campanha_id", campanhaDetalhes).order("created_at");
			return data || [];
		},
		enabled: !!campanhaDetalhes,
		refetchInterval: campanhaDetalhes ? 3e3 : false
	});
	const handleImageUpload = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Por favor, selecione uma imagem válida");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Imagem muito grande (máximo 5MB)");
			return;
		}
		setImagemFile(file);
		setMidiaTipo("imagem");
		setVideoFile(null);
		setVideoPreview(null);
		const reader = new FileReader();
		reader.onload = (event) => {
			setImagemPreview(event.target?.result);
		};
		reader.readAsDataURL(file);
	};
	const handleVideoUpload = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("video/")) {
			toast.error("Por favor, selecione um vídeo válido");
			return;
		}
		if (file.size > 16 * 1024 * 1024) {
			toast.error("Vídeo muito grande (máximo 16MB)");
			return;
		}
		setVideoFile(file);
		setMidiaTipo("video");
		setImagemFile(null);
		setImagemPreview(null);
		const reader = new FileReader();
		reader.onload = (event) => {
			setVideoPreview(event.target?.result);
		};
		reader.readAsDataURL(file);
	};
	const handleImportarCSV = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.name.endsWith(".csv")) {
			toast.error("Por favor, selecione um arquivo CSV");
			return;
		}
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const linhas = (event.target?.result).split("\n").filter((l) => l.trim());
				let contatos = linhas;
				if (linhas.length > 0 && (linhas[0].toLowerCase().includes("telefone") || linhas[0].toLowerCase().includes("phone"))) contatos = linhas.slice(1);
				const telefonesParsed = contatos.map((l) => {
					const match = l.match(/\d+/g);
					return match ? match.join("") : "";
				}).filter((t) => t.length >= 10 && t.length <= 15);
				if (telefonesParsed.length === 0) {
					toast.error("Nenhum telefone válido encontrado no CSV");
					return;
				}
				const contatosAtualizado = Array.from(/* @__PURE__ */ new Set([...contatosEditaveis, ...telefonesParsed]));
				setContatosEditaveis(contatosAtualizado);
				toast.success(`✓ Importados ${telefonesParsed.length} contatos`);
			} catch (err) {
				toast.error("Erro ao processar CSV");
			}
		};
		reader.readAsText(file);
	};
	const criarNovaLista = async () => {
		if (!novaListaNome.trim()) {
			toast.error("Digite o nome da lista");
			return;
		}
		try {
			const { data, error } = await supabase.from("listas_contatos").insert([{
				nome: novaListaNome,
				descricao: novaListaDescricao,
				quantidade_contatos: 0
			}]).select().single();
			if (error) throw error;
			setNovaListaNome("");
			setNovaListaDescricao("");
			toast.success("Lista criada com sucesso!");
			refetchListas();
		} catch (err) {
			toast.error("Erro ao criar lista");
		}
	};
	const carregarContatosLista = async (listaId) => {
		try {
			const { data } = await supabase.from("contatos_lista").select("*").eq("lista_id", listaId).order("created_at");
			setContatosLista(data || []);
			setListaEditando(listaId);
		} catch (err) {
			toast.error("Erro ao carregar contatos");
		}
	};
	const adicionarContatoALista = async (listaId, telefone, nome) => {
		if (!telefone.trim()) {
			toast.error("Digite um telefone");
			return;
		}
		try {
			const { error } = await supabase.from("contatos_lista").insert([{
				lista_id: listaId,
				telefone: telefone.replace(/\D/g, ""),
				nome: nome || null
			}]);
			if (error) throw error;
			await carregarContatosLista(listaId);
			const { count } = await supabase.from("contatos_lista").select("*", {
				count: "exact",
				head: true
			}).eq("lista_id", listaId);
			if (count !== null) {
				await supabase.from("listas_contatos").update({ quantidade_contatos: count }).eq("id", listaId);
				refetchListas();
			}
			toast.success("Contato adicionado!");
		} catch (err) {
			toast.error("Erro ao adicionar contato");
		}
	};
	const removerContatoDaLista = async (contatoId, listaId) => {
		try {
			const { error } = await supabase.from("contatos_lista").delete().eq("id", contatoId);
			if (error) throw error;
			await carregarContatosLista(listaId);
			const { count } = await supabase.from("contatos_lista").select("*", {
				count: "exact",
				head: true
			}).eq("lista_id", listaId);
			if (count !== null) {
				await supabase.from("listas_contatos").update({ quantidade_contatos: count }).eq("id", listaId);
				refetchListas();
			}
			toast.success("Contato removido!");
		} catch (err) {
			toast.error("Erro ao remover contato");
		}
	};
	const editarContatoDaLista = async (contatoId, novoTelefone, novoNome) => {
		try {
			const { error } = await supabase.from("contatos_lista").update({
				telefone: novoTelefone.replace(/\D/g, ""),
				nome: novoNome || null
			}).eq("id", contatoId);
			if (error) throw error;
			await carregarContatosLista(listaEditando);
			toast.success("Contato atualizado!");
		} catch (err) {
			toast.error("Erro ao atualizar contato");
		}
	};
	const deletarLista = async (listaId) => {
		if (!window.confirm("Tem certeza que deseja deletar esta lista?")) return;
		try {
			const { error } = await supabase.from("listas_contatos").delete().eq("id", listaId);
			if (error) throw error;
			setListaEditando(null);
			setContatosLista([]);
			toast.success("Lista deletada!");
			refetchListas();
		} catch (err) {
			toast.error("Erro ao deletar lista");
		}
	};
	const sendMutation = useMutation({
		mutationFn: async ({ contatosSelecionados, mensagem: msg, imagem, video, tipo_midia }) => {
			if (contatosSelecionados.length === 0) throw new Error("Selecione pelo menos um contato");
			if (!msg.trim()) throw new Error("Digite uma mensagem");
			if (!usarTemplate || !templateSelecionado) throw new Error("Selecione um template aprovado da Meta para enviar a contatos que ainda não falaram com você");
			if (templateVariaveis.some((variavel) => !variavel.trim())) throw new Error("Preencha todas as variáveis do template antes de enviar");
			let imagemUrl = null;
			let videoUrl = null;
			if (imagem) {
				const nomearquivo = `campanha-img-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
				const { error: uploadError, data } = await supabase.storage.from("campanhas").upload(nomearquivo, imagem);
				if (uploadError) throw uploadError;
				const { data: { publicUrl } } = supabase.storage.from("campanhas").getPublicUrl(nomearquivo);
				imagemUrl = publicUrl;
			}
			if (video) {
				const nomearquivo = `campanha-vid-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
				const { error: uploadError, data } = await supabase.storage.from("campanhas").upload(nomearquivo, video);
				if (uploadError) throw uploadError;
				const { data: { publicUrl } } = supabase.storage.from("campanhas").getPublicUrl(nomearquivo);
				videoUrl = publicUrl;
			}
			const { data: campanha, error: saveError } = await supabase.from("campanhas_whatsapp").insert([{
				nome: nomesCampanha || `Campanha ${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")}`,
				mensagem: msg,
				imagem_url: imagemUrl,
				video_url: videoUrl,
				midia_tipo: tipo_midia,
				status: "enviando",
				contatos_total: contatosSelecionados.length,
				contatos_enviados: 0,
				contatos_falhados: 0
			}]).select().single();
			if (saveError) throw saveError;
			const { error: fnError } = await supabase.functions.invoke("whatsapp-campanha-enviar", { body: {
				campanha_id: campanha.id,
				contatos: contatosSelecionados,
				mensagem: msg,
				imagem_url: imagemUrl,
				video_url: videoUrl,
				midia_tipo: tipo_midia,
				template: usarTemplate && templateSelecionado ? {
					name: templateSelecionado.name,
					language: templateSelecionado.language,
					variaveis: templateVariaveis
				} : null
			} });
			if (fnError) throw fnError;
			return campanha;
		},
		onSuccess: (campanha) => {
			toast.success(`✓ Campanha iniciada! Enviando para ${campanha.contatos_total} contatos...`);
			setMensagem("");
			setNomesCampanha("");
			setImagemFile(null);
			setImagemPreview(null);
			setVideoFile(null);
			setVideoPreview(null);
			setMidiaTipo("nenhuma");
			setTemplateSelecionado(null);
			setTemplateVariaveis([]);
			setUsarTemplate(false);
			queryClient.invalidateQueries({ queryKey: ["campanhas-historico"] });
			setTabAtivo("historico");
		},
		onError: (error) => {
			toast.error("Erro ao enviar campanha: " + (error.message || "Tente novamente"));
		}
	});
	const handleEnviar = async (telefones) => {
		setEnviando(true);
		try {
			await sendMutation.mutateAsync({
				contatosSelecionados: telefones,
				mensagem,
				imagem: imagemFile,
				video: videoFile,
				tipo_midia: midiaTipo
			});
		} finally {
			setEnviando(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold text-[#5850ec]",
					children: "Campanhas WhatsApp"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Envie mensagens em massa com arte para seus clientes"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-4 mb-8 border-b border-gray-200",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setTabAtivo("criar"),
						className: `px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${tabAtivo === "criar" ? "border-[#5850ec] text-[#5850ec]" : "border-transparent text-gray-500 hover:text-gray-700"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
							className: "inline mr-2",
							size: 18
						}), "Criar Campanha"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setTabAtivo("contatos"),
						className: `px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${tabAtivo === "contatos" ? "border-[#5850ec] text-[#5850ec]" : "border-transparent text-gray-500 hover:text-gray-700"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
							className: "inline mr-2",
							size: 18
						}), "Contatos"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setTabAtivo("historico"),
						className: `px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${tabAtivo === "historico" ? "border-[#5850ec] text-[#5850ec]" : "border-transparent text-gray-500 hover:text-gray-700"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
							className: "inline mr-2",
							size: 18
						}), "Histórico"]
					})
				]
			}),
			tabAtivo === "criar" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[1fr_380px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-sm font-bold text-gray-700 mb-2",
								children: "Nome da Campanha (opcional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Ex: Oferta da Semana, Black Friday, etc",
								value: nomesCampanha,
								onChange: (e) => setNomesCampanha(e.target.value),
								className: "rounded-lg border-gray-200"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-bold text-gray-700 mb-4",
									children: "Upload de Mídia"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2 mb-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setMidiaTipo("imagem");
												setVideoFile(null);
												setVideoPreview(null);
											},
											className: `px-4 py-2 rounded-lg text-sm font-bold transition-all border ${midiaTipo === "imagem" ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-600 hover:border-[#5850ec]"}`,
											children: "📷 Imagem"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setMidiaTipo("video");
												setImagemFile(null);
												setImagemPreview(null);
											},
											className: `px-4 py-2 rounded-lg text-sm font-bold transition-all border ${midiaTipo === "video" ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-600 hover:border-[#5850ec]"}`,
											children: "🎥 Vídeo"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setMidiaTipo("nenhuma");
												setImagemFile(null);
												setImagemPreview(null);
												setVideoFile(null);
												setVideoPreview(null);
											},
											className: `px-4 py-2 rounded-lg text-sm font-bold transition-all border ${midiaTipo === "nenhuma" ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-600 hover:border-[#5850ec]"}`,
											children: "📝 Só Texto"
										})
									]
								}),
								midiaTipo === "imagem" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									onClick: () => fileInputRef.current?.click(),
									className: "border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#5850ec] hover:bg-[#5850ec]/5 transition-all",
									children: imagemPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
												className: "mx-auto text-green-500",
												size: 40
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-bold text-gray-700",
												children: "Imagem selecionada!"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-gray-500",
												children: imagemFile?.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: (e) => {
													e.stopPropagation();
													setImagemPreview(null);
													setImagemFile(null);
												},
												className: "text-xs text-red-600 hover:underline",
												children: "Remover"
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
											className: "mx-auto text-gray-400",
											size: 40
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-bold text-gray-700",
											children: "Clique para upload ou arraste"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-gray-500 mt-1",
											children: "PNG, JPG até 5MB"
										})] })]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: fileInputRef,
									type: "file",
									accept: "image/*",
									onChange: handleImageUpload,
									className: "hidden"
								})] }),
								midiaTipo === "video" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									onClick: () => videoInputRef.current?.click(),
									className: "border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#5850ec] hover:bg-[#5850ec]/5 transition-all",
									children: videoPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
												className: "mx-auto text-green-500",
												size: 40
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-bold text-gray-700",
												children: "Vídeo selecionado!"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-gray-500",
												children: videoFile?.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: (e) => {
													e.stopPropagation();
													setVideoPreview(null);
													setVideoFile(null);
												},
												className: "text-xs text-red-600 hover:underline",
												children: "Remover"
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
											className: "mx-auto text-gray-400",
											size: 40
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-bold text-gray-700",
											children: "Clique para upload ou arraste"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-gray-500 mt-1",
											children: "MP4 até 16MB"
										})] })]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: videoInputRef,
									type: "file",
									accept: "video/mp4,video/*",
									onChange: handleVideoUpload,
									className: "hidden"
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-bold text-gray-700 mb-2",
									children: "Mensagem"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									placeholder: "Digite a mensagem que será enviada...",
									value: mensagem,
									onChange: (e) => setMensagem(e.target.value),
									className: "rounded-lg border-gray-200 min-h-[150px] resize-none"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 text-xs text-gray-500",
									children: [mensagem.length, " caracteres"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-bold text-gray-700",
										children: "Template WhatsApp"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-gray-500 mt-0.5",
										children: "Use templates para alcançar clientes que nunca conversaram com você"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											setUsarTemplate(!usarTemplate);
											if (!usarTemplate && templates.length === 0) refetchTemplates();
										},
										className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${usarTemplate ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-600 hover:border-[#5850ec]"}`,
										children: usarTemplate ? "✓ Ativado" : "Usar Template"
									})]
								}),
								usarTemplate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => refetchTemplates(),
												disabled: carregandoTemplates,
												className: "px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50",
												children: carregandoTemplates ? "Buscando..." : "🔄 Buscar Templates"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-gray-500 self-center",
												children: templates.filter((t) => t.status === "APPROVED").length > 0 ? `${templates.filter((t) => t.status === "APPROVED").length} templates aprovados` : "Nenhum template aprovado encontrado"
											})]
										}),
										templates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: templateSelecionado?.name || "",
											onChange: (e) => {
												const t = templates.find((t) => t.name === e.target.value);
												setTemplateSelecionado(t || null);
												setTemplateVariaveis(t ? Array(t.numVars).fill("") : []);
												if (t) setMensagem(t.body);
											},
											className: "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Selecione um template..."
											}), templates.filter((t) => t.status === "APPROVED").map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
												value: t.name,
												children: [
													t.name,
													" (",
													t.language,
													") — ",
													t.status
												]
											}, t.name))]
										}),
										templateSelecionado && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-gray-50 rounded-lg p-4 space-y-3",
											children: [
												templateSelecionado.header && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs font-bold text-gray-500 uppercase",
													children: ["Header: ", templateSelecionado.header]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "bg-white rounded-lg p-3 border text-sm text-gray-800 whitespace-pre-wrap",
													children: templateSelecionado.body
												}),
												templateSelecionado.footer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-gray-400",
													children: templateSelecionado.footer
												}),
												templateSelecionado.numVars > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2 pt-2 border-t",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs font-bold text-gray-600",
														children: [
															"Preencha as variáveis (",
															templateSelecionado.numVars,
															" no total):"
														]
													}), Array.from({ length: templateSelecionado.numVars }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs font-bold text-[#5850ec] w-8",
															children: `{{${i + 1}}}`
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															placeholder: templateSelecionado.varExamples?.[i] || `Valor ${i + 1}`,
															value: templateVariaveis[i] || "",
															onChange: (e) => {
																const novo = [...templateVariaveis];
																novo[i] = e.target.value;
																setTemplateVariaveis(novo);
															},
															className: "text-sm"
														})]
													}, i))]
												})
											]
										}),
										!templateSelecionado && templates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-amber-600 bg-amber-50 rounded p-2",
											children: "⚠️ Selecione um template para enviar para clientes sem histórico de conversa"
										})
									]
								}),
								!usarTemplate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-gray-400",
									children: "Sem template: só envia para clientes que conversaram nas últimas 24h"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl border p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-center mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-bold text-gray-700",
									children: "Ou carregar uma Lista Salva"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => refetchListas(),
									className: "text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded",
									title: "Atualizar listas",
									children: "🔄 Atualizar"
								})]
							}), carregandoListas ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-gray-500 text-sm py-3",
								children: "Carregando listas..."
							}) : listas.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-gray-400 text-sm py-3",
								children: "Nenhuma lista criada"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: listaCarregada || "",
								onChange: async (e) => {
									if (!e.target.value) {
										setListaCarregada(null);
										setContatosEditaveis([]);
										return;
									}
									setListaCarregada(e.target.value);
									const { data } = await supabase.from("contatos_lista").select("telefone").eq("lista_id", e.target.value);
									if (data && data.length > 0) {
										const telefones = data.map((c) => c.telefone).filter(Boolean);
										setContatosEditaveis(telefones);
										toast.success(`✓ ${telefones.length} contatos carregados!`);
									} else {
										setContatosEditaveis([]);
										toast.error("Nenhum contato encontrado nessa lista");
									}
								},
								className: "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Selecione uma lista..."
								}), listas.map((lista) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: lista.id,
									children: [
										lista.nome,
										" (",
										lista.quantidade_contatos,
										" contatos)"
									]
								}, lista.id))]
							}), listaCarregada && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setListaCarregada(null);
									setContatosEditaveis([]);
								},
								className: "mt-2 text-xs text-gray-500 hover:text-red-600",
								children: "✕ Limpar seleção"
							})] })]
						}),
						listaCarregada && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-blue-50 border border-blue-200 rounded-lg p-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-start",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-bold text-blue-700 mb-1",
										children: "✓ LISTA CARREGADA"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-bold text-blue-900",
										children: listas.find((l) => l.id === listaCarregada)?.nome
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-blue-700 mt-2",
										children: [
											listas.find((l) => l.id === listaCarregada)?.quantidade_contatos || contatosEditaveis.length,
											" ",
											"contatos prontos para enviar"
										]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setListaCarregada(null);
										setContatosEditaveis([]);
									},
									className: "px-3 py-1 text-xs font-bold text-blue-700 border border-blue-300 rounded hover:bg-blue-100",
									children: "Trocar Lista"
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-gray-200 pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setMostrarListaCompleta(!mostrarListaCompleta),
								className: "w-full px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 font-bold text-sm text-gray-700 transition-all flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"📋 Ver/Editar Lista Completa (",
									contatosEditaveis.length,
									")"
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `transform transition-transform ${mostrarListaCompleta ? "rotate-180" : ""}`,
									children: "▼"
								})]
							}), mostrarListaCompleta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50",
								children: contatosEditaveis.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-gray-500 text-center py-4",
									children: "Nenhum contato selecionado"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									contatosEditaveis.map((tel, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 bg-white p-2 rounded border border-gray-200 hover:border-gray-300",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs font-bold text-gray-500 w-6",
												children: [idx + 1, "."]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "text",
												value: tel,
												onChange: (e) => {
													const novo = [...contatosEditaveis];
													novo[idx] = e.target.value;
													setContatosEditaveis(novo);
												},
												className: "flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#5850ec]",
												placeholder: "Telefone com DDD"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													setContatosEditaveis(contatosEditaveis.filter((_, i) => i !== idx));
												},
												className: "px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors",
												children: "✕"
											})
										]
									}, idx)),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setContatosEditaveis([...contatosEditaveis, ""]),
										className: "w-full mt-3 px-3 py-2 text-xs font-bold text-[#5850ec] border border-dashed border-[#5850ec] rounded-lg hover:bg-[#5850ec]/5 transition-colors",
										children: "+ Adicionar Contato"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 pt-3 border-t border-gray-200 space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-bold text-gray-600 mb-2",
												children: "Importar/Exportar:"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => csvInputRef.current?.click(),
												className: "w-full px-3 py-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors",
												children: "📥 Importar CSV"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: csvInputRef,
												type: "file",
												accept: ".csv",
												onChange: handleImportarCSV,
												className: "hidden"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
												value: contatosEditaveis.join("\n"),
												onChange: (e) => setContatosEditaveis(e.target.value.split("\n").map((t) => t.trim()).filter(Boolean)),
												placeholder: "Cole um telefone por linha...",
												className: "w-full px-2 py-2 text-xs border border-gray-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-[#5850ec]",
												rows: 4
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													navigator.clipboard.writeText(contatosEditaveis.join("\n"));
													toast.success("Copiado para clipboard!");
												},
												className: "mt-2 w-full px-3 py-1.5 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded transition-colors",
												children: "📋 Copiar Lista"
											})
										]
									})
								] })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3 pt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => handleEnviar(contatosEditaveis.filter((t) => t.trim())),
								disabled: enviando || contatosEditaveis.filter((t) => t.trim()).length === 0 || !mensagem.trim(),
								className: "w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2",
								children: enviando ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" }), "Enviando..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { size: 18 }),
									"Enviar para ",
									contatosEditaveis.filter((t) => t.trim()).length,
									" cliente(s)"
								] })
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-6 sticky top-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-gray-800 mb-4",
								children: "Pré-visualização"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-3 border-8 border-gray-900 aspect-video flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-gray-900 rounded-t-2xl px-4 py-2 flex justify-between items-center text-white text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saborosamente" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "9:41" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 bg-gradient-to-b from-gray-100 to-white rounded-b-2xl p-3 overflow-hidden flex flex-col",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "bg-[#5850ec] text-white rounded-xl rounded-tr-none p-2 text-xs mb-2 break-words max-w-[80%]",
											children: mensagem || "Sua mensagem aparecerá aqui..."
										}),
										imagemPreview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-xl overflow-hidden mb-2 max-w-[80%]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: imagemPreview,
												alt: "Preview",
												className: "w-full h-auto max-h-24 object-cover"
											})
										}),
										videoPreview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-xl overflow-hidden mb-2 max-w-[80%]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
												src: videoPreview,
												className: "w-full h-auto max-h-24 object-cover bg-black",
												controls: true
											})
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 14 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [contatosEditaveis.filter((t) => t.trim()).length, " clientes"] })]
								})
							})
						]
					})
				})]
			}),
			tabAtivo === "contatos" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[300px_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-6 h-fit sticky top-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-bold text-gray-800 mb-4",
							children: "Minhas Listas"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 pb-4 border-b",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Nome da lista...",
									value: novaListaNome,
									onChange: (e) => setNovaListaNome(e.target.value),
									className: "mb-2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Descrição...",
									value: novaListaDescricao,
									onChange: (e) => setNovaListaDescricao(e.target.value),
									className: "mb-2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: criarNovaLista,
									className: "w-full bg-[#5850ec] hover:bg-[#5850ec]/90",
									children: "+ Nova Lista"
								})
							]
						}),
						carregandoListas ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center text-gray-500 text-sm",
							children: "Carregando..."
						}) : listas.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-center text-gray-400 text-sm py-8",
							children: "Nenhuma lista criada"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: listas.map((lista) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => carregarContatosLista(lista.id),
								className: `w-full text-left p-3 rounded-lg transition-all border ${listaEditando === lista.id ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 hover:border-[#5850ec] hover:bg-gray-50"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-sm",
									children: lista.nome
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs opacity-70",
									children: [lista.quantidade_contatos, " contatos"]
								})]
							}, lista.id))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: listaEditando ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-gray-800",
								children: listas.find((l) => l.id === listaEditando)?.nome
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									deletarLista(listaEditando);
								},
								className: "px-3 py-1 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50",
								children: "Deletar Lista"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 pb-6 border-b space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-bold text-gray-600",
									children: "Adicionar Contato:"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Telefone (11987654321)",
											className: "flex-1",
											id: "novoTelefone"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "Nome (opcional)",
											className: "flex-1",
											id: "novoNome"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											onClick: () => {
												const tel = document.getElementById("novoTelefone")?.value;
												const nome = document.getElementById("novoNome")?.value;
												if (tel) {
													adicionarContatoALista(listaEditando, tel, nome);
													document.getElementById("novoTelefone").value = "";
													document.getElementById("novoNome").value = "";
												}
											},
											className: "bg-blue-500 hover:bg-blue-600",
											children: "Adicionar"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => listaInputRef.current?.click(),
									variant: "outline",
									className: "w-full",
									children: "📥 Importar CSV"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: listaInputRef,
									type: "file",
									accept: ".csv",
									className: "hidden",
									onChange: (e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										const reader = new FileReader();
										reader.onload = (event) => {
											try {
												const linhas = (event.target?.result).split("\n").filter((l) => l.trim());
												let contatos = linhas;
												if (linhas.length > 0 && (linhas[0].toLowerCase().includes("telefone") || linhas[0].toLowerCase().includes("phone"))) contatos = linhas.slice(1);
												const telefonesParsed = contatos.map((l) => {
													const match = l.match(/\d+/g);
													return match ? match.join("") : "";
												}).filter((t) => t.length >= 10 && t.length <= 15);
												if (telefonesParsed.length === 0) {
													toast.error("Nenhum telefone encontrado");
													return;
												}
												let importados = 0;
												telefonesParsed.forEach(async (tel) => {
													await adicionarContatoALista(listaEditando, tel).then(() => {
														importados++;
													});
												});
												toast.success(`${importados} contatos adicionados!`);
											} catch (err) {
												toast.error("Erro ao processar CSV");
											}
										};
										reader.readAsText(file);
									}
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
								className: "font-bold text-gray-700 mb-3",
								children: [
									"Contatos (",
									contatosLista.length,
									")"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "max-h-96 overflow-y-auto space-y-2",
								children: contatosLista.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-center text-gray-400 text-sm py-8",
									children: "Nenhum contato nesta lista"
								}) : contatosLista.map((contato, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold text-gray-500 w-6",
											children: idx + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											defaultValue: contato.telefone,
											onChange: (e) => {
												const updated = contatosLista.map((c) => c.id === contato.id ? {
													...c,
													telefone: e.target.value
												} : c);
												setContatosLista(updated);
											},
											placeholder: "Telefone",
											className: "flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#5850ec]"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											defaultValue: contato.nome || "",
											onChange: (e) => {
												const updated = contatosLista.map((c) => c.id === contato.id ? {
													...c,
													nome: e.target.value
												} : c);
												setContatosLista(updated);
											},
											placeholder: "Nome",
											className: "flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#5850ec]"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												const tel = document.querySelectorAll("input[placeholder=\"Telefone\"]")[idx]?.value;
												const nome = document.querySelectorAll("input[placeholder=\"Nome\"]")[idx]?.value;
												if (tel) editarContatoDaLista(contato.id, tel, nome);
											},
											className: "px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded",
											children: "✓"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => removerContatoDaLista(contato.id, listaEditando),
											className: "px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded",
											children: "✕"
										})
									]
								}, contato.id))
							}),
							contatosLista.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => {
									const telefones = contatosLista.map((c) => c.telefone);
									setContatosEditaveis(telefones);
									setTabAtivo("criar");
									toast.success(`${telefones.length} contatos carregados!`);
								},
								className: "w-full mt-4 bg-green-600 hover:bg-green-700",
								children: "Usar Esta Lista em Campanha"
							})
						] })
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-12 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
						className: "mx-auto text-gray-300 mb-4",
						size: 48
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-500",
						children: "Selecione uma lista para gerenciar contatos"
					})]
				}) })]
			}),
			tabAtivo === "historico" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: carregandoCampanhas ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-12 text-gray-500",
					children: "Carregando histórico..."
				}) : campanhas.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-12 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
						className: "mx-auto text-gray-300 mb-4",
						size: 40
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-gray-500",
						children: "Nenhuma campanha enviada ainda"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [campanhaDetalhes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-6 mb-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-center mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-gray-800",
								children: "Envios em Tempo Real"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-gray-500",
									children: [
										enviosCampanha.filter((e) => e.status === "enviado").length,
										"/",
										enviosCampanha.length,
										" enviados"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setCampanhaDetalhes(null),
									className: "text-xs px-2 py-1 text-gray-500 hover:text-red-600 border rounded",
									children: "✕ Fechar"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full bg-gray-200 rounded-full h-2 mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-green-500 h-2 rounded-full transition-all duration-500",
								style: { width: enviosCampanha.length > 0 ? `${enviosCampanha.filter((e) => e.status === "enviado").length / enviosCampanha.length * 100}%` : "0%" }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-64 overflow-y-auto space-y-1",
							children: enviosCampanha.map((envio, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `flex items-center justify-between px-3 py-2 rounded text-sm ${envio.status === "enviado" ? "bg-green-50" : envio.status === "falhou" ? "bg-red-50" : envio.status === "pendente" ? "bg-yellow-50" : "bg-gray-50"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-mono text-gray-600",
										children: envio.telefone
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										envio.status === "enviado" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold text-green-700",
											children: "✓ Enviado"
										}),
										envio.status === "falhou" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-bold text-red-600",
											title: envio.erro_mensagem,
											children: ["✗ ", envio.erro_mensagem?.slice(0, 30) || "Falhou"]
										}),
										envio.status === "pendente" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold text-yellow-600",
											children: "⏳ Pendente"
										}),
										envio.enviado_em && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-gray-400",
											children: new Date(envio.enviado_em).toLocaleTimeString("pt-BR", {
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit"
											})
										})
									]
								})]
							}, envio.id || idx))
						})
					]
				}), campanhas.map((campanha) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-md transition-all",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-gray-900",
								children: campanha.nome
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-gray-500 line-clamp-2",
								children: campanha.mensagem
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-4 mt-2 text-xs text-gray-500",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"📅",
										" ",
										new Date(campanha.created_at).toLocaleString("pt-BR", {
											dateStyle: "short",
											timeStyle: "short"
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"📨 ",
										campanha.contatos_total,
										" contatos"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"✓ ",
										campanha.contatos_enviados,
										" enviados"
									] }),
									campanha.contatos_falhados > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-red-600",
										children: [
											"✗ ",
											campanha.contatos_falhados,
											" falhados"
										]
									})
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 ml-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setCampanhaDetalhes(campanhaDetalhes === campanha.id ? null : campanha.id),
							className: `px-3 py-1 rounded text-xs font-bold border transition-all ${campanhaDetalhes === campanha.id ? "bg-[#5850ec] text-white border-[#5850ec]" : "border-gray-200 text-gray-600 hover:border-[#5850ec]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
								size: 12,
								className: "inline mr-1"
							}), campanhaDetalhes === campanha.id ? "Fechar" : "Ver"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${campanha.status === "enviada" ? "bg-green-100 text-green-700" : campanha.status === "enviando" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`,
							children: [
								campanha.status === "enviada" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 14 }),
								campanha.status === "enviando" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
									size: 14,
									className: "animate-spin"
								}),
								campanha.status === "erro" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 14 }),
								campanha.status.charAt(0).toUpperCase() + campanha.status.slice(1)
							]
						})]
					})]
				}, campanha.id))] })
			})
		]
	});
}
//#endregion
export { AdminCampaignPage as component };
