import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { N as Settings } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/config-B2LJTMCo.js
var import_jsx_runtime = require_jsx_runtime();
function AdminConfigIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 text-center py-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
				size: 48,
				className: "mx-auto text-[#5850ec] mb-4 opacity-20"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-bold text-gray-800",
				children: "Configurações Gerais"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 mt-2",
				children: "Ajuste os parâmetros do sistema."
			})
		]
	});
}
//#endregion
export { AdminConfigIndex as component };
