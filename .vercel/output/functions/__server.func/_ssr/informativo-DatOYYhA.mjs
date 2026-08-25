import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { H as Plus, I as Save, _ as Trash2, ct as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/informativo-DatOYYhA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigInformativoPage() {
	const queryClient = useQueryClient();
	const [avisos, setAvisos] = (0, import_react.useState)([]);
	const { isLoading } = useQuery({
		queryKey: ["config-informativo"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("avisos_informativos").maybeSingle();
			if (Array.isArray(data?.avisos_informativos)) setAvisos(data.avisos_informativos);
			return data;
		}
	});
	const saveMutation = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("site_settings").update({ avisos_informativos: avisos }).neq("id", "");
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["config-informativo"] });
			toast.success("Avisos salvos!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const addAviso = () => setAvisos([...avisos, {
		texto: "",
		ativo: true
	}]);
	const removeAviso = (i) => setAvisos(avisos.filter((_, idx) => idx !== i));
	const updateAviso = (i, field, value) => {
		const next = [...avisos];
		next[i] = {
			...next[i],
			[field]: value
		};
		setAvisos(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-2xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Informativos"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Avisos e informativos exibidos para os clientes."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: addAviso,
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " Adicionar"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => saveMutation.mutate(),
					disabled: saveMutation.isPending,
					className: "bg-[#5850ec] text-white",
					children: [
						saveMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 16,
							className: "animate-spin mr-2"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, {
							size: 16,
							className: "mr-2"
						}),
						" ",
						"Salvar"
					]
				})]
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [avisos.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white rounded-xl border border-dashed p-12 text-center text-gray-400",
				children: "Nenhum aviso cadastrado."
			}), avisos.map((aviso, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border p-4 flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: aviso.ativo,
						onCheckedChange: (v) => updateAviso(i, "ativo", v)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: aviso.texto,
						onChange: (e) => updateAviso(i, "texto", e.target.value),
						placeholder: "Texto do aviso informativo...",
						className: "flex-1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "h-8 w-8 text-gray-400 hover:text-red-500",
						onClick: () => removeAviso(i),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
					})
				]
			}, i))]
		})]
	});
}
//#endregion
export { AdminConfigInformativoPage as component };
