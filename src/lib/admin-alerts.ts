/**
 * Sistema de alertas e notificações para o admin
 */

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
}

/**
 * Tipos de alertas automáticos do sistema
 */
export const ALERT_TYPES = {
  LOW_STOCK: 'low_stock',
  PENDING_ORDERS: 'pending_orders',
  HIGH_CANCELLATION: 'high_cancellation',
  PEAK_HOURS: 'peak_hours',
  GOAL_REACHED: 'goal_reached',
  LOW_CUSTOMER_RETENTION: 'low_retention',
  PAYMENT_ISSUES: 'payment_issues',
} as const;

/**
 * Gera alertas automáticos baseado em métricas
 */
export function generateAlerts(metrics: {
  lowStockProducts: any[];
  pendingOrders: number;
  cancelationRate: number;
  customerRetention: number;
  avgOrderValue: number;
  goalReached: boolean;
}): Alert[] {
  const alerts: Alert[] = [];

  // Alerta: Produtos com estoque baixo
  if (metrics.lowStockProducts.length > 0) {
    alerts.push({
      id: 'low-stock',
      type: 'warning',
      title: `${metrics.lowStockProducts.length} produtos com estoque baixo`,
      message: `${metrics.lowStockProducts.map((p) => p.nome).join(', ')} estão acabando.`,
      timestamp: new Date(),
      actionUrl: '/admin/produtos',
      actionLabel: 'Ir para Produtos',
      read: false,
    });
  }

  // Alerta: Pedidos pendentes
  if (metrics.pendingOrders > 5) {
    alerts.push({
      id: 'pending-orders',
      type: 'info',
      title: `${metrics.pendingOrders} pedidos aguardando`,
      message: 'Existem pedidos prontos para serem entregues.',
      timestamp: new Date(),
      actionUrl: '/admin/pedidos',
      actionLabel: 'Ver Pedidos',
      read: false,
    });
  }

  // Alerta: Taxa de cancelamento alta
  if (metrics.cancelationRate > 15) {
    alerts.push({
      id: 'high-cancellation',
      type: 'warning',
      title: `Taxa de cancelamento em ${Math.round(metrics.cancelationRate)}%`,
      message: 'Acima do ideal (10%). Verifique satisfação dos clientes.',
      timestamp: new Date(),
      actionUrl: '/admin/relatorios',
      actionLabel: 'Ver Relatórios',
      read: false,
    });
  }

  // Alerta: Retenção de clientes baixa
  if (metrics.customerRetention < 25) {
    alerts.push({
      id: 'low-retention',
      type: 'warning',
      title: `Retenção de clientes em ${Math.round(metrics.customerRetention)}%`,
      message: 'Considere campanhas de reengajamento.',
      timestamp: new Date(),
      read: false,
    });
  }

  // Sucesso: Meta atingida!
  if (metrics.goalReached) {
    alerts.push({
      id: 'goal-reached',
      type: 'success',
      title: '🎉 Meta mensal atingida!',
      message: 'Parabéns! Você atingiu a meta de vendas do mês.',
      timestamp: new Date(),
      read: false,
    });
  }

  return alerts;
}

/**
 * Calcula taxa de cancelamento
 */
export function calculateCancellationRate(orders: any[]): number {
  if (orders.length === 0) return 0;
  const cancelled = orders.filter((o) => o.status === 'cancelado').length;
  return (cancelled / orders.length) * 100;
}

/**
 * Identifica se estamos em horário de pico
 */
export function isPeakHour(hour: number): boolean {
  // Horários de pico (geralmente 11-14h e 17-20h para alimentação)
  return (hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20);
}

/**
 * Formata alert para exibição
 */
export function formatAlertMessage(alert: Alert): string {
  return `[${alert.timestamp.toLocaleTimeString('pt-BR')}] ${alert.title}`;
}
