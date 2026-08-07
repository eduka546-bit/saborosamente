import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { DiscountProgressWidget } from "@/components/discount-progress-widget";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/products";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts, getCategories } from "@/lib/products.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, unknown>) => {
    return z.object({
      q: z.string().optional().catch(""),
    }).parse(search);
  },
  head: () => ({
    meta: [
      { title: "Catálogo de Marmitas Congeladas | Saborosamente" },
      {
        name: "description",
        content:
          "Conheça todas as marmitas congeladas da Saborosamente: fitness, tradicionais, vegetarianas e low carb, com ingredientes e preços.",
      },
      { property: "og:title", content: "Catálogo de Marmitas | Saborosamente" },
      {
        property: "og:description",
        content: "Fitness, tradicional, vegetariana ou low carb: escolha suas marmitas congeladas.",
      },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const { q } = Route.useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => getPublicProducts(),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const activeCategories = useMemo(() => {
    if (!products.length) return ["Todas"];
    
    const categoriesWithProducts = new Set<string>();
    products.forEach((p: any) => {
      if (p.categorias?.nome) {
        categoriesWithProducts.add(p.categorias.nome);
      }
    });

    return ["Todas", ...categories.map((c: any) => c.nome).filter(name => categoriesWithProducts.has(name))];
  }, [products, categories]);

  const visible = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory !== "Todas") {
      filtered = filtered.filter((p: any) => p.categorias?.nome === selectedCategory);
    }
    
    if (q) {
      const search = q.toLowerCase();
      filtered = filtered.filter((p: any) => 
        p.nome?.toLowerCase().includes(search) || 
        p.descricao?.toLowerCase().includes(search) ||
        p.categorias?.nome?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [selectedCategory, products, q]);

  const categoryList = activeCategories;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold md:text-5xl">Nosso catálogo</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        {q ? (
          <span>Mostrando resultados para: <strong className="text-primary">"{q}"</strong></span>
        ) : (
          "Todas as marmitas são preparadas na semana, porcionadas e congeladas individualmente."
        )}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px] items-start">
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
            {categoryList.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={selectedCategory === f}
                onClick={() => setSelectedCategory(f)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selectedCategory === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-primary",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:block sticky top-24">
          <DiscountProgressWidget />
        </div>
      </div>

      <div className="lg:hidden mt-6">
        <DiscountProgressWidget />
      </div>

      {productsLoading ? (
        <div className="mt-20 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-muted-foreground">Carregando cardápio completo...</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-12 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma marmita nesta categoria por enquanto.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product: any) => (
            <ProductCard 
              key={product.id} 
              product={{
                ...product,
                categoria: product.categorias?.nome || "Sem categoria",
                imagem: product.imagem_url
              }} 
            />
          ))}
        </div>
      )}
    </section>
  );
}