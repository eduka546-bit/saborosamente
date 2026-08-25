import { t as supabase } from "./client-BvgAz7YC.mjs";
import { M as redirect, f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/perfil-BwjAprQU.js
var $$splitComponentImporter = () => import("./perfil-i8KMrez1.mjs");
var Route = createFileRoute("/_authenticated/perfil")({
	beforeLoad: async () => {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) throw redirect({
			to: "/auth",
			search: { redirect: "/perfil" }
		});
		return { session };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
