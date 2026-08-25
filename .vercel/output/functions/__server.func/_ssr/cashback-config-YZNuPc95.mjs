import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { F as Search, I as Save, c as Users, ct as LoaderCircle, gt as Gift, jt as Clock } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cashback-config-YZNuPc95.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminCashbackConfigPage() {
	const queryClient = useQueryClient();
	const [config, setConfig] = (0, import_react.useState)({
		ativo: true,
		percentual: "1",
		validade_dias: "30",
		minimo_uso: "5",
		limite_desconto_pct: "10"
	});
	const [settingsId, setSettingsId] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	useQuery({
		queryKey: ["cashback-config-settings"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("id, cashback_percentual, cashback_validade_dias, cashback_minimo_uso, cashback_limite_desconto_pct, cashback_ativo").maybeSingle();
			if (data) {
				setSettingsId(data.id);
				setConfig({
					ativo: data.cashback_ativo !== false,
					percentual: String(data.cashback_percentual ?? 1),
					validade_dias: String(data.cashback_validade_dias ?? 30),
					minimo_uso: String(data.cashback_minimo_uso ?? 5),
					limite_desconto_pct: String(data.cashback_limite_desconto_pct ?? 10)
				});
			}
			return data;
		}
	});
	const { data: transacoes = [], isLoading } = useQuery({
		queryKey: ["admin-cashback-transacoes"],
		queryFn: async () => {
			const { data, error } = await supabase.from("cashback_transacoes").select("*, profiles:user_id(nome, email)").order("created_at", { ascending: false }).limit(200);
			if (error) throw error;
			return data;
		}
	});
	const { data: saldos = [] } = useQuery({
		queryKey: ["admin-cashback-saldos"],
		queryFn: async () => {
			const { data, error } = await supabase.from("cashback_saldo").select("*, profiles:user_id(nome, email)").order("saldo", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const saveConfig = async () => {
		if (!settingsId) return;
		setSaving(true);
		const { error } = await supabase.from("site_settings").update({
			cashback_ativo: config.ativo,
			cashback_percentual: Number(config.percentual),
			cashback_validade_dias: Number(config.validade_dias),
			cashback_minimo_uso: Number(config.minimo_uso),
			cashback_limite_desconto_pct: Number(config.limite_desconto_pct)
		}).eq("id", settingsId);
		setSaving(false);
		if (error) toast.error("Erro: " + error.message);
		else {
			queryClient.invalidateQueries({ queryKey: ["site-settings"] });
			toast.success("Configurações de cashback salvas!");
		}
	};
	const totalDistribuido = transacoes.filter((t) => t.tipo === "recebido").reduce((s, t) => s + Math.abs(t.valor), 0);
	const totalUsado = transacoes.filter((t) => t.tipo === "usado").reduce((s, t) => s + Math.abs(t.valor), 0);
	const totalSaldo = saldos.reduce((s, t) => s + (t.saldo || 0), 0);
	const filteredTransacoes = transacoes.filter((t) => (t.profiles?.nome || "").toLowerCase().includes(search.toLowerCase()) || (t.profiles?.email || "").toLowerCase().includes(search.toLowerCase()));
	const tipoColors = {
		recebido: "bg-green-100 text-green-700",
		usado: "bg-blue-100 text-blue-700",
		expirado: "bg-red-100 text-red-700"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-[1400px] mx-auto space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "text-2xl font-bold text-[#5850ec] flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { size: 22 }), " Cashback"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Configure as regras e acompanhe os saldos dos clientes."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Total distribuído"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-2xl font-black text-green-600 mt-1",
							children: ["R$ ", totalDistribuido.toFixed(2).replace(".", ",")]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Total usado"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-2xl font-black text-blue-600 mt-1",
							children: ["R$ ", totalUsado.toFixed(2).replace(".", ",")]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-xl border p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase text-gray-400",
							children: "Saldo em aberto"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-2xl font-black text-[#5850ec] mt-1",
							children: ["R$ ", totalSaldo.toFixed(2).replace(".", ",")]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border p-6 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-bold text-gray-800",
							children: "Regras do Cashback"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-gray-500",
								children: config.ativo ? "Ativo" : "Desativado"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: config.ativo,
								onCheckedChange: (v) => setConfig({
									...config,
									ativo: v
								})
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							{
								key: "percentual",
								label: "% ganho por pedido",
								placeholder: "1",
								suffix: "%"
							},
							{
								key: "validade_dias",
								label: "Validade (dias)",
								placeholder: "30",
								suffix: "dias"
							},
							{
								key: "minimo_uso",
								label: "Saldo mínimo para usar",
								placeholder: "5",
								suffix: "R$"
							},
							{
								key: "limite_desconto_pct",
								label: "Limite de desconto",
								placeholder: "10",
								suffix: "% do pedido"
							}
						].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs font-bold uppercase text-gray-400",
								children: f.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									step: "0.1",
									min: "0",
									value: config[f.key],
									onChange: (e) => setConfig({
										...config,
										[f.key]: e.target.value
									}),
									placeholder: f.placeholder
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400",
									children: f.suffix
								})]
							})]
						}, f.key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: saveConfig,
						disabled: saving,
						className: "bg-[#5850ec] text-white",
						children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 16,
							className: "animate-spin mr-2"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
							size: 16,
							className: "mr-2"
						}), " Salvar Configurações"]
					})
				]
			}),
			saldos.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-6 py-4 border-b flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
						size: 18,
						className: "text-[#5850ec]"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-bold text-gray-800",
						children: "Saldo por Cliente"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-6 py-3",
							children: "Cliente"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-6 py-3 text-right",
							children: "Saldo"
						})] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y",
						children: saldos.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-6 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-gray-900",
									children: s.profiles?.nome || "—"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-gray-400",
									children: s.profiles?.email
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-6 py-3 text-right font-black text-[#5850ec]",
								children: ["R$ ", Number(s.saldo).toFixed(2)]
							})]
						}, s.user_id))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-6 py-4 border-b flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-bold text-gray-800 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
							size: 18,
							className: "text-[#5850ec]"
						}), " Histórico de Transações"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative w-64",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
							size: 15
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Buscar cliente...",
							className: "pl-8 h-8 text-sm",
							value: search,
							onChange: (e) => setSearch(e.target.value)
						})]
					})]
				}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center py-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "animate-spin text-[#5850ec]",
						size: 28
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Cliente"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Tipo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Valor"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Descrição"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-3",
								children: "Data"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y",
						children: [filteredTransacoes.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 5,
							className: "px-6 py-10 text-center text-gray-400",
							children: "Nenhuma transação encontrada."
						}) }), filteredTransacoes.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-gray-50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-6 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-gray-900",
										children: t.profiles?.nome || "—"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-gray-400",
										children: t.profiles?.email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: `${tipoColors[t.tipo] || "bg-gray-100 text-gray-500"} capitalize`,
										children: t.tipo
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: `px-6 py-3 font-bold ${t.tipo === "recebido" ? "text-green-600" : "text-red-500"}`,
									children: [
										t.tipo === "recebido" ? "+" : "-",
										" R$ ",
										Math.abs(t.valor).toFixed(2)
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-3 text-gray-500 text-xs",
									children: t.descricao || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-3 text-gray-400 text-xs",
									children: format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
								})
							]
						}, t.id))]
					})]
				})]
			})
		]
	});
}
//#endregion
export { AdminCashbackConfigPage as component };
