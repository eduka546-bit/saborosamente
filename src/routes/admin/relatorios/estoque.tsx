import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/relatorios/estoque")({
  component: AdminRelatoriosEstoquePage,
});

function EstoqueCell({ valor, minimo }: { valor: number; minimo: number }) {
  const urgente = valor === 0;
  const baixo = !urgente && valor <= minimo;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold text-sm",
        urgente && "text-red-600",
        baixo && "text-yellow-600",
        !urgente && !baixo && "text-gray-900",
      )}
    >
      {valor}
      {urgente && <span title="Sem estoque">❌</span>}
      {baixo && <span title="Estoque baixo">⚠️</span>}
    </span>
  );
}

function AdminRelatoriosEstoquePage() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["relatorio-estoque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id, nome, imagem_url, estoque_200g, estoque_300g, estoque_400g, estoque_minimo, controle_estoque, status, categorias(nome)",
        )
        .eq("controle_estoque", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Contadores
  const comProblema = products.filter((p: any) => {
    const min = p.estoque_minimo ?? 5;
    return (
      (p.estoque_200g ?? 0) <= min ||
      (p.estoque_300g ?? 0) <= min ||
      (p.estoque_400g ?? 0) <= min
    );
  });
  const semEstoque = products.filter((p: any) =>
    (p.estoque_200g ?? 0) === 0 || (p.estoque_300g ?? 0) === 0 || (p.estoque_400g ?? 0) === 0,
  );

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Estoque por Tamanho</h1>
        <p className="text-gray-500 text-sm mt-1">
          Produtos com controle de estoque ativo. ⚠️ = baixo, ❌ = sem estoque.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-bold uppercase text-gray-400">Monitorados</p>
          <p className="text-3xl font-black text-[#5850ec] mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 border-yellow-200 bg-yellow-50">
          <p className="text-xs font-bold uppercase text-yellow-600">Com alerta</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">{comProblema.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 border-red-200 bg-red-50">
          <p className="text-xs font-bold uppercase text-red-500">Algum tamanho zerado</p>
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
        <div className="bg-white rounded-xl border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-center">200g</th>
                <th className="px-4 py-3 text-center">300g</th>
                <th className="px-4 py-3 text-center">400g</th>
                <th className="px-4 py-3 text-center">Mín</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p: any) => {
                const min = p.estoque_minimo ?? 5;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.imagem_url && (
                          <img
                            src={p.imagem_url}
                            className="h-7 w-7 rounded object-cover border"
                            alt=""
                          />
                        )}
                        <span className="font-semibold text-gray-900 text-xs">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.categorias?.nome ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <EstoqueCell valor={p.estoque_200g ?? 0} minimo={min} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EstoqueCell valor={p.estoque_300g ?? 0} minimo={min} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EstoqueCell valor={p.estoque_400g ?? 0} minimo={min} />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{min}</td>
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
