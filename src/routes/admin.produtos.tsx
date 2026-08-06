import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Filter, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getAdminProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getAdminProducts(),
  });

  const filteredProducts = products.filter((p: any) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categorias?.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Cardápio</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova produtos da sua loja.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
          <Plus size={18} />
          Novo Produto
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Buscar por nome ou categoria..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex items-center gap-2 flex-1 md:flex-initial">
              <Filter size={18} />
              Filtros
            </Button>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredProducts.length} produtos encontrados
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm font-semibold text-muted-foreground">
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4 text-center">Peso</th>
              <th className="px-6 py-4 text-right">Preço</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span className="text-muted-foreground">Carregando produtos...</span>
                  </div>
                </td>
              </tr>
            ) : filteredProducts.map((product: any) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={product.imagem_url} 
                      alt={product.nome} 
                      className="w-10 h-10 rounded-md object-cover bg-gray-100"
                    />
                    <div>
                      <div className="font-medium text-foreground">{product.nome}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                        {product.descricao}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-primary">
                    {product.categorias?.nome || "Sem categoria"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                  {product.peso || "-"}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-foreground">
                  {formatBRL(product.preco)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    product.status === "ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  )}>
                    {product.status || "Ativo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  Nenhum produto encontrado para sua busca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
