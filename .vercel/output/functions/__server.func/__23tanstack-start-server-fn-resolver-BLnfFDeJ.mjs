//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-BLnfFDeJ.js
var manifest = {
	"06b79c102cdad9360930a00ea009b4fe5cc4fdc50a938ba6f6595222f149b730": {
		functionName: "getPublicProducts_createServerFn_handler",
		importer: () => import("./_ssr/products.functions-CdIZ6v8r.mjs")
	},
	"63dca7bdf94d16710d79005fe4d62aa8ece1b7ae5078dca9aa66593a5c5177bc": {
		functionName: "getAdminProducts_createServerFn_handler",
		importer: () => import("./_ssr/products.functions-CdIZ6v8r.mjs")
	},
	"6a7ae2fd0cd2162f830f5a5a36f264444da7b45171dcefb9358a1d0ccfeb5a12": {
		functionName: "importExistingCustomers_createServerFn_handler",
		importer: () => import("./_ssr/customers.functions-CV3oMCvg.mjs")
	},
	"7f92d135aa3763ddd5bf6d4d9f84832b6b591cbaa35dcc4048b4b1beed8e7bf3": {
		functionName: "createOrder_createServerFn_handler",
		importer: () => import("./_ssr/orders.functions-3YjUfGgl.mjs")
	},
	"8e28ffefb35b7f29bda8f5128c6f8fb45636d264c3d475770b9bb49c082743e7": {
		functionName: "getCategories_createServerFn_handler",
		importer: () => import("./_ssr/products.functions-CdIZ6v8r.mjs")
	},
	"d3b616e51af2c7d22b44d4ae98dc1b1c3625d438d7f21a23c2cf19e2721b3a31": {
		functionName: "getTaxas_createServerFn_handler",
		importer: () => import("./_ssr/taxas.functions-BJwTU-Cz.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
