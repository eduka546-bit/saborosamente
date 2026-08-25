import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, eachMonthOfInterval, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/relatorios/clientes")({
  component: AdminRelatoriosClientesPage,
  ssr: false,
});

function AdminRelatoriosClientesPage() {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["relatorio-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, created_at")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["relatorio-clientes-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("user_id, valor_total, status")
        .neq("status", "cancelado");
      if (error) throw error;
      return data;
    },
  });

  const monthlyGrowth = useMemo(() => {
    const months = eachMonthOfInterval({ start: startOfYear(new Date()), end: new Date() });
    return months.map((month) => {
      const key = format(month, "yyyy-MM");
      const count = profiles.filter((p: any) => p.created_at?.startsWith(key)).length;
      return { name: format(month, "MMM", { locale: ptBR }), novos: count };
    });
  }, [profiles]);

  const topClients = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; pedidos: number }>();
    orders.forEach((o: any) => {
      if (!o.user_id) return;
      const existing = map.get(o.user_id);
      const prof = profiles.find((p: any) => p.id === o.user_id);
      if (existing) {
        existing.total += o.valor_total ?? 0;
        existing.pedidos += 1;
      } else map.set(o.user_id, { nome: prof?.nome ?? "—", total: o.valor_total ?? 0, pedidos: 1 });
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [orders, profiles]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Relatório de Clientes</h1>
        <p className="text-gray-500 text-sm mt-1">Crescimento da base e top clientes.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Total de Clientes</p>
              <p className="text-3xl font-black text-[#5850ec] mt-1">{profiles.length}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Novos este mês</p>
              <p className="text-3xl font-black text-green-600 mt-1">
                {monthlyGrowth[monthlyGrowth.length - 1]?.novos ?? 0}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-gray-800 mb-4">
              Novos clientes por mês ({new Date().getFullYear()})
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="novos" fill="#5850ec" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-bold text-gray-800">Top 10 Clientes por Receita</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Pedidos</th>
                  <th className="px-6 py-3">Total gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topClients.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-black text-gray-300">{i + 1}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{c.nome}</td>
                    <td className="px-6 py-3 text-[#5850ec] font-bold">{c.pedidos}</td>
                    <td className="px-6 py-3 text-green-600 font-bold">R$ {c.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
