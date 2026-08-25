import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { H as Plus, I as Save, ct as LoaderCircle, i as X } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/origem-BBQjaPnp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigOrigemPage() {
	const queryClient = useQueryClient();
	const [origens, setOrigens] = (0, import_react.useState)([]);
	const [nova, setNova] = (0, import_react.useState)("");
	const { isLoading } = useQuery({
		queryKey: ["config-origem"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("como_nos_conheceu").maybeSingle();
			if (Array.isArray(data?.como_nos_conheceu)) setOrigens(data.como_nos_conheceu);
			return data;
		}
	});
	const saveMutation = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("site_settings").update({ como_nos_conheceu: origens }).neq("id", "");
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["config-origem"] });
			toast.success("Opções salvas!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const add = () => {
		if (!nova.trim()) return;
		setOrigens([...origens, nova.trim()]);
		setNova("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Como nos Conheceu"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Opções exibidas no cadastro / checkout para o cliente indicar como encontrou a loja."
			})]
		}), isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-center py-20",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "animate-spin text-[#5850ec]",
				size: 32
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-xl border p-6 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [origens.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gray-400 text-center py-4",
						children: "Nenhuma opção cadastrada."
					}), origens.map((o, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex-1 text-sm text-gray-800",
							children: o
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setOrigens(origens.filter((_, idx) => idx !== i)),
							className: "text-gray-300 hover:text-red-500",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
						})]
					}, i))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: nova,
						onChange: (e) => setNova(e.target.value),
						placeholder: "Nova opção (ex: Instagram)",
						onKeyDown: (e) => e.key === "Enter" && add()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: add,
						className: "shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => saveMutation.mutate(),
					disabled: saveMutation.isPending,
					className: "w-full bg-[#5850ec] text-white",
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
				})
			]
		})]
	});
}
//#endregion
export { AdminConfigOrigemPage as component };
