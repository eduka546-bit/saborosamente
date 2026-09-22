import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, ChevronRight, Star, ShoppingCart, ArrowLeft, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBRL, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { OptimizedImage } from "@/components/optimized-image";
import { isMarmita } from "@/lib/combo-rules";
import { ProductSeals } from "@/components/product-seals";
import { imgUrl } from "@/lib/image-proxy";
import { getPublicProducts } from "@/lib/products.functions";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/produto/$id")({
  loader: async ({ params }) => {
    const products = (await getPublicProducts()) as any[];
    const product = products.find((item) => item.id === params.id);
    return product
      ? {
          id: product.id,
          nome: product.nome,
          descricao: product.descricao,
          imagem: imgUrl(product.imagem_url || product.imagem),
        }
      : null;
  },
  component: ProdutoPage,
  head: ({ loaderData, params }) => {
    const product = loaderData as any;
    const title = product?.nome ? `${product.nome} | SaborosaMente` : "Produto | SaborosaMente";
    const description =
      product?.descricao ||
      "Marmita congelada artesanal SaborosaMente. Veja tamanhos, preço e informações nutricionais.";
    const image = product?.imagem || "https://saborosamente.vercel.app/icon-app.jpg";
    const url = `https://saborosamente.vercel.app/produto/${params.id}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
});

function ProdutoPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const { add, lines } = useCart();
  const [selectedWeight, setSelectedWeight] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [consumo, setConsumo] = useState<"congelada" | "pronta">("congelada");
  const [garfoEFaca, setGarfoEFaca] = useState(false);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["produto", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, categorias(nome, ordem_filtro)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!product?.id) return;
    trackEvent("product_view", { produtoId: product.id, metadata: { origem: "product_page" } });
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-muted-foreground">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="text-5xl">🔍</div>
          <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
          <p className="text-muted-foreground">O produto que você procura não existe.</p>
          <Link to="/" className="mt-4">
            <Button variant="default" className="gap-2">
              <ArrowLeft size={16} />
              Voltar para Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Determinar tamanhos disponíveis
  const weights = (() => {
    const hasSizes = product.preco_300g || product.preco_400g;
    if (hasSizes) {
      const sizes: string[] = ["200g"];
      if (product.preco_300g) sizes.push("300g");
      if (product.preco_400g) sizes.push("400g");
      if (!selectedWeight) setSelectedWeight(sizes.includes("300g") ? "300g" : sizes[0]);
      return sizes;
    }
    if (product.peso?.includes("-")) return product.peso.split("-").map((w: string) => w.trim());
    if (product.peso?.includes(",")) return product.peso.split(",").map((w: string) => w.trim());
    if (!selectedWeight && product.peso) setSelectedWeight(product.peso);
    return product.peso ? [product.peso] : [];
  })();

  // Rating
  const rating = product.rating ?? ((product.id as any) % 2 === 0 ? 5.0 : 4.9);

  // Imagens
  const allImages = [imgUrl(product.imagem_url)];
  if (product.imagens && Array.isArray(product.imagens)) {
    allImages.push(...product.imagens);
  }
  const currentImage = allImages[currentImageIndex];

  // Preço
  const isSopa = product.categorias?.nome?.toLowerCase().includes("sopa");
  const ehMarmita = isMarmita(product.nome, product.categorias?.nome || product.categoria);
  const currentStock = (() => {
    if (selectedWeight === "200g") return product.estoque_200g;
    if (selectedWeight === "300g") return product.estoque_300g;
    if (selectedWeight === "400g") return product.estoque_400g;
    return product.estoque ?? product.estoque_200g ?? null;
  })();
  const stockNumber =
    currentStock === null || currentStock === undefined || currentStock === ""
      ? null
      : Number(currentStock);
  const alreadyInCart = lines.reduce((sum, line) => {
    if (line.custom || line.comboPronto) return sum;
    return line.productId === product.id && line.weight === selectedWeight
      ? sum + Number(line.quantity || 0)
      : sum;
  }, 0);
  const remainingStock =
    stockNumber === null || !Number.isFinite(stockNumber) ? null : Math.max(0, stockNumber - alreadyInCart);
  const soldOut = remainingStock !== null && remainingStock <= 0;

  const currentPrice = isSopa
    ? 18.0
    : selectedWeight === "300g" && product.preco_300g
      ? product.preco_300g
      : selectedWeight === "400g" && product.preco_400g
        ? product.preco_400g
        : product.preco;

  // Nutricional
  const currentNutritional =
    selectedWeight === "300g" && product.tabela_nutricional_300g
      ? product.tabela_nutricional_300g
      : selectedWeight === "400g" && product.tabela_nutricional_400g
        ? product.tabela_nutricional_400g
        : product.tabela_nutricional;

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://saborosamente.vercel.app/produto/${product.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.nome, text: product.nome, url });
        trackEvent("product_share", { produtoId: product.id, metadata: { metodo: "native" } });
      } else {
        await navigator.clipboard.writeText(url);
        trackEvent("product_share", { produtoId: product.id, metadata: { metodo: "clipboard" } });
        toast.success("Link copiado!");
      }
    } catch {}
  };

  const handleAddToCart = () => {
    if (soldOut) {
      toast.info("Esta gramatura está esgotada.");
      return;
    }
    const opcoes = ehMarmita
      ? { consumo, garfoEFaca: consumo === "pronta" ? garfoEFaca : false }
      : undefined;
    add(product.id, 1, selectedWeight, opcoes);
    trackEvent("add_to_cart", {
      produtoId: product.id,
      valor: Number(currentPrice || 0),
      metadata: { gramatura: selectedWeight, origem: "product_page" },
    });
    toast.success("Adicionado ao carrinho!", {
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}`,
    });
  };

  const isComboPronto = product.categorias?.nome?.toLowerCase().includes("combo pronto");
  const weightLabel = (w: string) => {
    if (!isComboPronto) return w;
    if (w === "200g") return "P";
    if (w === "300g") return "M";
    if (w === "400g") return "G";
    return w;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/" className="hover:text-foreground transition-colors">
          Cardápio
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{product.nome}</span>
      </div>

      {/* Voltar */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="mb-6 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Galeria de Imagens */}
        <div className="space-y-4">
          {/* Imagem Principal */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
            <OptimizedImage
              src={currentImage}
              alt={product.nome}
              widths={[512, 1024]}
              priority={false}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Badge Categoria */}
            <Badge className="absolute left-4 top-4 bg-sun text-sun-foreground hover:bg-sun z-10">
              {product.categorias?.nome || "Marmita"}
            </Badge>

            <ProductSeals product={product} size={54} />

            {/* Navegação */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-all hover:bg-white hover:scale-110"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-all hover:bg-white hover:scale-110"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Indicadores */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "transition-all duration-300 rounded-full",
                        currentImageIndex === idx
                          ? "w-6 h-2 bg-white shadow-lg"
                          : "w-2 h-2 bg-white/40 hover:bg-white/60",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    currentImageIndex === idx
                      ? "border-primary shadow-md scale-105"
                      : "border-border/30 opacity-60 hover:opacity-100",
                  )}
                >
                  <OptimizedImage
                    src={img}
                    alt={`${product.nome} ${idx + 1}`}
                    widths={[100]}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div>
            <div className="mb-2 flex items-start justify-between gap-3">
              <h1 className="text-4xl font-bold text-foreground">{product.nome}</h1>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Compartilhar produto"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-primary transition hover:bg-primary/5"
              >
                <Share2 className="size-4" />
              </button>
            </div>

            {/* Rating + Categoria */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 transition-colors ${
                        i < Math.floor(rating)
                          ? "fill-sun text-sun"
                          : i < Math.ceil(rating) && rating % 1 !== 0
                            ? "fill-sun/50 text-sun"
                            : "text-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {product.categorias?.nome || "Marmita"}
              </span>
            </div>

            {/* Descrição */}
            {product.descricao && (
              <p className="text-muted-foreground leading-relaxed">{product.descricao}</p>
            )}
          </div>

          {/* Tamanhos */}
          {weights.length > 1 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
                Escolha o tamanho:
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {weights.map((w: string) => (
                  <button
                    key={w}
                    onClick={() => {
                      setSelectedWeight(w);
                      trackEvent("size_select", { produtoId: product.id, metadata: { gramatura: w, origem: "product_page" } });
                    }}
                    className={cn(
                      "rounded-xl border-2 py-4 text-sm font-bold transition-all",
                      selectedWeight === w
                        ? "border-primary bg-primary/5 text-primary shadow-md"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    {weightLabel(w)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opções (só marmitas): pronta/congelada + garfo e faca */}
          {ehMarmita && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">
                  Como você quer receber?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsumo("congelada")}
                    className={cn(
                      "rounded-xl border-2 py-4 text-sm font-bold transition-all",
                      consumo === "congelada"
                        ? "border-primary bg-primary/5 text-primary shadow-md"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    Congelada
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsumo("pronta")}
                    className={cn(
                      "rounded-xl border-2 py-4 text-sm font-bold transition-all",
                      consumo === "pronta"
                        ? "border-primary bg-primary/5 text-primary shadow-md"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    Pronta para consumo
                    <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">
                      +R$ 1,00
                    </span>
                  </button>
                </div>
              </div>

              {consumo === "pronta" && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-background p-3">
                  <input
                    type="checkbox"
                    checked={garfoEFaca}
                    onChange={(e) => setGarfoEFaca(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Quero garfo e faca
                    <span className="text-[10px] font-medium text-muted-foreground ml-1">
                      +R$ 1,00
                    </span>
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Tabela Nutricional */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Valor Nutricional
            </h3>
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-4">
              <div>
                {currentNutritional?.kcal ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calorias:</span>
                      <span className="font-bold text-primary">{currentNutritional.kcal} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Carboidratos:</span>
                      <span className="font-bold">{currentNutritional.carb}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proteína:</span>
                      <span className="font-bold">{currentNutritional.prot}g</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Consulte a embalagem para detalhes
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground mb-2">Informações</h4>
                <p className="text-xs text-muted-foreground">
                  {product.informacao_nutricional || "Sem Glúten | Sem Lactose"}
                </p>
              </div>
            </div>
          </div>

          {/* Preço e CTA */}
          <div className="space-y-4 border-t border-border/30 pt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Valor por {selectedWeight || "porção"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-black text-primary bg-gradient-brand bg-clip-text text-transparent">
                {formatBRL(currentPrice)}
              </span>
            </div>

            {remainingStock !== null && remainingStock > 0 && remainingStock <= 5 && (
              <p className="text-xs font-bold text-[#9a5b00]">
                {remainingStock === 1 ? "Última unidade disponível" : `Últimas ${remainingStock} unidades disponíveis`}
              </p>
            )}
            <Button
              onClick={handleAddToCart}
              disabled={soldOut}
              className="w-full h-14 rounded-xl text-lg font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="size-5" />
              {soldOut ? "Esgotado nesta gramatura" : "Adicionar ao Carrinho"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
