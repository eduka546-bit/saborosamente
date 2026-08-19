import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardList, Utensils, TrendingUp, Users as UsersIcon,
  Package, Clock, Plus, BarChart2, ShoppingBag,
  ArrowRight, Truck, Star, MessageCircle, AlertCircle
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateKPIs, groupSalesByPeriod, formatCurrency, formatPercent, getCategoryMetrics } from "@/lib/dashboard-analytics";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  // Desabilitar SSR para evitar hydration mismatch com gráficos
  ssr: false,
});

const META_MENSAL = 10000;

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    staleTime: 30_000,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        ordersTodayRes,
        activeProductsRes,
        monthlyOrdersRes,
        recentOrdersRes,
        newClientsRes,
        pendingOrdersRes,
        topProductsRes,
        allOrdersLast30Res,
        allOrdersItemsRes,
        lowStockRes,
        allCustomersRes,
      ] = await Promise.all([
        supabase.from("pedidos").select("*", { count: "exact", head: true }).gte("created_at", todayStr),
        supabase.from("produtos").select("*", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("pedidos").select("valor_total, taxa_entrega, desconto_aplicado").gte("created_at", firstDayOfMonth).neq("status", "cancelado"),
        supabase.from("pedidos").select("id, nome_cliente, valor_total, status, created_at, endereco_bairro, metodo_entrega, origem").order("created_at", { ascending: false }).limit(8),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", firstDayOfMonth),
        supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("status", "preparando"),
        supabase.from("pedido_itens").select("produto_id, quantidade, produtos:produto_id(nome)").limit(200),
        supabase.from("pedidos").select("id, valor_total, created_at, status").gte("created_at", last30Days).neq("status", "cancelado"),
        supabase.from("pedido_itens").select("preco_unitario, quantidade, produtos:produto_id(categoria)").gte("created_at", last30Days),
        supabase.from("produtos").select("id, nome, estoque").lt("estoque", 5),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const monthlyRevenue = (monthlyOrdersRes.data ?? []).reduce(
        (acc, o) => acc + (Number(o.valor_total) || 0),
        0
      );

      // Top produtos por quantidade vendida
      const countMap: Record<string, { nome: string; qty: number }> = {};
      (topProductsRes.data ?? []).forEach((i: any) => {
        const id = i.produto_id;
        if (!id) return;
        if (!countMap[id]) countMap[id] = { nome: i.produtos?.nome ?? "Produto", qty: 0 };
        countMap[id].qty += i.quantidade ?? 1;
      });
      const topProdutos = Object.values(countMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

      // Dados para gráfico de vendas (últimos 30 dias)
      const salesData = groupSalesByPeriod(allOrdersLast30Res.data ?? [], 'day');

      // KPIs
      const kpis = calculateKPIs(
        monthlyOrdersRes.data ?? [],
        allCustomersRes.data ?? []
      );

      // Produtos com baixo estoque
      const lowStockProducts = (lowStockRes.data ?? []).slice(0, 5);

      return {
        ordersToday: ordersTodayRes.count ?? 0,
        activeProducts: activeProductsRes.count ?? 0,
        monthlyRevenue,
        recentOrders: recentOrdersRes.data ?? [],
        newClients: newClientsRes.count ?? 0,
        pendingOrders: pendingOrdersRes.count ?? 0,
        topProdutos,
        salesData,
        kpis,
        lowStockProducts,
        allOrders: monthlyOrdersRes.data ?? [],
      };
    },
  });

  const pct = Math.min(100, Math.round(((stats?.monthlyRevenue ?? 0) / META_MENSAL) * 100));

  const statusColors: Record<string, string> = {
    preparando:          "bg-blue-100 text-blue-700",
    pendente:            "bg-yellow-100 text-yellow-700",
    "saiu para entrega": "bg-purple-100 text-purple-700",
    entregue:            "bg-green-100 text-green-700",
    cancelado:           "bg-red-100 text-red-700",
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const skeleton = "animate-pulse bg-gray-200 rounded-lg h-7 w-20 inline-block";

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:py-10 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#5850ec]">Painel Administrativo</h1>
        <p className="mt-1 text-sm text-gray-500">Bem-vindo ao centro de controle da Saborosamente.</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Pedidos Hoje",
            value: stats?.ordersToday,
            sub: `${stats?.pendingOrders ?? 0} em preparo`,
            icon: ClipboardList,
            color: "bg-[#5850ec]/10 text-[#5850ec]",
            href: "/admin/pedidos",
          },
          {
            label: "Produtos Ativos",
            value: stats?.activeProducts,
            sub: "no cardápio",
            icon: Utensils,
            color: "bg-orange-100 text-orange-600",
            href: "/admin/produtos",
          },
          {
            label: "Receita Mensal",
            value: stats?.monthlyRevenue !== undefined ? `R$ ${fmt(stats.monthlyRevenue)}` : undefined,
            sub: `Meta: R$ ${fmt(META_MENSAL)}`,
            icon: TrendingUp,
            color: "bg-green-100 text-green-600",
            href: "/admin/relatorios",
          },
          {
            label: "Novos Clientes",
            value: stats?.newClients,
            sub: "este mês",
            icon: UsersIcon,
            color: "bg-blue-100 text-blue-600",
            href: "/admin/clientes",
          },
        ].map((card) => (
          <Link key={card.label} to={card.href as any} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-[#5850ec]/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className={`h-11 w-11 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                <card.icon size={22} />
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-[#5850ec] transition-colors mt-1" />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
            {isLoading
              ? <span className={skeleton} />
              : <p className="text-2xl font-black text-gray-900">{card.value}</p>
            }
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Linha 2 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* Últimos Pedidos */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="text-[#5850ec]" size={18} /> Últimos Pedidos
            </h3>
            <Link to="/admin/pedidos" className="text-xs font-bold text-[#5850ec] uppercase hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5850ec] border-t-transparent" />
              </div>
            ) : (stats?.recentOrders.length ?? 0) === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">Nenhum pedido ainda</div>
            ) : (
              stats?.recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  to="/admin/pedidos"
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      {order.origem === "whatsapp"
                        ? <MessageCircle size={15} className="text-green-600" />
                        : <Package size={15} className="text-gray-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">
                        {order.nome_cliente || "Cliente"} · {order.metodo_entrega === "entrega" ? `${order.endereco_bairro ?? "Entrega"}` : "Retirada"}
                        {order.origem === "whatsapp" && <span className="ml-1 text-green-600">· WA</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-gray-900">R$ {fmt(order.valor_total)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-5">

          {/* Acesso Rápido */}
          <div className="bg-[#5850ec] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
            <h3 className="text-base font-bold mb-1">Acesso Rápido</h3>
            <p className="text-white/70 text-xs mb-5">Gerencie seu negócio de forma eficiente.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Novo Produto", icon: Plus, href: "/admin/produtos" },
                { label: "Ver Pedidos", icon: ShoppingBag, href: "/admin/pedidos" },
                { label: "Relatórios", icon: BarChart2, href: "/admin/relatorios" },
                { label: "Entregas", icon: Truck, href: "/admin/config/taxas" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href as any}
                  className="bg-white/10 hover:bg-white/20 p-3.5 rounded-xl transition-all border border-white/20 flex items-center gap-2.5"
                >
                  <item.icon size={18} className="shrink-0" />
                  <p className="text-xs font-bold">{item.label}</p>
                </Link>
              ))}
            </div>
            <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Meta de Vendas */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Meta Mensal</h3>
              <TrendingUp className={pct >= 100 ? "text-green-500" : "text-[#5850ec]"} size={20} />
            </div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-2xl font-black text-[#5850ec]">{pct}%</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isLoading ? "..." : `R$ ${fmt(stats?.monthlyRevenue ?? 0)}`} de R$ {fmt(META_MENSAL)}
                </p>
              </div>
              {pct >= 100 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ Meta atingida!</span>}
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-green-500" : "bg-[#5850ec]"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>

          {/* Top Produtos */}
          {(stats?.topProdutos?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl border p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Star size={16} className="text-yellow-500" /> Mais Vendidos
              </h3>
              <div className="space-y-2">
                {stats?.topProdutos.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.nome}</p>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#5850ec] rounded-full"
                          style={{ width: `${Math.min(100, (p.qty / (stats.topProdutos[0]?.qty ?? 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 shrink-0">{p.qty}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Linha 3: Gráficos de análise */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Gráfico de vendas nos últimos 30 dias */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-[#5850ec]" size={18} /> Vendas - Últimos 30 Dias
            </h3>
            <p className="text-xs text-gray-400 mt-1">Receita diária</p>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5850ec] border-t-transparent" />
            </div>
          ) : (stats?.salesData?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#5850ec"
                  dot={{ fill: '#5850ec', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Receita (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">Sem dados</div>
          )}
        </div>

        {/* KPIs em cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4">KPIs Principais</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Ticket Médio</span>
                <span className="font-bold text-lg text-[#5850ec]">
                  {isLoading ? "..." : formatCurrency(stats?.kpis?.averageOrderValue ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Taxa de Retenção</span>
                <span className="font-bold text-lg text-green-600">
                  {isLoading ? "..." : formatPercent(stats?.kpis?.customerRetention ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Hora de Pico</span>
                <span className="font-bold text-lg text-orange-600">
                  {isLoading ? "..." : stats?.kpis?.peakHour}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pagamento Preferido</span>
                <span className="font-bold text-lg text-blue-600">
                  {isLoading ? "..." : stats?.kpis?.topPaymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Alertas de estoque baixo */}
          {(stats?.lowStockProducts?.length ?? 0) > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-6">
              <h3 className="font-bold text-red-900 flex items-center gap-2 mb-4">
                <AlertCircle size={18} /> Estoque Baixo
              </h3>
              <div className="space-y-2">
                {stats?.lowStockProducts.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-red-800">{p.nome}</span>
                    <span className="font-bold text-red-600">{p.estoque} un.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
