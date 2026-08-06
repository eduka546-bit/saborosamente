import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/products";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts, getCategories } from "@/lib/products.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/catalogo")({
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
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => getPublicProducts(),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const visible = useMemo(() => {
    if (selectedCategory === "Todas") return products;
    return products.filter((p: any) => p.categorias?.nome === selectedCategory);
  }, [selectedCategory, products]);

  const categoryList = ["Todas", ...categories.map((c: any) => c.nome)];

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold md:text-5xl">Nosso catálogo</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Todas as marmitas são preparadas na semana, porcionadas e congeladas individualmente.
      </p>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
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