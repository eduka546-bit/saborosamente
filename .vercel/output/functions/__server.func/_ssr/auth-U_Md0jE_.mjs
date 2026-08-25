import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-U_Md0jE_.js
var $$splitComponentImporter = () => import("./auth-Bg1CyjrV.mjs");
var Route = createFileRoute("/auth")({
	head: () => ({ meta: [
		{ title: "Entrar ou criar conta | Saborosamente" },
		{
			name: "description",
			content: "Acesse sua conta Saborosamente para acompanhar pedidos, salvar endereços e finalizar sua compra de marmitas congeladas mais rápido."
		},
		{
			property: "og:title",
			content: "Entrar ou criar conta | Saborosamente"
		},
		{
			property: "og:description",
			content: "Entre na sua conta Saborosamente e finalize seu pedido de marmitas congeladas em poucos cliques."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{
			name: "robots",
			content: "noindex, follow"
		}
	] }),
	validateSearch: (search) => {
		return { redirect: search.redirect || "/" };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
