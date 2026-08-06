import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Snowflake, Truck, Clock, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-marmitas.jpg";
import { ProductCard } from "@/components/product-card";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saborosamente | Marmitas Congeladas Feitas com Comida de Verdade" },
      {
        name: "description",
        content:
          "Marmitas congeladas artesanais, equilibradas e prontas em minutos. Monte seu combo e receba em casa com a Saborosamente.",
      },
      { property: "og:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      {
        property: "og:description",
        content: "Monte seu combo de marmitas congeladas e receba em casa. Comida de verdade, sem conservantes.",
      },
    ],
  }),
  component: Index,
});

const beneficios = [
  {
    icon: Leaf,
    titulo: "Comida de verdade",
    texto: "Ingredientes frescos, sem conservantes e sem excesso de sódio.",
  },
  {
    icon: Snowflake,
    titulo: "Congelamento rápido",
    texto: "Congelamos logo após o preparo para manter sabor e nutrientes.",
  },
  {
    icon: Clock,
    titulo: "Pronto em 6 minutos",
    texto: "Do freezer ao prato, sem sujeira e sem complicação.",
  },
  {
    icon: Truck,
    titulo: "Entrega refrigerada",
    texto: "Frete grátis nos pedidos acima de R$ 120.",
  },
];

function Index() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products-featured"],
    queryFn: () => getPublicProducts(),
  });

  const destaques = products.filter((p: any) => p.destaque).slice(0, 3);
  
  // Se não houver destaques marcados, pegar os primeiros 3
  const displayProducts = destaques.length > 0 ? destaques : products.slice(0, 3);

  return (
    <>
      <section className="pt-24 sm:pt-32 pb-12">
        {/* Espaçamento para o PFP centralizado que invade esta seção */}
      </section>



      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Mais pedidas da semana</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              As marmitas que saem primeiro do nosso freezer.
            </p>
          </div>
          <Link to="/catalogo" className="text-sm font-semibold text-primary hover:underline">
            Ver todas as marmitas →
          </Link>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-muted-foreground text-sm">Carregando sugestões...</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayProducts.map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    ...product,
                    categoria: product.categorias?.nome || "Marmita",
                    imagem: product.imagem_url
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-[2.5rem] bg-gradient-brand px-8 py-14 text-center text-primary-foreground shadow-lift">
          <h2 className="text-3xl font-bold md:text-4xl">Sua semana resolvida em um pedido</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-90 md:text-base">
            Monte um combo com 10 marmitas e ganhe frete grátis. Sem assinatura, sem fidelidade.
          </p>
          <Link
            to="/catalogo"
            className="mt-8 inline-flex items-center rounded-full bg-sun px-8 py-3 text-sm font-bold text-sun-foreground transition-transform hover:scale-[1.03]"
          >
            Montar meu combo
          </Link>
        </div>
      </section>
    </>
  );
}
