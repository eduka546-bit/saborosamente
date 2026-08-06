import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Loader2, Truck, MapPin, Calendar } from "lucide-react";
import bannerCarouselAsset from "@/assets/banner-carousel.png.asset.json";
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

const infoCards = [
  {
    icon: MapPin,
    titulo: "Taxa de entrega",
    subtitulo: "A partir de R$ 8,90",
    cor: "text-[#086e45]"
  },
  {
    icon: Truck,
    titulo: "Formas de entrega",
    subtitulo: "Delivery ou Retirada",
    cor: "text-[#086e45]"
  },
  {
    icon: Calendar,
    titulo: "Funcionamento",
    subtitulo: "Encomendas podem ser feitas em tempo integral!",
    cor: "text-[#086e45]"
  }
];

function Index() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products-featured"],
    queryFn: () => getPublicProducts(),
  });

  const displayProducts = products.filter((p: any) => p.destaque).slice(0, 3).length > 0 
    ? products.filter((p: any) => p.destaque).slice(0, 3) 
    : products.slice(0, 3);

  return (
    <>
      {/* Hero Info & Banners Section */}
      <section className="mx-auto max-w-7xl px-4 mt-8 md:mt-12 relative z-30 pb-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-6">
            {/* Info Card & Search */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center overflow-hidden">
              <div className="flex-1 flex w-full">
                {infoCards.map((card, i) => (
                  <div key={i} className="flex-1 p-4 md:p-6 flex flex-col justify-center border-r border-gray-50 last:border-r-0">
                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      {card.titulo}
                      {card.titulo === "Funcionamento" && <span className="size-1.5 rounded-full bg-green-500" />}
                    </h4>
                    <p className={cn("text-[11px] md:text-[12px] font-bold leading-tight", card.cor)}>
                      {card.subtitulo}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-4 md:py-0 flex items-center border-t md:border-t-0 md:border-l border-gray-50 w-full md:w-auto min-h-[60px]">
                 <div className="flex items-center gap-3 text-gray-300 w-full md:w-48 justify-end">
                   <span className="text-[11px] font-medium">Pesquisar...</span>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                     <circle cx="11" cy="11" r="8"></circle>
                     <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                   </svg>
                 </div>
              </div>
            </div>

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { img: bannerCarouselAsset.url, alt: "Marmitas" },
                { img: bannerCarouselAsset.url, alt: "Loja" },
                { img: bannerCarouselAsset.url, alt: "Entregas" }
              ].map((b, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-[4/5] relative group bg-white">
                  <img 
                    src={b.img} 
                    alt={b.alt} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 border-[8px] border-white/0 group-hover:border-white/10 transition-all pointer-events-none rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Filters + Products */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Menu de Categorias - Agora ao lado das Marmitas */}
          <div className="w-full md:w-72 space-y-2 shrink-0">
            <h1 className="text-sm font-black text-[#086e45] leading-tight uppercase tracking-tight mb-4">
              SaborosaMente - Atacado de Refeições e Sopas Congeladas
            </h1>
            <p className="text-[10px] text-[#086e45] font-medium leading-relaxed opacity-90 mb-6">
              Para o corpo e para a mente, SaborosaMente!
            </p>
            
            <div className="space-y-2">
              {[
                "Combos Prontos",
                "Combos Escolha Você Mesmo",
                "Linha Refeições (200g - 300g - 400g)",
                "Sopas (400g)",
                "Complementos de Proteínas 150g"
              ].map((cat) => (
                <button 
                  key={cat}
                  className="w-full text-left px-5 py-3 rounded-full bg-gray-50 text-gray-500 text-[11px] font-bold hover:bg-[#086e45]/10 hover:text-[#086e45] transition-all border border-transparent shadow-sm"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#086e45] uppercase tracking-tight">Mais pedidas da semana</h2>
                <p className="mt-1 text-xs text-muted-foreground font-medium">
                  As marmitas que saem primeiro do nosso freezer.
                </p>
              </div>
              <Link to="/catalogo" className="text-xs font-bold text-[#086e45] hover:underline uppercase tracking-wider">
                Ver todas as marmitas →
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-muted-foreground text-sm">Carregando sugestões...</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
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
