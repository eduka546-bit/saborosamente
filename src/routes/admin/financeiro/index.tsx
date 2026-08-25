import { createFileRoute } from "@tanstack/react-router";
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUpRight,
  FileText,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  format,
  subDays,
  startOfMonth,
  startOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/financeiro/")({
  component: AdminFinanceiroIndex,
  ssr: false,
});

function AdminFinanceiroIndex() {
  const [period, setPeriod] = useState<"Semanal" | "Mensal" | "Anual">("Mensal");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["financeiro-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("valor_total, taxa_entrega, desconto_aplicado, created_at, status")
        .neq("status", "cancelado")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { chartData, totals } = useMemo(() => {
    const now = new Date();
    let intervals: Date[] = [];
    let fmt = "dd/MM";

    if (period === "Semanal") {
      intervals = eachDayOfInterval({ start: subDays(now, 6), end: now });
    } else if (period === "Mensal") {
      intervals = eachDayOfInterval({ start: startOfMonth(now), end: now });
    } else {
      intervals = eachMonthOfInterval({ start: startOfYear(now), end: now });
      fmt = "MMM";
    }

    const chartData = intervals.map((date) => {
      const key = period === "Anual" ? format(date, "yyyy-MM") : format(date, "yyyy-MM-dd");
      const dayOrders = orders.filter((o: any) => {
        const oDate =
          period === "Anual"
            ? format(new Date(o.created_at), "yyyy-MM")
            : format(new Date(o.created_at), "yyyy-MM-dd");
        return oDate === key;
      });
      const receita = dayOrders.reduce((s: number, o: any) => s + (o.valor_total || 0), 0);
      return { name: format(date, fmt, { locale: ptBR }), receita };
    });

    const now30 = subDays(now, 30).toISOString();
    const prev30 = subDays(now, 60).toISOString();
    const currOrders = orders.filter((o: any) => o.created_at >= now30);
    const prevOrders = orders.filter((o: any) => o.created_at >= prev30 && o.created_at < now30);
    const receita = currOrders.reduce((s: number, o: any) => s + (o.valor_total || 0), 0);
    const prevReceita = prevOrders.reduce((s: number, o: any) => s + (o.valor_total || 0), 0);
    const desconto = currOrders.reduce((s: number, o: any) => s + (o.desconto_aplicado || 0), 0);
    const pct = prevReceita > 0 ? ((receita - prevReceita) / prevReceita) * 100 : 0;

    return { chartData, totals: { receita, desconto, pct } };
  }, [orders, period]);

  const exportCSV = () => {
    const headers = "Data,Receita,Pedidos\n";
    const rows = chartData.map((d) => `${d.name},${d.receita},`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${period.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fluxo de receitas baseado nos pedidos concluídos.
          </p>
        </div>
        <Button onClick={exportCSV} className="flex items-center gap-2 bg-[#5850ec] text-white">
          <Download size={18} /> Exportar CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-green-100 bg-green-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Receita (30 dias)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-green-700">
                  R$ {totals.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1 font-bold">
                  <ArrowUpRight size={14} />
                  {totals.pct >= 0 ? "+" : ""}
                  {totals.pct.toFixed(1)}% vs 30 dias anteriores
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-100 bg-orange-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Descontos (30 dias)
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-orange-700">
                  R$ {totals.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-400 mt-1">Cupons e promoções aplicados</p>
              </CardContent>
            </Card>
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Pedidos (30 dias)
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-blue-700">
                  {
                    orders.filter((o: any) => new Date(o.created_at) >= subDays(new Date(), 30))
                      .length
                  }
                </div>
                <p className="text-xs text-gray-400 mt-1">Pedidos não cancelados</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-[#5850ec]" size={20} /> Receita por período
              </h3>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {(["Semanal", "Mensal", "Anual"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${period === p ? "bg-white shadow-sm text-[#5850ec]" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Receita"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReceita)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
