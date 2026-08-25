import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { I as Save, ct as LoaderCircle, jt as Clock, p as Truck } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Switch } from "./switch-Cn1w-cIH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/horarios-D06AvIab.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_HORARIOS = [
	"Segunda",
	"Terça",
	"Quarta",
	"Quinta",
	"Sexta",
	"Sábado",
	"Domingo"
].map((d) => ({
	dia: d,
	aberto: true,
	abertura: "09:00",
	fechamento: "18:00",
	entrega_ativa: true,
	entrega_abertura: "09:00",
	entrega_fechamento: "18:00"
}));
function AdminConfigHorariosPage() {
	const queryClient = useQueryClient();
	const [horarios, setHorarios] = (0, import_react.useState)([]);
	const [aba, setAba] = (0, import_react.useState)("atendimento");
	const { isLoading } = useQuery({
		queryKey: ["config-horarios"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("horarios_funcionamento").maybeSingle();
			const h = data?.horarios_funcionamento;
			setHorarios(Array.isArray(h) && h.length === 7 ? h.map((d, i) => ({
				...DEFAULT_HORARIOS[i],
				...d
			})) : DEFAULT_HORARIOS);
			return data;
		}
	});
	const saveMutation = useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("site_settings").update({ horarios_funcionamento: horarios }).neq("id", "");
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["config-horarios"] });
			toast.success("Horários salvos!");
		},
		onError: (e) => toast.error("Erro: " + e.message)
	});
	const update = (idx, field, value) => {
		const next = [...horarios];
		next[idx] = {
			...next[idx],
			[field]: value
		};
		setHorarios(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-2xl mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold text-[#5850ec]",
					children: "Horários"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-500 text-sm mt-1",
					children: "Configure atendimento e entregas por dia da semana."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
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
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 mb-4",
				children: [{
					id: "atendimento",
					label: "🕐 Atendimento"
				}, {
					id: "entrega",
					label: "🚚 Entregas"
				}].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setAba(t.id),
					className: `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${aba === t.id ? "bg-[#5850ec] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`,
					children: t.label
				}, t.id))
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "animate-spin text-[#5850ec]",
					size: 32
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-xl border overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-6 py-3 bg-gray-50 border-b flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider",
					children: aba === "atendimento" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 14 }), " Horário de atendimento ao cliente"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { size: 14 }), " Dias e horários de entrega"] })
				}), horarios.map((h, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex items-center gap-4 px-6 py-4 border-b last:border-0 hover:bg-gray-50 ${(aba === "atendimento" ? !h.aberto : !h.entrega_ativa) ? "opacity-60" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-20 shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold text-gray-900",
								children: h.dia
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: aba === "atendimento" ? h.aberto : h.entrega_ativa,
							onCheckedChange: (v) => update(idx, aba === "atendimento" ? "aberto" : "entrega_ativa", v)
						}),
						(aba === "atendimento" ? h.aberto : h.entrega_ativa) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "time",
									value: aba === "atendimento" ? h.abertura : h.entrega_abertura,
									onChange: (e) => update(idx, aba === "atendimento" ? "abertura" : "entrega_abertura", e.target.value),
									className: "h-8 w-28 text-sm"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-gray-400 text-xs",
									children: "às"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "time",
									value: aba === "atendimento" ? h.fechamento : h.entrega_fechamento,
									onChange: (e) => update(idx, aba === "atendimento" ? "fechamento" : "entrega_fechamento", e.target.value),
									className: "h-8 w-28 text-sm"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-gray-400 flex-1",
							children: aba === "atendimento" ? "Fechado" : "Sem entrega"
						})
					]
				}, h.dia))]
			})
		]
	});
}
//#endregion
export { AdminConfigHorariosPage as component };
