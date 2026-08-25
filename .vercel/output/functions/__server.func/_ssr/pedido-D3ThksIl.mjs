import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pedido-D3ThksIl.js
var $$splitComponentImporter = () => import("./pedido-h9odcuxe.mjs");
var Route = createFileRoute("/pedido/")({
	head: () => ({ meta: [
		{ title: "Rastrear Pedido | Saborosamente" },
		{
			name: "description",
			content: "Acompanhe o status do seu pedido em tempo real."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	validateSearch: (search) => ({ p: typeof search.p === "string" ? search.p : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
