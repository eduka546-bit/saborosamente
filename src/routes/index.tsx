import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Loader2, Truck, MapPin, Calendar, ShoppingBag, Tag, Sparkles } from "lucide-react";
import bannerCarouselAsset from "@/assets/banner-carousel.png.asset.json";
import { ProductCard } from "@/components/product-card";
import { DiscountProgressWidget } from "@/components/discount-progress-widget";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { ComboBuilderModal } from "@/components/combo-builder-modal";
import { COMBO_RULES } from "@/lib/combo-rules";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://saborosamente.lovable.app/favicon.png" },
      { name: "twitter:image", content: "https://saborosamente.lovable.app/favicon.png" },
    ],
    links: [{ rel: "canonical", href: "https://saborosamente.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: "Saborosamente",
          servesCuisine: "Marmitas congeladas artesanais",
          url: "https://saborosamente.lovable.app/",
          image: "https://saborosamente.lovable.app/favicon.png",
          priceRange: "R$$",
          address: {
            "@type": "PostalAddress",
            addressCountry: "BR",
          },
        }),
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
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [comboModalOpen, setComboModalOpen] = useState(false);
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products-all"],
    queryFn: () => getPublicProducts(),
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const promoBanners: { image_url?: string; alt?: string; link?: string }[] =
    Array.isArray((settings as any)?.promo_banners) && (settings as any).promo_banners.length > 0
      ? (settings as any).promo_banners
      : [];


  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory !== "Todas") {
      result = result.filter((p: any) => p.categorias?.nome === selectedCategory);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter((p: any) => 
        p.nome?.toLowerCase().includes(search) || 
        p.descricao?.toLowerCase().includes(search) ||
        p.categorias?.nome?.toLowerCase().includes(search)
      );
    }
    // Remove combos do grid normal — eles ficam no banner dedicado
    return result.filter((p: any) => {
      const cat = (p.categorias?.nome || "").toLowerCase();
      const nome = (p.nome || "").toLowerCase();
      return !cat.includes("combo") && !nome.includes("monte você mesmo") && !nome.includes("monte voce mesmo");
    });
  }, [products, selectedCategory, searchTerm]);

  const categoriesWithProducts = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.categorias?.nome) {
        set.add(p.categorias.nome);
      }
    });
    // Order matters - we can use the default order or just alphabetically
    return ["Todas", ...Array.from(set).sort()];
  }, [products]);

  return (
    <>
      {/* Hero Info & Banners Section */}
      <section className="mx-auto max-w-5xl px-4 mt-8 md:mt-12 relative z-10 pb-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-6">
            {/* Info Card & Search */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center overflow-hidden">
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
                 <form 
                   onSubmit={(e) => {
                     e.preventDefault();
                     const formData = new FormData(e.currentTarget);
                     const q = formData.get("q") as string;
                     setSearchTerm(q || "");
                     document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
                   }}
                   className="flex items-center gap-3 text-gray-400 w-full md:w-48 justify-end group"
                 >
                    <input 
                      name="q"
                      type="text" 
                      placeholder="Pesquisar..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none text-[11px] font-medium w-full text-right placeholder:text-gray-300 focus:placeholder:text-gray-200"
                    />
                   <button type="submit" className="hover:scale-110 transition-transform">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-focus-within:opacity-80">
                       <circle cx="11" cy="11" r="8"></circle>
                       <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                     </svg>
                   </button>
                 </form>
              </div>
            </div>

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {promoBanners.filter((b) => b?.image_url).map((b, i) => {
                const content = (
                  <>
                    <img
                      src={b.image_url}
                      alt={b.alt || "Banner promocional Saborosamente"}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 border-[8px] border-white/0 group-hover:border-white/10 transition-all pointer-events-none rounded-2xl" />
                  </>
                );
                const cls = "rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-[4/5] relative group bg-white block";
                return b.link ? (
                  <a key={i} href={b.link} className={cls}>{content}</a>
                ) : (
                  <div key={i} className={cls}>{content}</div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Filters + Products */}
      <section id="cardapio" className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Menu de Categorias - Sticky */}
          <div className="w-full md:w-72 md:sticky md:top-24 space-y-2 shrink-0">
            <h1 className="text-sm font-black text-[#086e45] leading-tight uppercase tracking-tight mb-4">
              SaborosaMente - Atacado de Refeições e Sopas Congeladas
            </h1>
            <p className="text-[10px] text-[#086e45] font-medium leading-relaxed opacity-90 mb-6">
              Para o corpo e para a mente, SaborosaMente!
            </p>
            
            <DiscountProgressWidget className="mb-6" />
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="py-4 flex justify-center">
                  <Loader2 className="animate-spin text-[#086e45]/20" size={20} />
                </div>
              ) : (
                categoriesWithProducts.map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "w-full text-left px-5 py-3 rounded-full text-[11px] font-bold transition-all border shadow-sm",
                      selectedCategory === cat 
                        ? "bg-[#086e45] text-white border-[#086e45]"
                        : "bg-gray-50 text-gray-500 border-transparent hover:bg-[#086e45]/10 hover:text-[#086e45]"
                    )}
                  >
                    {cat}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#086e45] uppercase tracking-tight">
                  {searchTerm ? `Resultados para "${searchTerm}"` : selectedCategory === "Todas" ? "Nosso Cardápio" : selectedCategory}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground font-medium">
                  {searchTerm 
                    ? `Encontramos ${filteredProducts.length} opções.`
                    : selectedCategory === "Todas" 
                      ? "Escolha suas marmitas favoritas e monte seu combo."
                      : `Mostrando todas as opções em ${selectedCategory}.`}
                </p>
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="text-xs font-bold text-[#e76800] hover:underline uppercase tracking-wider"
                >
                  Limpar busca ×
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center py-20 gap-3">
                <Loader2 className="animate-spin text-[#086e45]" size={32} />
                <p className="text-muted-foreground text-sm font-medium">Carregando o cardápio...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-gray-50 rounded-[2rem] border border-dashed">
                <p className="text-muted-foreground text-sm">Nenhum produto encontrado nesta categoria.</p>
              </div>
            ) : (
              <>
                {/* ── Banner do Combo — aparece só em "Todas" e sem busca ── */}
                {selectedCategory === "Todas" && !searchTerm && (
                  <div
                    onClick={() => setComboModalOpen(true)}
                    className="cursor-pointer mb-8 rounded-[2rem] overflow-hidden relative group"
                    style={{
                      background: "linear-gradient(135deg, #086e45 0%, #0a9460 50%, #065a38 100%)",
                    }}
                  >
                    {/* Decoração de fundo */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full bg-white blur-3xl" />
                      <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white blur-2xl" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-8">
                      {/* Texto */}
                      <div className="text-white text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-3">
                          <Sparkles size={12} /> Desconto progressivo
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black leading-tight">
                          Monte seu Combo 🍱
                        </h2>
                        <p className="mt-2 text-white/80 text-sm md:text-base max-w-md">
                          Escolha suas marmitas favoritas e ganhe desconto automático quanto mais você montar.
                        </p>
                        {/* Tiers de desconto */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                          {COMBO_RULES.map(rule => (
                            <div key={rule.min} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                              <Tag size={11} className="text-yellow-300" />
                              <span className="text-xs font-black text-white">{rule.badge}</span>
                              <span className="text-[10px] text-white/70">a partir de {rule.min} itens</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setComboModalOpen(true); }}
                          className="flex items-center gap-2 bg-white text-[#086e45] font-black px-8 py-4 rounded-2xl text-base shadow-xl transition-all group-hover:scale-105 group-hover:shadow-2xl active:scale-95"
                        >
                          <ShoppingBag size={20} />
                          Montar agora
                        </button>
                        <p className="text-center text-white/50 text-xs mt-2">Sopas e complementos não recebem desconto</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid de produtos normais */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        categoria: product.categorias?.nome || "Marmita",
                        imagem: product.imagem_url
                      }}
                      allProducts={products.map((p: any) => ({
                        ...p,
                        categoria: p.categorias?.nome || "Marmita",
                        imagem: p.imagem_url
                      }))}
                    />
                  ))}
                </div>

                {/* Modal de combo global */}
                <ComboBuilderModal
                  isOpen={comboModalOpen}
                  onClose={() => setComboModalOpen(false)}
                  combo={{ id: "combo-global", nome: "Monte seu Combo" }}
                  products={products.map((p: any) => ({
                    ...p,
                    categoria: p.categorias?.nome || "Marmita",
                    imagem: p.imagem_url
                  }))}
                />
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-[2.5rem] bg-gradient-brand px-8 py-14 text-center text-primary-foreground shadow-lift">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
            🌿 Sem conservantes · Prontas em minutos · Sem fidelidade
          </span>
          <h2 className="mt-6 text-3xl font-bold md:text-4xl lg:text-5xl">
            Comida de verdade, zero trabalho
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm opacity-95 md:text-base leading-relaxed">
            Marmitas congeladas artesanais, feitas com ingredientes reais e muito sabor. 
            Sem assinatura, sem fidelidade — só pede, recebe e aproveita seu tempo.
          </p>
          <a
            href="#cardapio"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-8 inline-flex items-center rounded-full bg-sun px-8 py-3 text-sm font-bold text-sun-foreground transition-transform hover:scale-[1.03]"
          >
            Montar meu combo
          </a>
        </div>
      </section>
    </>
  );
}
