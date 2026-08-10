import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: AdminAvaliacoesPage,
});

function AdminAvaliacoesPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["avaliacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*, pedidos(nome_cliente, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const media = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((s: number, a: any) => s + (a.nota ?? 0), 0) / data.length;
  }, [data]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Avaliações</h1>
        <p className="text-gray-500 text-sm mt-1">Média mensal e histórico de avaliações dos clientes.</p>
      </div>

      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-20 text-center">
          <Star size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Nenhuma avaliação registrada ainda.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border p-6 mb-6 flex items-center gap-6">
            <div className="text-5xl font-black text-[#5850ec]">{media.toFixed(1)}</div>
            <div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={20} className={n <= Math.round(media) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{data.length} avaliações</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.map((av: any) => (
              <div key={av.id} className="bg-white rounded-xl border p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec] font-black shrink-0">
                  {av.pedidos?.nome_cliente?.[0] ?? "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-sm text-gray-900">{av.pedidos?.nome_cliente ?? "Cliente"}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={14} className={n <= (av.nota ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  {av.comentario && <p className="text-sm text-gray-600 italic">"{av.comentario}"</p>}
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(av.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
