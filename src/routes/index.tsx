import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Loader2, Truck, MapPin, Calendar, ShoppingBag, Tag, Sparkles, Gift, X } from "lucide-react";
import bannerCarouselAsset from "@/assets/banner-carousel.png.asset.json";
import { ProductCard } from "@/components/product-card";
import { DiscountProgressWidget } from "@/components/discount-progress-widget";
import { PromoCarousel } from "@/components/promo-carousel";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { ComboBuilderModal } from "@/components/combo-builder-modal";
import { COMBO_RULES } from "@/lib/combo-rules";
import { WelcomePopup } from "@/components/welcome-popup";

// Apenas "Combos Escolha Você Mesmo" são excluídos do catálogo e filtros
// "Combos Prontos" aparecem normalmente
function isComboEscolhaVoceMesmo(nome: string, cat?: string): boolean {
  const n = (nome || "").toLowerCase();
  const c = (cat || "").toLowerCase();
  return (
    n.includes("monte você mesmo") ||
    n.includes("monte voce mesmo") ||
    n.includes("escolha você mesmo") ||
    n.includes("escolha voce mesmo") ||
    c.includes("escolha você mesmo") ||
    c.includes("escolha voce mesmo")
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saborosamente | Marmitas Congeladas Artesanais em São Bento do Sul/SC" },
      {
        name: "description",
        content:
          "Marmitas congeladas artesanais feitas com ingredientes naturais. Prontas em 7 minutos, validade de 6 meses no freezer. Entrega em São Bento do Sul, Rio Negrinho, Campo Alegre e região.",
      },
      { name: "keywords", content: "marmitas congeladas, marmitas artesanais, São Bento do Sul, Rio Negrinho, Campo Alegre, refeições prontas, comida congelada, delivery marmitas" },
      { property: "og:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      {
        property: "og:description",
        content: "Marmitas congeladas artesanais feitas com ingredientes naturais. Prontas em 7 minutos. Entrega em São Bento do Sul e região.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://saborosamente.vercel.app/" },
      { property: "og:image", content: "https://saborosamente.vercel.app/favicon.png" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Saborosamente" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      { name: "twitter:description", content: "Marmitas congeladas artesanais. Prontas em 7 minutos, validade 6 meses. Entrega em São Bento do Sul e região." },
      { name: "twitter:image", content: "https://saborosamente.vercel.app/favicon.png" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "SaborosaMente" },
    ],
    links: [{ rel: "canonical", href: "https://saborosamente.vercel.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FoodEstablishment",
          name: "SaborosaMente",
          description: "Marmitas congeladas artesanais feitas com ingredientes naturais",
          servesCuisine: ["Culinária Brasileira", "Marmitas Congeladas"],
          url: "https://saborosamente.vercel.app/",
          image: "https://saborosamente.vercel.app/favicon.png",
          priceRange: "R$$",
          hasMenu: "https://saborosamente.vercel.app/#cardapio",
          address: {
            "@type": "PostalAddress",
            addressLocality: "São Bento do Sul",
            addressRegion: "SC",
            addressCountry: "BR",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: -26.2501,
            longitude: -49.3789,
          },
          areaServed: [
            { "@type": "City", name: "São Bento do Sul" },
            { "@type": "City", name: "Rio Negrinho" },
            { "@type": "City", name: "Campo Alegre" },
            { "@type": "City", name: "Corupá" },
          ],
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
            opens: "00:00",
            closes: "23:59",
            description: "Encomendas recebidas 24h",
          },
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "BRL",
          },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [comboModalOpen, setComboModalOpen] = useState(false);
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products-all"],
    queryFn: () => getPublicProducts(),
    staleTime: 1000 * 60 * 30, // Cache por 30 minutos para reduzir egress
    gcTime: 1000 * 60 * 60,
  });

  // Busca categorias na ordem e visibilidade definidas pelo admin
  const { data: orderedCategories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome, visivel_no_filtro, ordem_filtro")
        .eq("visivel_no_filtro", true)
        .order("ordem_filtro", { ascending: true })
        .order("ordem", { ascending: true });
      if (error) return [];
      // Só exclui "escolha você mesmo" — Combos Prontos aparece normalmente
      return (data ?? []).filter((c: any) => !isComboEscolhaVoceMesmo(c.nome));
    },
    staleTime: 1000 * 60,
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
    // Remove apenas "Combos Escolha Você Mesmo" do grid — Combos Prontos ficam
    return result
      .filter((p: any) => {
        const cat = p.categorias?.nome || "";
        const nome = p.nome || "";
        return !isComboEscolhaVoceMesmo(nome, cat);
      })
      .sort((a: any, b: any) => {
        const catOrdemA = a.categorias?.ordem_filtro ?? 999;
        const catOrdemB = b.categorias?.ordem_filtro ?? 999;
        if (catOrdemA !== catOrdemB) return catOrdemA - catOrdemB;
        return (a.ordem ?? 999) - (b.ordem ?? 999);
      });
  }, [products, selectedCategory, searchTerm]);

  const categoriesWithProducts = useMemo(() => {
    // Se temos categorias ordenadas do banco, usa essa ordem
    if (orderedCategories.length > 0) {
      const withProducts = orderedCategories
        .map((c: any) => c.nome)
        .filter((nome: string) => products.some((p: any) => p.categorias?.nome === nome));
      return ["Todas", ...withProducts];
    }
    // Fallback: ordem alfabética sem "Combos Escolha Você Mesmo"
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.categorias?.nome) {
        const cat = p.categorias.nome;
        if (!isComboEscolhaVoceMesmo("", cat)) set.add(cat);
      }
    });
    return ["Todas", ...Array.from(set).sort()];
  }, [products, orderedCategories]);

  return (
    <>
      {/* Popup de boas-vindas */}
      {settings?.popup_boas_vindas?.ativo && (
        <WelcomePopup config={settings.popup_boas_vindas as any} />
      )}
      {/* Hero Section with Elegant Copy */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Background gradient decorativo */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-lime/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black leading-tight animate-in" style={{ animationDelay: "0ms" }}>
              Comida de Verdade
              <br />
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Zero Complicação
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in" style={{ animationDelay: "150ms" }}>
              Marmitas congeladas artesanais, prontas em 7 minutos. Sem conservantes, sem fidelidade — só pede, recebe e aproveita.
            </p>
          </div>

          {/* Info Cards Grid with Border-Left */}
          <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-8">
            {[
              { icon: MapPin, title: "Taxa de Entrega", desc: "A partir de R$ 8,90", color: "border-l-primary" },
              { icon: Truck, title: "Formas de Entrega", desc: "Delivery ou Retirada", color: "border-l-accent" },
              { icon: Calendar, title: "24/7 Disponível", desc: "Encomendas em tempo integral", color: "border-l-tangerine" }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className={`border-l-4 ${card.color} bg-card/50 backdrop-blur-sm rounded-2xl p-6 transition-all hover:shadow-lift hover:-translate-y-1 animate-in`}
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{card.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="flex justify-center mb-12 animate-in" style={{ animationDelay: "500ms" }}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get("q") as string;
                setSearchTerm(q || "");
                document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full max-w-md"
            >
              <div className="flex items-center gap-2 bg-card border border-border/30 rounded-full px-6 py-3 shadow-soft transition-all hover:shadow-lift focus-within:shadow-lift focus-within:border-primary/50">
                <input 
                  name="q"
                  type="text" 
                  placeholder="Buscar por produto, ingrediente..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                />
                <button type="submit" className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Promo Carousel */}
          {promoBanners.filter((b) => b?.image_url).length > 0 && (
            <PromoCarousel banners={promoBanners} />
          )}
        </div>
      </section>

      {/* Main Content: Filters + Products */}
      <section id="cardapio" className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Menu de Categorias - Sticky */}
          <div className="w-full lg:w-80 lg:sticky lg:top-24 space-y-4 shrink-0">
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-black text-foreground leading-tight">
                Nosso Cardápio
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Escolha suas marmitas favoritas e monte seu combo com desconto progressivo.
              </p>
            </div>
            
            <DiscountProgressWidget className="mb-6" />
            
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-3 no-scrollbar">
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="animate-spin text-primary/30" size={24} />
                </div>
              ) : (
                categoriesWithProducts.map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all border duration-200",
                      selectedCategory === cat 
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-card text-foreground border-border/30 hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {cat}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 w-full">
            {/* Header com título e busca */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                    {searchTerm ? `Buscando "${searchTerm}"` : selectedCategory === "Todas" ? "Todos os Produtos" : selectedCategory}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm 
                      ? `Encontramos ${filteredProducts.length} opção${filteredProducts.length !== 1 ? 's' : ''}.`
                      : selectedCategory === "Todas" 
                        ? `${filteredProducts.length} produtos disponíveis`
                        : `${filteredProducts.length} opção${filteredProducts.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    <X size={14} />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center py-24 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-muted-foreground text-base font-medium">Carregando cardápio...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-muted-foreground text-base font-medium">Nenhum produto encontrado.</p>
                <button 
                  onClick={() => { setSearchTerm(""); setSelectedCategory("Todas"); }}
                  className="mt-4 text-sm font-bold text-primary hover:underline"
                >
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <>
                {/* Combo Banner */}
                {selectedCategory === "Todas" && !searchTerm && (
                  <div
                    onClick={() => setComboModalOpen(true)}
                    className="cursor-pointer mb-12 rounded-2xl overflow-hidden relative group bg-gradient-brand text-white"
                  >
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl" />
                      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white blur-2xl" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-10">
                      <div className="text-center md:text-left flex-1">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4">
                          <Gift size={14} />
                          Desconto progressivo
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-black leading-tight">
                          Monte seu Combo
                        </h2>
                        <p className="mt-3 text-white/80 max-w-md">
                          Escolha suas marmitas e ganhe desconto automático. Quanto mais você montar, maior o desconto!
                        </p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setComboModalOpen(true); }}
                        className="shrink-0 flex items-center gap-2 bg-sun text-sun-foreground font-bold px-6 py-3 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95"
                      >
                        <ShoppingBag size={18} />
                        Montar
                      </button>
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                <div className="space-y-8">
                  {selectedCategory === "Todas" ? (
                    // Agrupar por categoria
                    Array.from(new Map(
                      filteredProducts.map((p: any) => [p.categorias?.nome || "Marmita", p])
                    ).entries()).map(([category, _], categoryIndex) => {
                      const categoryProducts = filteredProducts.filter(
                        (p: any) => (p.categorias?.nome || "Marmita") === category
                      );
                      
                      return (
                        <div key={category}>
                          {categoryIndex > 0 && (
                            <div className="my-6 border-t border-border/30" />
                          )}
                          <h3 className="text-lg font-bold text-primary mb-4 uppercase tracking-wide">
                            {category}
                          </h3>
                          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {categoryProducts.map((product: any) => (
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
                        </div>
                      );
                    })
                  ) : (
                    // Categoria selecionada - sem separador
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                  )}
                </div>

                {/* Combo Modal */}
                <ComboBuilderModal
                  isOpen={comboModalOpen}
                  onClose={() => setComboModalOpen(false)}
                  combo={{ id: "combo-global", nome: "Monte seu Combo" }}
                  products={products
                    .filter((p: any) => {
                      const cat = p.categorias?.nome || "";
                      const nome = p.nome || "";
                      return !isComboEscolhaVoceMesmo(nome, cat);
                    })
                    .map((p: any) => ({
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

      {/* Final CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-brand opacity-95" />
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white blur-2xl" />
          </div>

          <div className="relative z-10 px-8 py-16 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/90 mb-6 animate-in" style={{ animationDelay: "200ms" }}>
              <Sparkles size={14} />
              Desconto progressivo ao montar combo
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black leading-tight text-white animate-in" style={{ animationDelay: "300ms" }}>
              Pronto para<br />
              <span className="text-white/90">revolucionar seu cardápio?</span>
            </h2>
            
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed animate-in" style={{ animationDelay: "400ms" }}>
              Escolha suas marmitas favoritas, receba descontos progressivos e aproveite refeições saudáveis sem trabalho.
            </p>

            {/* CTA Button */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in" style={{ animationDelay: "500ms" }}>
              <a
                href="#cardapio"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-sun text-sun-foreground px-8 py-4 rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <ShoppingBag size={20} />
                Ver Cardápio
              </a>
              <a
                href="https://wa.me/55XXXXXXXXXX?text=Oi%20Saborosamente%2C%20gostaria%20de%20mais%20informações"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-base hover:bg-white/30 transition-all hover:scale-105 active:scale-95 border border-white/30"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.116-4.922 5.488-4.922 9.052 0 5.595 4.51 10.11 10.105 10.11 2.432 0 4.814-.604 6.937-1.74l.503 3.01 3.441-1.107-2.406-3.655c1.221-1.822 1.937-3.931 1.937-6.21C22 6.471 17.529 2.029 12.026 2.029zm8.854 6.36c.164 0 .324-.006.483-.018.726-.057 1.426-.186 2.089-.378.705.528 1.564 1.241 1.773 1.513.12.156.19.337.19.528 0 .528-.294 1.278-.823 1.923-.246.303-.51.592-.776.862.033.231.05.465.05.703 0 2.324-.876 4.518-2.469 6.22-.168.184-.338.365-.509.544l1.51 9.062h-1.782l-1.259-7.563c-.87.407-1.827.628-2.835.628-1.008 0-1.966-.221-2.835-.628l-1.259 7.563h-1.782l1.51-9.062c-.171-.179-.341-.36-.509-.544-1.593-1.702-2.47-3.896-2.47-6.22 0-.238.017-.472.05-.703-.266-.27-.53-.559-.776-.862-.529-.645-.823-1.395-.823-1.923 0-.191.07-.372.19-.528.209-.272 1.068-.985 1.773-1.513.663.192 1.363.321 2.089.378.159.012.319.018.483.018z"/>
                </svg>
                Chamar no WhatsApp
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/70 text-sm animate-in" style={{ animationDelay: "600ms" }}>
              <div className="flex items-center gap-2">
                <span className="text-white/40">✓</span>
                <span>Sem conservantes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">✓</span>
                <span>Prontas em 7 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40">✓</span>
                <span>Sem fidelidade</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
