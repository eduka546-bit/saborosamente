import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { CATEGORIES, products, type ProductCategory } from "@/lib/products";

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

type Filter = ProductCategory | "Todas";

function Catalogo() {
  const [filter, setFilter] = useState<Filter>("Todas");

  const visible = useMemo(
    () => (filter === "Todas" ? products : products.filter((p) => p.categoria === filter)),
    [filter],
  );

  const filters: Filter[] = ["Todas", ...CATEGORIES];

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold md:text-5xl">Nosso catálogo</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Todas as marmitas são preparadas na semana, porcionadas e congeladas individualmente.
      </p>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-primary",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-12 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma marmita nesta categoria por enquanto.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}