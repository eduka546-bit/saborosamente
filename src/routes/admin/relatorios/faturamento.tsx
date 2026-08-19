import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { format, eachMonthOfInterval, startOfYear, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/relatorios/faturamento")({
  component: AdminRelatoriosFaturamentoPage,
});

function AdminRelatoriosFaturamentoPage() {
  const [year, setYear] = useState(2024); // Valor determinístico para SSR
  const [mounted, setMounted] = useState(false);

  // Inicializa com ano atual após mount (evita hydration mismatch)
  useEffect(() => {
    setYear(new Date().getFullYear());
    setMounted(true);
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["relatorio-faturamento", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("valor_total, created_at, status")
        .gte("created_at", `${year}-01-01`)
        .lte("created_at", `${year}-12-31`)
        .neq("status", "Cancelado");
      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    const months = eachMonthOfInterval({ start: new Date(year, 0, 1), end: new Date(year, 11, 31) });
    return months.map(month => {
      const key = format(month, "yyyy-MM");
      const monthOrders = orders.filter((o: any) => o.created_at.startsWith(key));
      const receita = monthOrders.reduce((s: number, o: any) => s + (o.valor_total ?? 0), 0);
      return { name: format(month, "MMM", { locale: ptBR }), receita, pedidos: monthOrders.length };
    });
  }, [orders, year]);

  const total = orders.reduce((s: number, o: any) => s + (o.valor_total ?? 0), 0);

  const exportCSV = () => {
    const rows = chartData.map(d => `${d.name},${d.receita.toFixed(2)},${d.pedidos}`).join("\n");
    const blob = new Blob([`Mês,Receita,Pedidos\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `faturamento_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Faturamento e Evolução</h1>
          <p className="text-gray-500 text-sm mt-1">Receita mensal ao longo do ano.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-10 px-3 rounded-md border border-input bg-white text-sm font-bold">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2"><Download size={16} /> CSV</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <p className="text-xs font-bold uppercase text-gray-400">Total {year}</p>
        <p className="text-3xl font-black text-green-600">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <div className="bg-white rounded-xl border p-6">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Receita"]} />
                <Bar dataKey="receita" fill="#5850ec" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
