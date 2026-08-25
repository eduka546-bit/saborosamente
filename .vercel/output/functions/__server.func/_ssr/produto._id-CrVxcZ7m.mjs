import { f as lazyRouteComponent, p as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/produto._id-CrVxcZ7m.js
var $$splitComponentImporter = () => import("./produto._id-tfKjMpG0.mjs");
var Route = createFileRoute("/produto/$id")({
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	head: () => ({ meta: [{ title: "Produto | Saborosamente" }, {
		name: "description",
		content: "Detalhes do produto"
	}] })
});
//#endregion
export { Route as t };
