//#region node_modules/.nitro/vite/services/ssr/assets/query-config-CV5KxvX3.js
/**
* Configurações otimizadas de cache para React Query
* Melhora performance ao evitar requisições desnecessárias
*/
var QUERY_CONFIG = {
	dashboard: {
		staleTime: 3e4,
		gcTime: 5 * 6e4,
		refetchInterval: 6e4
	},
	orders: {
		staleTime: 1e4,
		gcTime: 3 * 6e4,
		refetchInterval: 3e4
	},
	products: {
		staleTime: 2 * 6e4,
		gcTime: 10 * 6e4
	},
	clients: {
		staleTime: 3 * 6e4,
		gcTime: 15 * 6e4
	},
	categories: {
		staleTime: 10 * 6e4,
		gcTime: 30 * 6e4
	},
	settings: {
		staleTime: 30 * 6e4,
		gcTime: 60 * 6e4
	}
};
var createQueryConfig = (type) => {
	return QUERY_CONFIG[type];
};
//#endregion
export { createQueryConfig as t };
