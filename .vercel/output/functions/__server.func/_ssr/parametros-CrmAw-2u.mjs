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
//#region node_modules/.nitro/vite/services/ssr/assets/parametros-CrmAw-2u.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_PARAMS = {
	pedido_minimo: "0",
	frete_gratis_acima: "120",
	tempo_entrega_estimado: "45-60 min",
	aceitar_retirada: true,
	aceitar_delivery: true,
	maximo_itens_pedido: "50"
};
function AdminConfigParametrosPage() {
	const queryClient = useQueryClient();
	const [params, setParams] = (0, import_react.useState)(DEFAULT_PARAMS);
	const { isLoading } = useQuery({
		queryKey: ["config-parametros"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("parametros_loja").maybeSingle();
			if (data?.parametros_loja) setParams({
				...DEFAULT_PARAMS,
				...data.parametros_loja
			});
			return data;
		}
	});
	const saveMutation = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("site_settings").update({ parametros_loja: params }).neq("id", "");
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["config-parametros"] });
			toast.success("Parâmetros salvos!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Parâmetros da Loja"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Configurações gerais de operação."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-xl border p-6 space-y-5",
			children: [
				[
					{
						key: "pedido_minimo",
						label: "Pedido mínimo (R$)",
						type: "number"
					},
					{
						key: "frete_gratis_acima",
						label: "Frete grátis acima de (R$)",
						type: "number"
					},
					{
						key: "tempo_entrega_estimado",
						label: "Tempo de entrega estimado",
						type: "text"
					},
					{
						key: "maximo_itens_pedido",
						label: "Máximo de itens por pedido",
						type: "number"
					}
				].map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
					children: field.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: field.type,
					value: params[field.key],
					onChange: (e) => setParams({
						...params,
						[field.key]: e.target.value
					})
				})] }, field.key)),
				[{
					key: "aceitar_delivery",
					label: "Aceitar Delivery"
				}, {
					key: "aceitar_retirada",
					label: "Aceitar Retirada no Local"
				}].map((toggle) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between p-3 border rounded-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold text-gray-700",
						children: toggle.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: !!params[toggle.key],
						onCheckedChange: (v) => setParams({
							...params,
							[toggle.key]: v
						})
					})]
				}, toggle.key)),
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
					}), " Salvar Parâmetros"]
				})
			]
		})]
	});
}
//#endregion
export { AdminConfigParametrosPage as component };
