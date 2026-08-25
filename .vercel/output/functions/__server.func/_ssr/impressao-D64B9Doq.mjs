import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { Ft as CircleX, I as Save, Rt as CircleCheck, V as Printer, ct as LoaderCircle, wt as ExternalLink, z as RefreshCw } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { n as qzDisponivel, t as imprimirTCP } from "./qz-print-8Cg_f1Lu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/impressao-D64B9Doq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT = {
	impressao_automatica: false,
	impressora_ip: "",
	impressora_porta: "9100",
	imprimir_ao_confirmar: true,
	imprimir_ao_entregar: false,
	copias: "1",
	tamanho_papel: "80mm"
};
function AdminConfigImpressaoPage() {
	const queryClient = useQueryClient();
	const [config, setConfig] = (0, import_react.useState)(DEFAULT);
	const [qzStatus, setQzStatus] = (0, import_react.useState)("checking");
	const [testing, setTesting] = (0, import_react.useState)(false);
	const { isLoading } = useQuery({
		queryKey: ["config-impressao"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("config_impressao").maybeSingle();
			if (data?.config_impressao) setConfig({
				...DEFAULT,
				...data.config_impressao
			});
			return data;
		}
	});
	(0, import_react.useEffect)(() => {
		setQzStatus("checking");
		qzDisponivel().then((ok) => setQzStatus(ok ? "connected" : "disconnected"));
	}, []);
	const checkQz = async () => {
		setQzStatus("checking");
		const ok = await qzDisponivel();
		setQzStatus(ok ? "connected" : "disconnected");
		if (ok) toast.success("QZ Tray conectado!");
		else toast.error("QZ Tray não encontrado. Verifique se está rodando.");
	};
	const saveMutation = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("site_settings").update({ config_impressao: config }).neq("id", "");
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["config-impressao"] });
			toast.success("Configurações salvas!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const handleTestar = async () => {
		if (!config.impressora_ip) {
			toast.error("Informe o IP da impressora");
			return;
		}
		setTesting(true);
		try {
			if (await imprimirTCP({
				id: "00000000-0000-0000-0000-000000000001",
				nome_cliente: "TESTE DE IMPRESSÃO",
				telefone_cliente: "(47) 99999-9999",
				created_at: (/* @__PURE__ */ new Date()).toISOString(),
				status: "preparando",
				metodo_entrega: "entrega",
				metodo_pagamento: "PIX",
				endereco_rua: "Rua Exemplo",
				endereco_numero: "123",
				endereco_bairro: "Centro",
				endereco_cidade: "São Bento do Sul",
				valor_total: 45.9,
				taxa_entrega: 8,
				desconto_aplicado: 0,
				itens: [{
					nome: "Frango Grelhado com Legumes",
					quantidade: 2,
					preco_unitario: 18.95,
					observacao: "Sem cebola"
				}, {
					nome: "Sopa de Caldo Verde",
					quantidade: 1,
					preco_unitario: 8,
					observacao: null
				}]
			}, config.impressora_ip, Number(config.impressora_porta ?? 9100), Number(config.copias ?? 1), config.tamanho_papel ?? "80mm")) toast.success("Comanda de teste enviada para a impressora!");
			else toast.error("QZ Tray não disponível. Verifique se está rodando e tente novamente.");
		} catch (e) {
			toast.error("Erro ao testar: " + e.message);
		} finally {
			setTesting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Impressão Automática"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Configure a impressão automática de tickets de pedido."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-xl border p-4 flex items-center justify-between ${qzStatus === "connected" ? "bg-green-50 border-green-200" : qzStatus === "disconnected" ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [
							qzStatus === "checking" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								size: 18,
								className: "animate-spin text-gray-400"
							}),
							qzStatus === "connected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
								size: 18,
								className: "text-green-600"
							}),
							qzStatus === "disconnected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
								size: 18,
								className: "text-red-500"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `text-sm font-bold ${qzStatus === "connected" ? "text-green-700" : qzStatus === "disconnected" ? "text-red-700" : "text-gray-600"}`,
								children: qzStatus === "checking" ? "Verificando QZ Tray..." : qzStatus === "connected" ? "QZ Tray conectado ✓" : "QZ Tray não encontrado"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-gray-500",
								children: qzStatus === "connected" ? "Impressão direta ativada — sem diálogo" : "Instale e inicie o QZ Tray para impressão automática"
							})] })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: checkQz,
						className: "p-1.5 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600",
						title: "Verificar novamente",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 15 })
					})]
				}),
				qzStatus === "disconnected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-bold text-blue-700",
							children: "Como configurar o QZ Tray:"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "text-xs text-blue-700 space-y-1 list-decimal list-inside",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Você já baixou — ótimo! Agora ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "instale e execute o QZ Tray" })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Depois que abrir, aparece um ícone na barra de tarefas (bandeja do sistema)" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"Volte aqui e clique em ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Verificar novamente\"" }),
									" (↻)"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Configure o IP e a porta da sua impressora abaixo" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"Clique em ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Testar impressão\"" }),
									" para confirmar"
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "https://qz.io/download",
							target: "_blank",
							rel: "noopener noreferrer",
							className: "inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { size: 12 }), " Download QZ Tray (gratuito)"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-xl border p-6 space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between p-3 border rounded-xl bg-gray-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
									size: 18,
									className: "text-[#5850ec]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-gray-800",
									children: "Impressão Automática"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-gray-500",
									children: "Imprimir ao receber novo pedido"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: config.impressao_automatica,
								onCheckedChange: (v) => setConfig({
									...config,
									impressao_automatica: v
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
										children: "IP da Impressora"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: config.impressora_ip,
										onChange: (e) => setConfig({
											...config,
											impressora_ip: e.target.value
										}),
										placeholder: "Ex: 192.168.1.100"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-gray-400 mt-1",
										children: "Para descobrir: ligue a impressora e segure o botão de alimentação até imprimir uma folha de teste com o IP."
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
									children: "Porta TCP"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: config.impressora_porta,
									onChange: (e) => setConfig({
										...config,
										impressora_porta: e.target.value
									}),
									placeholder: "9100"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
										children: "Cópias"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: "1",
										max: "5",
										value: config.copias,
										onChange: (e) => setConfig({
											...config,
											copias: e.target.value
										})
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
										children: "Largura do Papel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: config.tamanho_papel,
										onChange: (e) => setConfig({
											...config,
											tamanho_papel: e.target.value
										}),
										className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "58mm",
											children: "58mm (32 colunas)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "80mm",
											children: "80mm (42 colunas)"
										})]
									})] })]
								}),
								[{
									key: "imprimir_ao_confirmar",
									label: "Imprimir ao receber novo pedido"
								}, {
									key: "imprimir_ao_entregar",
									label: "Imprimir ao marcar como entregue"
								}].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-3 border rounded-xl",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-gray-700",
										children: t.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: !!config[t.key],
										onCheckedChange: (v) => setConfig({
											...config,
											[t.key]: v
										})
									})]
								}, t.key))
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: handleTestar,
								disabled: testing || !config.impressora_ip || qzStatus !== "connected",
								className: "flex-1 gap-2",
								title: qzStatus !== "connected" ? "QZ Tray precisa estar conectado" : "",
								children: [testing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									size: 15,
									className: "animate-spin"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { size: 15 }), "Testar impressão"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => saveMutation.mutate(),
								disabled: saveMutation.isPending,
								className: "flex-1 bg-[#5850ec] text-white gap-2",
								children: [saveMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									size: 15,
									className: "animate-spin"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 15 }), "Salvar"]
							})]
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { AdminConfigImpressaoPage as component };
