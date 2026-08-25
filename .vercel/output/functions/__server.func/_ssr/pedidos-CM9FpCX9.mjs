import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { Nt as ClipboardList } from "../_libs/lucide-react.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pedidos-CM9FpCX9.js
var import_jsx_runtime = require_jsx_runtime();
function AdminPedidosIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-8 text-center py-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, {
				size: 48,
				className: "mx-auto text-[#5850ec] mb-4 opacity-20"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-bold text-gray-800",
				children: "Módulo de Pedidos"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 mt-2",
				children: "Selecione uma sub-aba no menu superior."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin/pedidos",
				className: "inline-block mt-4 text-[#5850ec] font-bold hover:underline",
				children: "Ver todos os pedidos"
			})
		]
	});
}
//#endregion
export { AdminPedidosIndex as component };
