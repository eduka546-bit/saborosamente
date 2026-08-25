import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.index-B--7DsbR.js
var import_jsx_runtime = require_jsx_runtime();
var SplitErrorComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "p-8 text-center",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-gray-500",
		children: "Erro ao carregar dashboard. Recarregue a página."
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => window.location.reload(),
		className: "mt-4 px-4 py-2 bg-primary text-white rounded-lg",
		children: "Recarregar"
	})]
});
//#endregion
export { SplitErrorComponent as errorComponent };
