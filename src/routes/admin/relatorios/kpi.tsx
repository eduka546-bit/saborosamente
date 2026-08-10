import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, DollarSign, Users, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { subDays, startOfMonth, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/admin/relatorios/kpi")({
  component: AdminRelatoriosKpiPage,
});

function AdminRelatoriosKpiPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["kpi-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("valor_total, created_at, status, user_id")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["kpi-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, created_at");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const curr30Start = subDays(now, 30).toISOString();
    const prev30Start = subDays(now, 60).toISOString();
    const monthStart = startOfMonth(now).toISOString();

    const notCancelled = orders.filter((o: any) => o.status !== "Cancelado");
    const curr = notCancelled.filter((o: any) => o.created_at >= curr30Start);
    const prev = notCancelled.filter((o: any) => o.created_at >= prev30Start && o.created_at < curr30Start);
    const thisMonth = notCancelled.filter((o: any) => o.created_at >= monthStart);

    const ticketMedio = curr.length ? curr.reduce((s: number, o: any) => s + (o.valor_total || 0), 0) / curr.length : 0;
    const prevTicket = prev.length ? prev.reduce((s: number, o: any) => s + (o.valor_total || 0), 0) / prev.length : 0;
    const ticketTrend = prevTicket > 0 ? ((ticketMedio - prevTicket) / prevTicket * 100) : 0;

    // Retenção: clientes que compraram mais de uma vez
    const clientOrderCount = new Map<string, number>();
    notCancelled.forEach((o: any) => {
      if (o.user_id) clientOrderCount.set(o.user_id, (clientOrderCount.get(o.user_id) || 0) + 1);
    });
    const retornantes = [...clientOrderCount.values()].filter(c => c > 1).length;
    const retencao = clientOrderCount.size > 0 ? (retornantes / clientOrderCount.size) * 100 : 0;

    const monthRevenue = thisMonth.reduce((s: number, o: any) => s + (o.valor_total || 0), 0);

    // Gráfico de vendas dos últimos 30 dias
    const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const salesChart = days.map(day => {
      const key = format(day, "yyyy-MM-dd");
      const dayOrders = notCancelled.filter((o: any) => format(new Date(o.created_at), "yyyy-MM-dd") === key);
      return {
        name: format(day, "dd/MM", { locale: ptBR }),
        vendas: dayOrders.reduce((s: number, o: any) => s + (o.valor_total || 0), 0),
        pedidos: dayOrders.length,
      };
    });

    return { ticketMedio, ticketTrend, retencao, monthRevenue, totalOrders: notCancelled.length, salesChart };
  }, [orders, clients]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">KPI e Indicadores</h1>
        <p className="text-gray-500 text-sm mt-1">Métricas reais baseadas nos pedidos do banco de dados.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ticket Médio (30d)</CardTitle>
                <DollarSign className="h-4 w-4 text-[#5850ec]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">R$ {stats.ticketMedio.toFixed(2).replace(".", ",")}</div>
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  {stats.ticketTrend >= 0 ? "+" : ""}{stats.ticketTrend.toFixed(1)}% vs 30d anteriores
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Taxa de Retenção</CardTitle>
                <Users className="h-4 w-4 text-[#5850ec]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats.retencao.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1 font-bold">Clientes com +1 compra</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receita do Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-[#5850ec]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">R$ {stats.monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1 font-bold">Pedidos não cancelados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total de Pedidos</CardTitle>
                <Package className="h-4 w-4 text-[#5850ec]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1 font-bold">Histórico completo</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="text-[#5850ec]" size={20} /> Receita Diária (30 dias)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.salesChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                    <Tooltip formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Receita"]} />
                    <Bar dataKey="vendas" fill="#5850ec" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="text-[#5850ec]" size={20} /> Pedidos por Dia (30 dias)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.salesChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="pedidos" stroke="#5850ec" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
