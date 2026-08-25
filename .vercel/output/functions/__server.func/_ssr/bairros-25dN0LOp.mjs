import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { rt as MapPin } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bairros-25dN0LOp.js
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigBairrosPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-6 max-w-2xl mx-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-[#5850ec]",
				children: "Bairros Atendidos"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 text-sm mt-1",
				children: "Gerencie os bairros e taxas de entrega."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-white rounded-2xl border p-8 text-center space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
					size: 48,
					className: "mx-auto text-[#5850ec] opacity-30"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-gray-600 font-medium",
					children: "Esta configuração é gerenciada na página de Taxas de Entrega."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "bg-[#5850ec] text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/config/taxas",
						children: "Ir para Taxas de Entrega"
					})
				})
			]
		})]
	});
}
//#endregion
export { AdminConfigBairrosPage as component };
