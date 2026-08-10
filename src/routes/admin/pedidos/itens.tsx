import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/admin/pedidos/itens")({
  component: AdminPedidosItensPage,
});

function AdminPedidosItensPage() {
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["pedidos-por-item"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedido_itens")
        .select("*, produtos(nome, imagem_url), pedidos(created_at, status)")
        .order("created_at", { foreignTable: "pedidos", ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, { nome: string; imagem: string; quantidade: number; receita: number }>();
    data.forEach((item: any) => {
      const id = item.produto_id;
      const existing = map.get(id);
      if (existing) {
        existing.quantidade += item.quantidade;
        existing.receita += item.quantidade * item.preco_unitario;
      } else {
        map.set(id, {
          nome: item.produtos?.nome ?? "—",
          imagem: item.produtos?.imagem_url ?? "",
          quantidade: item.quantidade,
          receita: item.quantidade * item.preco_unitario,
        });
      }
    });
    return [...map.values()]
      .filter(i => i.nome.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [data, search]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Pedidos por Item</h1>
        <p className="text-gray-500 text-sm mt-1">Ranking de produtos mais pedidos.</p>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Buscar produto..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#5850ec]" size={32} /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Qtd. vendida</th>
                <th className="px-6 py-4">Receita gerada</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grouped.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-black text-gray-300 text-lg">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.imagem && <img src={item.imagem} className="h-10 w-10 rounded-lg object-cover border" alt="" />}
                      <span className="font-semibold text-gray-900">{item.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#5850ec]">{item.quantidade}×</td>
                  <td className="px-6 py-4 font-bold text-green-600">R$ {item.receita.toFixed(2).replace(".", ",")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
