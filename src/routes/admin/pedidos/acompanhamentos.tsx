import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/pedidos/acompanhamentos")({
  component: AdminPedidosAcompanhamentosPage,
});

function AdminPedidosAcompanhamentosPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["pedidos-acompanhamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedido_itens")
        .select("observacao, quantidade, produtos(nome), pedidos(created_at, status)")
        .not("observacao", "is", null)
        .neq("observacao", "")
        .order("created_at", { foreignTable: "pedidos", ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Acompanhamentos Solicitados</h1>
        <p className="text-gray-500 text-sm mt-1">
          Observações e acompanhamentos pedidos pelos clientes.
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-16 text-center text-gray-400">
          Nenhuma observação registrada.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Observação / Acompanhamento</th>
                <th className="px-6 py-4">Qtd</th>
                <th className="px-6 py-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {item.produtos?.nome ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 italic">"{item.observacao}"</td>
                  <td className="px-6 py-4 text-[#5850ec] font-bold">{item.quantidade}×</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {item.pedidos?.created_at
                      ? new Date(item.pedidos.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
