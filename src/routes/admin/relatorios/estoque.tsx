import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/relatorios/estoque")({
  component: AdminRelatoriosEstoquePage,
});

function AdminRelatoriosEstoquePage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["relatorio-estoque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id, nome, imagem_url, estoque_atual, estoque_minimo, controle_estoque, status, categorias(nome)",
        )
        .eq("controle_estoque", true)
        .order("estoque_atual");
      if (error) throw error;
      return data;
    },
  });

  const baixoEstoque = products.filter(
    (p: any) => (p.estoque_atual ?? 0) <= (p.estoque_minimo ?? 5),
  );
  const semEstoque = products.filter((p: any) => (p.estoque_atual ?? 0) === 0);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Estoque e Produção</h1>
        <p className="text-gray-500 text-sm mt-1">Produtos com controle de estoque ativo.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-bold uppercase text-gray-400">Com estoque</p>
          <p className="text-3xl font-black text-[#5850ec] mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 border-yellow-200 bg-yellow-50">
          <p className="text-xs font-bold uppercase text-yellow-600">Estoque baixo</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">{baixoEstoque.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 border-red-200 bg-red-50">
          <p className="text-xs font-bold uppercase text-red-500">Sem estoque</p>
          <p className="text-3xl font-black text-red-500 mt-1">{semEstoque.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-20 text-center">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Nenhum produto com controle de estoque ativo.</p>
          <p className="text-xs text-gray-400 mt-1">
            Ative o controle de estoque em Cardápio → editar produto.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Estoque atual</th>
                <th className="px-6 py-4">Mínimo</th>
                <th className="px-6 py-4">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p: any) => {
                const atual = p.estoque_atual ?? 0;
                const minimo = p.estoque_minimo ?? 5;
                const situacao = atual === 0 ? "sem" : atual <= minimo ? "baixo" : "ok";
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.imagem_url && (
                          <img
                            src={p.imagem_url}
                            className="h-8 w-8 rounded object-cover border"
                            alt=""
                          />
                        )}
                        <span className="font-semibold text-gray-900">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.categorias?.nome ?? "—"}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{atual}</td>
                    <td className="px-6 py-4 text-gray-400">{minimo}</td>
                    <td className="px-6 py-4">
                      {situacao === "sem" && (
                        <Badge className="bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                          <AlertTriangle size={11} /> Sem estoque
                        </Badge>
                      )}
                      {situacao === "baixo" && (
                        <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit">
                          <AlertTriangle size={11} /> Estoque baixo
                        </Badge>
                      )}
                      {situacao === "ok" && (
                        <Badge className="bg-green-100 text-green-700 w-fit">Normal</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
