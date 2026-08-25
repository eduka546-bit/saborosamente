import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { I as Save, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cashback-CjOFSQ7z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigCashbackPage() {
	const queryClient = useQueryClient();
	const [config, setConfig] = (0, import_react.useState)({
		ativo: false,
		percentual: "5",
		minimo_pedido: "0",
		validade_dias: "30"
	});
	const { isLoading } = useQuery({
		queryKey: ["config-cashback"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("cashback_config").maybeSingle();
			if (data?.cashback_config) setConfig(data.cashback_config);
			return data;
		}
	});
	const saveMutation = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("site_settings").update({ cashback_config: config }).neq("id", "");
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["config-cashback"] });
			toast.success("Configurações de cashback salvas!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Configurações de Cashback"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Defina as regras do programa de cashback."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-xl border p-6 space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between p-4 border rounded-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold text-gray-800",
						children: "Cashback Ativo"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-500",
						children: "Habilitar programa de cashback"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: config.ativo,
						onCheckedChange: (v) => setConfig({
							...config,
							ativo: v
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Percentual de Cashback (%)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.5",
								value: config.percentual,
								onChange: (e) => setConfig({
									...config,
									percentual: e.target.value
								}),
								placeholder: "5"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-gray-400 mt-1",
								children: "Porcentagem do valor do pedido retornada como cashback"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
							children: "Pedido mínimo para gerar cashback (R$)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							step: "1",
							value: config.minimo_pedido,
							onChange: (e) => setConfig({
								...config,
								minimo_pedido: e.target.value
							}),
							placeholder: "0"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
							children: "Validade do cashback (dias)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							step: "1",
							value: config.validade_dias,
							onChange: (e) => setConfig({
								...config,
								validade_dias: e.target.value
							}),
							placeholder: "30"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => saveMutation.mutate(),
					disabled: saveMutation.isPending,
					className: "w-full bg-[#5850ec] text-white",
					children: [saveMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 16,
						className: "animate-spin mr-2"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
						size: 16,
						className: "mr-2"
					}), " Salvar Configurações"]
				})
			]
		})]
	});
}
//#endregion
export { AdminConfigCashbackPage as component };
