import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Clock, MapPin, CreditCard } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/relatorios/inteligencia")({
  component: AdminRelatoriosInteligenciaPage,
});

function AdminRelatoriosInteligenciaPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["inteligencia-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("valor_total, created_at, status, endereco_bairro, endereco_cidade, metodo_pagamento")
        .neq("status", "cancelado");
      if (error) throw error;
      return data;
    },
  });

  const insights = useMemo(() => {
    if (!orders.length) return null;

    // Hora de pico
    const hourCounts = Array(24).fill(0);
    orders.forEach((o: any) => hourCounts[new Date(o.created_at).getHours()]++);
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Dia da semana mais movimentado
    const dayCounts = Array(7).fill(0);
    orders.forEach((o: any) => dayCounts[new Date(o.created_at).getDay()]++);
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
    const dayNames = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

    // Bairro mais atendido
    const bairroMap = new Map<string, number>();
    orders.forEach((o: any) => { if (o.endereco_bairro) bairroMap.set(o.endereco_bairro, (bairroMap.get(o.endereco_bairro) ?? 0) + 1); });
    const topBairro = [...bairroMap.entries()].sort((a, b) => b[1] - a[1])[0];

    // Pagamento mais usado
    const pagMap = new Map<string, number>();
    orders.forEach((o: any) => { const k = o.metodo_pagamento ?? "Não informado"; pagMap.set(k, (pagMap.get(k) ?? 0) + 1); });
    const topPag = [...pagMap.entries()].sort((a, b) => b[1] - a[1])[0];

    // Ticket médio
    const ticket = orders.reduce((s: number, o: any) => s + (o.valor_total ?? 0), 0) / orders.length;

    return { peakHour, peakDay: dayNames[peakDay], topBairro, topPag, ticket };
  }, [orders]);

  const cards = insights ? [
    { icon: Clock, label: "Hora de pico", value: `${insights.peakHour}h–${insights.peakHour + 1}h`, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: TrendingUp, label: "Dia mais movimentado", value: insights.peakDay, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: MapPin, label: "Bairro mais atendido", value: insights.topBairro?.[0] ?? "—", color: "text-green-600", bg: "bg-green-50" },
    { icon: CreditCard, label: "Pagamento preferido", value: insights.topPag?.[0] ?? "—", color: "text-orange-600", bg: "bg-orange-50" },
  ] : [];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Inteligência de Mercado</h1>
        <p className="text-gray-500 text-sm mt-1">Insights automáticos baseados nos dados reais dos pedidos.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : !insights ? (
        <div className="bg-white rounded-2xl border border-dashed p-20 text-center text-gray-400">Dados insuficientes para gerar insights.</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => (
              <div key={i} className={`rounded-xl border p-5 ${card.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <card.icon size={18} className={card.color} />
                  <p className="text-xs font-bold uppercase text-gray-500">{card.label}</p>
                </div>
                <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-bold text-gray-800 mb-4">Ticket Médio Global</h3>
            <p className="text-4xl font-black text-[#5850ec]">R$ {insights.ticket.toFixed(2).replace(".", ",")}</p>
            <p className="text-sm text-gray-400 mt-1">Baseado em {orders.length} pedidos não cancelados</p>
          </div>
        </div>
      )}
    </div>
  );
}
