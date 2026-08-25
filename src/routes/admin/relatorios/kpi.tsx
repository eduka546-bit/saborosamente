import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { subDays, startOfMonth, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/relatorios/kpi")({
  component: AdminRelatoriosKpiPage,
  ssr: false,
});

function AdminRelatoriosKpiPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["kpi-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          "id, valor_total, taxa_entrega, created_at, status, user_id, endereco_cidade, endereco_bairro",
        )
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

  const { data: itens = [] } = useQuery({
    queryKey: ["kpi-itens"],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date()).toISOString();
      const { data } = await supabase
        .from("pedido_itens")
        .select("quantidade, produto_id, preco_unitario, produtos:produto_id(nome)")
        .gte("created_at", monthStart);
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const curr30Start = subDays(now, 30).toISOString();
    const prev30Start = subDays(now, 60).toISOString();
    const monthStart = startOfMonth(now).toISOString();

    const notCancelled = orders.filter((o: any) => o.status !== "cancelado");
    const curr = notCancelled.filter((o: any) => o.created_at >= curr30Start);
    const prev = notCancelled.filter(
      (o: any) => o.created_at >= prev30Start && o.created_at < curr30Start,
    );
    const thisMonth = notCancelled.filter((o: any) => o.created_at >= monthStart);

    const ticketMedio = curr.length
      ? curr.reduce((s: number, o: any) => s + (o.valor_total || 0), 0) / curr.length
      : 0;
    const prevTicket = prev.length
      ? prev.reduce((s: number, o: any) => s + (o.valor_total || 0), 0) / prev.length
      : 0;
    const ticketTrend = prevTicket > 0 ? ((ticketMedio - prevTicket) / prevTicket) * 100 : 0;

    // Retenção: clientes que compraram mais de uma vez
    const clientOrderCount = new Map<string, number>();
    notCancelled.forEach((o: any) => {
      if (o.user_id) clientOrderCount.set(o.user_id, (clientOrderCount.get(o.user_id) || 0) + 1);
    });
    const retornantes = [...clientOrderCount.values()].filter((c) => c > 1).length;
    const retencao = clientOrderCount.size > 0 ? (retornantes / clientOrderCount.size) * 100 : 0;

    const monthRevenue = thisMonth.reduce((s: number, o: any) => s + (o.valor_total || 0), 0);

    // Gráfico de vendas dos últimos 30 dias
    const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const salesChart = days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const dayOrders = notCancelled.filter(
        (o: any) => format(new Date(o.created_at), "yyyy-MM-dd") === key,
      );
      return {
        name: format(day, "dd/MM", { locale: ptBR }),
        vendas: dayOrders.reduce((s: number, o: any) => s + (o.valor_total || 0), 0),
        pedidos: dayOrders.length,
      };
    });

    // Top produtos do mês
    const prodMap: Record<string, { nome: string; qty: number; receita: number }> = {};
    (itens as any[]).forEach((item: any) => {
      const id = item.produto_id;
      if (!id) return;
      if (!prodMap[id])
        prodMap[id] = { nome: item.produtos?.nome ?? "Produto", qty: 0, receita: 0 };
      prodMap[id].qty += item.quantidade ?? 1;
      prodMap[id].receita += (item.preco_unitario ?? 0) * (item.quantidade ?? 1);
    });
    const topProdutos = Object.values(prodMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    // Receita por cidade no mês
    const cidadeMap: Record<string, number> = {};
    thisMonth.forEach((o: any) => {
      if (o.endereco_cidade) {
        cidadeMap[o.endereco_cidade] = (cidadeMap[o.endereco_cidade] || 0) + (o.valor_total || 0);
      }
    });
    const receitaCidade = Object.entries(cidadeMap)
      .map(([cidade, receita]) => ({ cidade, receita }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 8);

    return {
      ticketMedio,
      ticketTrend,
      retencao,
      monthRevenue,
      totalOrders: notCancelled.length,
      salesChart,
      topProdutos,
      receitaCidade,
    };
  }, [orders, clients, itens]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">KPI e Indicadores</h1>
        <p className="text-gray-500 text-sm mt-1">
          Métricas reais baseadas nos pedidos do banco de dados.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Ticket Médio (30d)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-[#5850ec]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">
                  R$ {stats.ticketMedio.toFixed(2).replace(".", ",")}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  {stats.ticketTrend >= 0 ? "+" : ""}
                  {stats.ticketTrend.toFixed(1)}% vs 30d anteriores
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Taxa de Retenção
                </CardTitle>
                <Users className="h-4 w-4 text-[#5850ec]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats.retencao.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  Clientes com +1 compra
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Receita do Mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-[#5850ec]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">
                  R$ {stats.monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-bold">
                  Pedidos não cancelados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Total de Pedidos
                </CardTitle>
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
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
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
                    <Line
                      type="monotone"
                      dataKey="pedidos"
                      stroke="#5850ec"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top produtos do mês + Receita por cidade */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Top produtos */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="text-yellow-500" size={18} /> Top Produtos do Mês
              </h3>
              {stats.topProdutos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum dado ainda</p>
              ) : (
                <div className="space-y-3">
                  {stats.topProdutos.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">{p.nome}</p>
                          <span className="text-xs font-bold text-gray-500 shrink-0 ml-2">
                            {p.qty}x
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#5850ec] rounded-full"
                            style={{
                              width: `${(p.qty / (stats.topProdutos[0]?.qty || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-600 shrink-0">
                        R$ {p.receita.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Receita por cidade */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-[#5850ec]" size={18} /> Receita por Cidade (mês)
              </h3>
              {stats.receitaCidade.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum dado ainda</p>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.receitaCidade} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `R$${v}`}
                      />
                      <YAxis type="category" dataKey="cidade" tick={{ fontSize: 10 }} width={90} />
                      <Tooltip formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Receita"]} />
                      <Bar dataKey="receita" fill="#00a884" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
