/**
 * Configurações otimizadas de cache para React Query
 * Melhora performance ao evitar requisições desnecessárias
 */

export const QUERY_CONFIG = {
  // Dashboard - dados que mudam frequentemente
  dashboard: {
    staleTime: 30_000, // 30 segundos
    gcTime: 5 * 60_000, // 5 minutos
    refetchInterval: 60_000, // Refetch a cada 1 minuto
  },

  // Pedidos - dados críticos, mudam bastante
  orders: {
    staleTime: 10_000, // 10 segundos
    gcTime: 3 * 60_000, // 3 minutos
    refetchInterval: 30_000, // Refetch a cada 30 segundos
  },

  // Produtos - dados mais estáveis
  products: {
    staleTime: 2 * 60_000, // 2 minutos
    gcTime: 10 * 60_000, // 10 minutos
  },

  // Clientes - dados estáveis
  clients: {
    staleTime: 3 * 60_000, // 3 minutos
    gcTime: 15 * 60_000, // 15 minutos
  },

  // Categorias - dados muito estáveis
  categories: {
    staleTime: 10 * 60_000, // 10 minutos
    gcTime: 30 * 60_000, // 30 minutos
  },

  // Configurações - dados que raramente mudam
  settings: {
    staleTime: 30 * 60_000, // 30 minutos
    gcTime: 60 * 60_000, // 1 hora
  },
};

// Presets para diferentes tipos de dados
export const createQueryConfig = (type: keyof typeof QUERY_CONFIG) => {
  return QUERY_CONFIG[type];
};
