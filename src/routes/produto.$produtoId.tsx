import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/lib/products.functions";
import { ProductDetailModal } from "@/components/product-detail-modal";

export const Route = createFileRoute("/produto/$produtoId")({
  component: ProdutoPage,
  head: ({ params }) => ({
    meta: [
      { title: "Produto | SaborosaMente" },
      { name: "description", content: "Veja detalhes, tamanhos e informações nutricionais deste produto SaborosaMente." },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: `https://saborosamente.vercel.app/produto/${params.produtoId}` }],
  }),
});

function ProdutoPage() {
  const { produtoId } = Route.useParams();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products-all"],
    queryFn: () => getPublicProducts(),
    staleTime: 1000 * 60 * 30,
  });

  const product = (products as any[]).find((item) => item.id === produtoId);

  if (isLoading) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Carregando produto...</p>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-black">Produto não encontrado</h1>
        <button
          type="button"
          onClick={() => navigate({ to: "/", hash: "cardapio" })}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          Voltar ao cardápio
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] px-4 py-16">
      <ProductDetailModal
        isOpen
        onClose={() => navigate({ to: "/", hash: "cardapio" })}
        product={product}
        allProducts={products}
      />
    </section>
  );
}
