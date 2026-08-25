import { t as supabase } from "./client-BvgAz7YC.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/products.functions-CdIZ6v8r.js
var getAdminProducts_createServerFn_handler = createServerRpc({
	id: "63dca7bdf94d16710d79005fe4d62aa8ece1b7ae5078dca9aa66593a5c5177bc",
	name: "getAdminProducts",
	filename: "src/lib/products.functions.ts"
}, (opts) => getAdminProducts.__executeServer(opts));
var getAdminProducts = createServerFn({ method: "GET" }).handler(getAdminProducts_createServerFn_handler, async () => {
	try {
		const { data, error } = await supabase.from("produtos").select(`*, categorias (nome)`).order("ordem", { ascending: true }).order("nome", { ascending: true });
		if (error) {
			console.error("Error fetching admin products:", error);
			return [];
		}
		return data || [];
	} catch (err) {
		console.error("Unexpected error in getAdminProducts:", err);
		return [];
	}
});
var getPublicProducts_createServerFn_handler = createServerRpc({
	id: "06b79c102cdad9360930a00ea009b4fe5cc4fdc50a938ba6f6595222f149b730",
	name: "getPublicProducts",
	filename: "src/lib/products.functions.ts"
}, (opts) => getPublicProducts.__executeServer(opts));
var getPublicProducts = createServerFn({ method: "GET" }).handler(getPublicProducts_createServerFn_handler, async () => {
	try {
		const { data, error } = await supabase.from("produtos").select(`*, categorias (nome, ordem_filtro)`).eq("ativo", true).order("categoria_id", { ascending: true }).order("ordem", { ascending: true }).order("nome", { ascending: true });
		if (error) {
			console.error("Error fetching public products:", error);
			return [];
		}
		return data || [];
	} catch (err) {
		console.error("Unexpected error in getPublicProducts:", err);
		return [];
	}
});
var getCategories_createServerFn_handler = createServerRpc({
	id: "8e28ffefb35b7f29bda8f5128c6f8fb45636d264c3d475770b9bb49c082743e7",
	name: "getCategories",
	filename: "src/lib/products.functions.ts"
}, (opts) => getCategories.__executeServer(opts));
var getCategories = createServerFn({ method: "GET" }).handler(getCategories_createServerFn_handler, async () => {
	try {
		const { data, error } = await supabase.from("categorias").select("*").order("ordem", { ascending: true });
		if (error) {
			console.error("Error fetching categories:", error);
			return [];
		}
		return data;
	} catch (err) {
		console.error("Unexpected error in getCategories:", err);
		return [];
	}
});
//#endregion
export { getAdminProducts_createServerFn_handler, getCategories_createServerFn_handler, getPublicProducts_createServerFn_handler };
