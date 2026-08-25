import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/novo-CE167v1Y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminCuponsNovoPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [form, setForm] = (0, import_react.useState)({
		codigo: "",
		tipo: "Fixo",
		valor: "",
		regra: "",
		validade: "",
		ativo: true
	});
	const saveMutation = useMutation({
		mutationFn: async (values) => {
			const { error } = await supabase.from("cupons").insert(values);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
			toast.success("Cupom criado!");
			navigate({ to: "/admin/cupons" });
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!form.codigo) return;
		saveMutation.mutate({
			...form,
			valor: Number(form.valor),
			uso: 0
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Novo Cupom"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Preencha os dados para criar um novo cupom de desconto."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSubmit,
			className: "bg-white rounded-2xl border p-6 space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
					children: "Código do Cupom *"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.codigo,
					onChange: (e) => setForm({
						...form,
						codigo: e.target.value.toUpperCase()
					}),
					required: true,
					placeholder: "EX: SABOR20",
					className: "uppercase font-bold"
				})] }),
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
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Fixo",
								children: "Fixo (R$)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Percentual",
								children: "Percentual (%)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "Entrega Grátis",
								children: "Entrega Grátis"
							})
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
						children: "Valor"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: form.valor,
						onChange: (e) => setForm({
							...form,
							valor: e.target.value
						}),
						placeholder: "0"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
					children: "Regra / Condição"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: form.regra,
					onChange: (e) => setForm({
						...form,
						regra: e.target.value
					}),
					placeholder: "Ex: Mínimo R$ 100"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
					children: "Data de Validade"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "date",
					value: form.validade,
					onChange: (e) => setForm({
						...form,
						validade: e.target.value
					})
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3 pt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: () => navigate({ to: "/admin/cupons" }),
						className: "flex-1",
						children: "Cancelar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						disabled: !form.codigo || saveMutation.isPending,
						className: "flex-1 bg-[#5850ec] text-white",
						children: [
							saveMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								size: 16,
								className: "animate-spin mr-2"
							}) : null,
							" ",
							"Criar Cupom"
						]
					})]
				})
			]
		})]
	});
}
//#endregion
export { AdminCuponsNovoPage as component };
