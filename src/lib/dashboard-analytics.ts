/**
 * Utilitário para analytics e métricas do dashboard admin
 */

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductMetrics {
  id: string;
  nome: string;
  vendas: number;
  receita: number;
  rating: number;
}

export interface KPIs {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  customerRetention: number;
  peakHour: string;
  topPaymentMethod: string;
}

/**
 * Calcula KPIs principais do negócio
 */
export function calculateKPIs(
  orders: any[],
  customers: any[],
  previousOrders?: any[]
): KPIs {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.valor_total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Estimativa de conversão (pedidos vs sessões - usaremos clientes como proxy)
  const conversionRate = customers.length > 0 ? (totalOrders / (customers.length * 10)) * 100 : 0;

  // Retenção de clientes (clientes com mais de 1 pedido)
  const customerOrders: Record<string, number> = {};
  orders.forEach((o) => {
    const cid = o.user_id || o.telefone_cliente;
    if (cid) customerOrders[cid] = (customerOrders[cid] || 0) + 1;
  });
  const recurringCustomers = Object.values(customerOrders).filter((qty) => qty > 1).length;
  const customerRetention = customers.length > 0 ? (recurringCustomers / customers.length) * 100 : 0;

  // Hora de pico (assumindo formato de data padrão)
  const hourMap: Record<string, number> = {};
  orders.forEach((o) => {
    const hour = new Date(o.created_at).getHours();
    const key = `${hour}:00`;
    hourMap[key] = (hourMap[key] || 0) + 1;
  });
  const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Método de pagamento mais usado
  const paymentMap: Record<string, number> = {};
  orders.forEach((o) => {
    const method = o.metodo_pagamento || "indefinido";
    paymentMap[method] = (paymentMap[method] || 0) + 1;
  });
  const topPaymentMethod = Object.entries(paymentMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    conversionRate: Math.min(100, conversionRate),
    customerRetention: Math.min(100, customerRetention),
    peakHour,
    topPaymentMethod,
  };
}

/**
 * Agrupa dados de vendas por período (dia, semana, mês)
 */
export function groupSalesByPeriod(
  orders: any[],
  period: 'day' | 'week' | 'month' = 'day'
): SalesData[] {
  const groupMap: Record<string, { revenue: number; orders: number }> = {};

  orders.forEach((order) => {
    const date = new Date(order.created_at);
    let key: string;

    if (period === 'day') {
      key = date.toLocaleDateString('pt-BR');
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = `Semana de ${weekStart.toLocaleDateString('pt-BR')}`;
    } else {
      key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    if (!groupMap[key]) {
      groupMap[key] = { revenue: 0, orders: 0 };
    }

    groupMap[key].revenue += order.valor_total || 0;
    groupMap[key].orders += 1;
  });

  return Object.entries(groupMap)
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calcula métricas por categoria
 */
export function getCategoryMetrics(
  orders: any[],
  items: any[]
): Record<string, { vendas: number; receita: number }> {
  const categoryMap: Record<string, { vendas: number; receita: number }> = {};

  items.forEach((item) => {
    const category = item.produtos?.categoria || 'Sem categoria';
    const receita = (item.preco_unitario || 0) * (item.quantidade || 0);

    if (!categoryMap[category]) {
      categoryMap[category] = { vendas: 0, receita: 0 };
    }

    categoryMap[category].vendas += item.quantidade || 1;
    categoryMap[category].receita += receita;
  });

  return categoryMap;
}

/**
 * Formata número para moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
