import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { d as Outlet, g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-Aa_lkGcr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAIN_ADMIN_EMAIL = "anabolic.foodsbs@gmail.com";
function AdminLayout() {
	const navigate = useNavigate();
	const [authState, setAuthState] = (0, import_react.useState)("checking");
	(0, import_react.useEffect)(() => {
		let active = true;
		const verificarAcesso = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session?.user) {
				if (active) setAuthState("unauthorized");
				return;
			}
			if (session.user.email === MAIN_ADMIN_EMAIL) {
				if (active) setAuthState("authorized");
				return;
			}
			const { data: roleData, error } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
			if (active) setAuthState(error || !roleData ? "unauthorized" : "authorized");
		};
		verificarAcesso();
		const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
			verificarAcesso();
		});
		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (authState === "unauthorized") navigate({
			to: "/admin-login",
			replace: true
		});
	}, [authState, navigate]);
	if (authState !== "authorized") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-gray-50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-gray-500",
				children: authState === "checking" ? "Verificando acesso..." : "Redirecionando para o login..."
			})]
		})
	});
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
