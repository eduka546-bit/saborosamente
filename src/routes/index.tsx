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
  ssr: false,
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

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Premium Design
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-6 pb-8 md:pt-10 md:pb-12">
        {/* Background orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-gradient-to-br from-primary/6 via-lime/4 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4">
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <div className="animate-in inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-3.5 py-1.5 text-[10px] font-bold text-primary uppercase tracking-wider" style={{ animationDelay: "0ms" }}>
              <Sparkles size={11} />
              <span>Artesanal • Natural • Sem Conservantes</span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="animate-reveal" style={{ animationDelay: "100ms" }}>
              <span className="block text-2xl md:text-3xl lg:text-4xl font-pacifico leading-[1.2] text-foreground">
                Comida de Verdade,
              </span>
              <span className="block mt-1 text-xl md:text-2xl lg:text-3xl font-mazzard font-black bg-gradient-brand bg-clip-text text-transparent leading-[1.2]">
                Pronta Quando Você Quiser
              </span>
            </h1>
            
            <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed animate-in" style={{ animationDelay: "300ms" }}>
              Marmitas congeladas artesanais, prontas em 7 minutos, com 6 meses de validade no freezer.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-row items-center justify-center gap-2.5 animate-in" style={{ animationDelay: "450ms" }}>
              <a
                href="#cardapio"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group inline-flex items-center gap-2 bg-gradient-brand text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-soft hover:shadow-lift transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <ShoppingBag size={14} />
                Ver Cardápio
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </a>
              <button
                onClick={() => setComboModalOpen(true)}
                className="inline-flex items-center gap-2 bg-white border border-primary/20 text-primary px-5 py-2.5 rounded-full font-bold text-xs hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <Gift size={14} />
                Montar Combo
              </button>
            </div>
          </div>

          {/* INFO CARDS — compactos inline */}
          <div className="grid gap-2.5 grid-cols-3 mb-6">
            {[
              { icon: MapPin, title: "Entrega Regional", desc: "SBS e região" },
              { icon: Truck, title: "Delivery ou Retirada", desc: "Na porta ou na loja" },
              { icon: Calendar, title: "Pedidos 24h", desc: "Qualquer hora" }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="animate-in glass-card rounded-xl p-3 text-center hover-lift cursor-default"
                  style={{ animationDelay: `${550 + i * 80}ms` }}
                >
                  <div className="inline-flex p-2 rounded-lg bg-primary/8 mb-1.5">
                    <Icon className="size-3.5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-[10px] leading-tight">{card.title}</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Promo Carousel */}
          {promoBanners.filter((b) => b?.image_url).length > 0 && (
            <PromoCarousel banners={promoBanners} />
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMO FUNCIONA — Steps Premium
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-8 md:py-10">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-display font-black text-foreground">
              Como Funciona
            </h2>
            <div className="mt-2 mx-auto w-10 h-0.5 rounded-full bg-gradient-brand" />
          </div>

          <div className="flex items-start justify-center gap-4 md:gap-8">
            {[
              { step: "1", title: "Escolha", desc: "Monte seu pedido", icon: ShoppingBag },
              { step: "2", title: "Receba", desc: "Na porta ou retire", icon: Truck },
              { step: "3", title: "Aproveite", desc: "Pronto em 7 min", icon: Sparkles }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center flex-1 max-w-[120px]">
                  <div className="relative mb-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
                      <Icon className="size-4 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sun text-sun-foreground text-[8px] font-black flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              );
            })}
          </div>
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
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-2">
                <div className="flex-1">
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
                
                {/* Busca */}
                <div className="flex items-center gap-2 min-w-0 lg:min-w-80">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const q = formData.get("q") as string;
                      setSearchTerm(q || "");
                    }}
                    className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-border/30 shadow-sm flex-1 focus-within:ring-2 focus-within:ring-primary/20"
                  >
                    <input
                      autoFocus
                      name="q"
                      type="text" 
                      placeholder="Buscar..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                    />
                    <button type="submit" className="text-primary hover:text-primary/80 transition-colors">
                      <Tag size={18} />
                    </button>
                  </form>
                  
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                      title="Limpar busca"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
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
                {/* Combo Banner — Premium */}
                {selectedCategory === "Todas" && !searchTerm && (
                  <div
                    onClick={() => setComboModalOpen(true)}
                    className="cursor-pointer mb-8 rounded-2xl overflow-hidden relative group"
                  >
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-brand opacity-95" />
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 px-6 md:px-8 py-6 md:py-8 text-white">
                      <div className="text-center md:text-left flex-1">
                        <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] mb-3">
                          <Gift size={11} />
                          Desconto progressivo
                        </div>
                        <h2 className="text-xl md:text-2xl font-display font-black leading-tight">
                          Monte seu Combo
                        </h2>
                        <p className="mt-2 text-white/70 max-w-sm text-xs leading-relaxed">
                          Quanto mais marmitas, maior o desconto. Automático e sem código.
                        </p>
                        
                        {/* Mini discount tiers */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[
                            { qty: "6+", pct: "5%" },
                            { qty: "10+", pct: "8%" },
                            { qty: "15+", pct: "12%" },
                          ].map((tier) => (
                            <span key={tier.qty} className="inline-flex items-center gap-1 bg-white/10 border border-white/15 rounded-md px-2 py-1 text-[10px] font-bold">
                              {tier.qty} → {tier.pct} off
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setComboModalOpen(true); }}
                        className="shrink-0 flex items-center gap-2 bg-sun text-sun-foreground font-bold px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 text-sm"
                      >
                        <ShoppingBag size={16} />
                        Montar Combo
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

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA — Premium with Social Proof
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-4 py-10 md:py-12">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-brand opacity-[0.97]" />
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 px-6 md:px-10 py-8 md:py-10 text-center">
            {/* Stats inline */}
            <div className="flex justify-center gap-6 md:gap-10 mb-6 text-white">
              {[
                { value: "7min", label: "preparo" },
                { value: "6 meses", label: "validade" },
                { value: "0", label: "conservantes" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg md:text-xl font-black premium-stat">{stat.value}</div>
                  <div className="text-[9px] text-white/55 uppercase tracking-wider font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            <h2 className="text-xl md:text-2xl font-display font-black text-white leading-tight">
              Facilite sua rotina alimentar
            </h2>
            
            <p className="mt-2 text-xs text-white/65 max-w-sm mx-auto">
              Escolha, receba e tenha refeições saudáveis todos os dias.
            </p>

            <div className="mt-5 flex flex-row items-center justify-center gap-2.5">
              <a
                href="#cardapio"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-sun text-sun-foreground px-5 py-2.5 rounded-full font-bold text-xs shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.04]"
              >
                <ShoppingBag size={14} />
                Ver Cardápio →
              </a>
              <a
                href="https://wa.me/5547991507757?text=Olá! Gostaria de fazer um pedido."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-white/25 transition-all duration-300"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
