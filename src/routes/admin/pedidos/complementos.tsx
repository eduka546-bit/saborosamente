import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/admin/pedidos/complementos")({
  component: AdminPedidosComplementosPage,
});

function AdminPedidosComplementosPage() {
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["pedidos-complementos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedido_itens")
        .select("complementos_selecionados, quantidade, pedidos(created_at)")
        .not("complementos_selecionados", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((item: any) => {
      const comps = item.complementos_selecionados;
      if (!Array.isArray(comps)) return;
      comps.forEach((c: any) => {
        const nome = typeof c === "string" ? c : c?.nome ?? JSON.stringify(c);
        map.set(nome, (map.get(nome) ?? 0) + (item.quantidade ?? 1));
      });
    });
    return [...map.entries()]
      .filter(([nome]) => nome.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .map(([nome, qtd]) => ({ nome, qtd }));
  }, [data, search]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Pedidos por Complemento</h1>
        <p className="text-gray-500 text-sm mt-1">Complementos mais escolhidos pelos clientes.</p>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Buscar complemento..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-16 text-center text-gray-400">Nenhum complemento registrado ainda.</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Complemento</th>
                <th className="px-6 py-4">Vezes solicitado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grouped.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-black text-gray-300 text-lg">{idx + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{item.nome}</td>
                  <td className="px-6 py-4 font-bold text-[#5850ec]">{item.qtd}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
