import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Filter, Loader2, Utensils } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getAdminProducts } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getAdminProducts(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categorias").select("*").order("ordem");
      return data || [];
    },
  });

  const filteredProducts = products.filter((p: any) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categorias?.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group products by category
  const groupedProducts = categories.map((cat: any) => ({
    category: cat,
    products: filteredProducts.filter((p: any) => p.categoria_id === cat.id)
  })).filter((group: any) => group.products.length > 0);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Cardápio</h1>
        </div>
        <Button className="bg-[#086e45] hover:bg-[#086e45]/90 flex items-center gap-2 rounded-md px-4 h-10 text-xs font-bold uppercase tracking-wider">
          <Plus size={18} />
          Cadastrar novo
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Buscar por nome ou categoria..." 
              className="pl-10 rounded-lg border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button variant="outline" className="flex items-center gap-2 flex-1 md:flex-initial rounded-lg border-gray-200">
              <Filter size={18} />
              Filtros
            </Button>
            <div className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-gray-100 px-3 py-1.5 rounded-md">
              {filteredProducts.length} produtos
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <span className="text-muted-foreground font-medium">Carregando seu cardápio...</span>
        </div>
      ) : groupedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center">
          <Utensils className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-muted-foreground font-medium">Nenhum produto encontrado para sua busca.</p>
        </div>
      ) : (
        <div className="space-y-10 pb-20">
          {groupedProducts.map(({ category, products }: any) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 md:px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                  {category.nome}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Status</span>
                    <div className="flex items-center bg-white border border-gray-200 rounded px-2 py-0.5">
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Ativo</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <span className="font-bold text-gray-400 text-lg">⋮</span>
                  </Button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-50">
                {products.map((product: any) => (
                  <div key={product.id} className="group flex items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="cursor-grab text-gray-300 hover:text-gray-400 transition-colors">
                        <span className="text-lg">☰</span>
                      </div>
                      <div className="h-12 w-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                        <img 
                          src={product.imagem_url} 
                          alt={product.nome} 
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {product.nome}
                        </h3>
                        {product.peso && (
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                            {product.peso}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white shadow-inner">
                        <span className="text-xs font-medium text-gray-400">R$</span>
                        <input 
                          type="text" 
                          defaultValue={product.preco.toFixed(2).replace('.', ',')}
                          className="w-16 text-sm font-bold text-gray-700 outline-none text-right bg-transparent"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors">
                          Pausado
                        </button>
                        <button className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-500 text-white rounded-md shadow-sm">
                          Ativo
                        </button>
                      </div>

                      <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-primary rounded-full">
                        <span className="font-bold text-lg">⋮</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                <button className="flex items-center gap-2 text-[10px] font-bold text-teal-500 hover:text-teal-600 transition-colors uppercase tracking-widest">
                  <Plus size={14} strokeWidth={3} />
                  Adicionar novo item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
