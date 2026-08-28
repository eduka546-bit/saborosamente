import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/relatorios/vendas")({
  component: AdminRelatoriosVendasPage,
  ssr: false,
});

function AdminRelatoriosVendasPage() {
  const [filtroOrigem, setFiltroOrigem] = useState<"todos" | "site" | "pdv">("todos");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["relatorio-vendas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("valor_total, created_at, status, metodo_pagamento, origem")
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = useMemo(() => {
    if (filtroOrigem === "todos") return orders;
    return orders.filter((o: any) => (o.origem ?? "site") === filtroOrigem);
  }, [orders, filtroOrigem]);

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const dayOrders = filteredOrders.filter(
        (o: any) => o.created_at.startsWith(key) && o.status !== "cancelado",
      );
      return {
        name: format(day, "dd/MM", { locale: ptBR }),
        pedidos: dayOrders.length,
        receita: dayOrders.reduce((s: number, o: any) => s + (o.valor_total ?? 0), 0),
      };
    });
  }, [filteredOrders]);

  const byPayment = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders
      .filter((o: any) => o.status !== "cancelado")
      .forEach((o: any) => {
        const key = o.metodo_pagamento ?? "Não informado";
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredOrders]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Pedidos e Vendas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Evolução de pedidos e receita nos últimos 30 dias.
        </p>
        <div className="flex gap-2 mt-3">
          {(["todos", "site", "pdv"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFiltroOrigem(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filtroOrigem === opt
                  ? "bg-[#5850ec] text-white border-[#5850ec]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#5850ec]/40"
              }`}
            >
              {opt === "todos" ? "Todos" : opt === "site" ? "Site" : "PDV"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-gray-800 mb-4">Pedidos e Receita (30 dias)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => `R$${v}`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="pedidos"
                    stroke="#5850ec"
                    strokeWidth={2}
                    dot={false}
                    name="Pedidos"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="receita"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Receita (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-gray-800 mb-4">Métodos de Pagamento</h3>
            <div className="space-y-3">
              {byPayment.map(([method, count]) => (
                <div key={method} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-40 truncate">{method}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#5850ec] h-2 rounded-full"
                      style={{ width: `${Math.min((count / orders.length) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-600 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
