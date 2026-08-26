/**
 * Utilitário para rastreamento de pedidos em tempo real
 * Integra com WebSockets do Supabase para updates em tempo real
 */

export interface OrderStatus {
  id: string;
  status:
    | "novo_pedido"
    | "pagamento_confirmado"
    | "preparando"
    | "saiu para entrega"
    | "entregue"
    | "cancelado";
  updated_at: string;
  nome_cliente: string;
  telefone_cliente: string;
  tempo_estimado?: number; // em minutos
}

/**
 * URLs de rastreamento amigáveis para compartilhar
 */
export function getTrackingUrl(protocolId: string, baseUrl?: string): string {
  const url =
    baseUrl ||
    (typeof window !== "undefined" ? window.location.origin : "https://saborosamente.vercel.app");
  return `${url}/pedido?p=${protocolId.toUpperCase()}`;
}

/**
 * Formata status para exibição
 */
export function formatOrderStatus(status: string): {
  label: string;
  emoji: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; emoji: string; color: string }> = {
    novo_pedido: { label: "Pedido Recebido", emoji: "📋", color: "blue" },
    pagamento_confirmado: { label: "Pagamento Confirmado", emoji: "✅", color: "green" },
    preparando: { label: "Preparando", emoji: "🔥", color: "orange" },
    "saiu para entrega": { label: "Saiu para Entrega", emoji: "🚚", color: "yellow" },
    entregue: { label: "Entregue", emoji: "🎉", color: "green" },
    cancelado: { label: "Cancelado", emoji: "❌", color: "red" },
  };

  return statusMap[status] || { label: status, emoji: "❓", color: "gray" };
}

/**
 * Tempo estimado de cada status (em minutos)
 */
export function getEstimatedTime(status: string): number | null {
  const timeMap: Record<string, number> = {
    novo_pedido: 5,
    pagamento_confirmado: 10,
    preparando: 35,
    "saiu para entrega": 45,
    entregue: 0,
  };

  return timeMap[status] || null;
}

/**
 * Calcula o percentual de progresso do pedido
 */
export function getOrderProgress(status: string): number {
  const progressMap: Record<string, number> = {
    novo_pedido: 0,
    pagamento_confirmado: 20,
    preparando: 50,
    "saiu para entrega": 80,
    entregue: 100,
    cancelado: 0,
  };

  return progressMap[status] || 0;
}

/**
 * Próximo status esperado
 */
export function getNextStatus(currentStatus: string): string | null {
  const flowMap: Record<string, string | null> = {
    novo_pedido: "preparando",
    pagamento_confirmado: "preparando",
    preparando: "saiu para entrega",
    "saiu para entrega": "entregue",
    entregue: null,
    cancelado: null,
  };

  return flowMap[currentStatus] || null;
}

/**
 * Gera mensagem de rastreamento para compartilhar
 */
export function generateTrackingMessage(
  protocolId: string,
  clientName: string,
  status: string,
  trackingUrl: string,
): string {
  const { emoji, label } = formatOrderStatus(status);

  return `${emoji} *${label}* - Pedido #${protocolId}\n\n*${clientName}*, seu pedido está em: ${label}\n\nAcompanhe em tempo real:\n${trackingUrl}`;
}
