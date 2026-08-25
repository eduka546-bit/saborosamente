import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { d as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-D9x0Ds1a.js
var import_jsx_runtime = require_jsx_runtime();
function AdminLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen flex-col bg-gray-50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 overflow-x-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		})
	});
}
var SplitComponent = function AdminLayoutWrapper() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLayout, {});
};
//#endregion
export { SplitComponent as component };
