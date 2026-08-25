import { t as supabase } from "./client-BvgAz7YC.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/taxas.functions-BJwTU-Cz.js
var getTaxas_createServerFn_handler = createServerRpc({
	id: "d3b616e51af2c7d22b44d4ae98dc1b1c3625d438d7f21a23c2cf19e2721b3a31",
	name: "getTaxas",
	filename: "src/lib/taxas.functions.ts"
}, (opts) => getTaxas.__executeServer(opts));
var getTaxas = createServerFn({ method: "GET" }).handler(getTaxas_createServerFn_handler, async () => {
	const { data, error } = await supabase.from("delivery_rates").select("id, cidade, bairro, valor, ativo").eq("ativo", true).order("cidade").order("bairro");
	if (error || !data || data.length === 0) return null;
	return data.map((r) => ({
		id: r.id,
		cidade: r.cidade,
		bairro: r.bairro,
		taxa: Number(r.valor ?? 0),
		ativo: r.ativo
	}));
});
//#endregion
export { getTaxas_createServerFn_handler };
