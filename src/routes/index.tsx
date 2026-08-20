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
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Layered background with animated gradient orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-primary/8 via-lime/5 to-transparent blur-3xl animate-float-slow" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-sun/10 to-transparent blur-3xl" />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-bl from-teal/8 to-transparent blur-3xl" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="mx-auto max-w-6xl px-4">
          {/* Badge acima do título */}
          <div className="flex justify-center mb-8">
            <div className="animate-in inline-flex items-center gap-2 rounded-full bg-primary/8 border border-primary/15 px-5 py-2.5 text-xs font-bold text-primary uppercase tracking-wider" style={{ animationDelay: "0ms" }}>
              <Sparkles size={13} className="animate-float" />
              <span>Artesanal • Natural • Sem Conservantes</span>
            </div>
          </div>

          {/* Heading com hierarquia premium */}
          <div className="text-center space-y-8 mb-16">
            <h1 className="animate-reveal" style={{ animationDelay: "100ms" }}>
              <span className="block text-5xl md:text-6xl lg:text-[5rem] xl:text-[5.5rem] font-pacifico leading-[1.1] text-foreground">
                Comida de Verdade,
              </span>
              <span className="block mt-2 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mazzard font-black bg-gradient-brand bg-clip-text text-transparent animate-gradient leading-[1.1]">
                Pronta Quando Você Quiser
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in" style={{ animationDelay: "300ms" }}>
              Marmitas congeladas artesanais feitas com ingredientes selecionados. 
              <span className="text-foreground font-semibold"> Prontas em 7 minutos</span>, com 
              <span className="text-foreground font-semibold"> 6 meses de validade</span> no freezer.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in" style={{ animationDelay: "450ms" }}>
              <a
                href="#cardapio"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group inline-flex items-center gap-3 bg-gradient-brand text-white px-8 py-4 rounded-full font-bold text-base shadow-soft hover:shadow-lift transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <ShoppingBag size={18} />
                Ver Cardápio
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <button
                onClick={() => setComboModalOpen(true)}
                className="group inline-flex items-center gap-3 bg-white border-2 border-primary/20 text-primary px-8 py-4 rounded-full font-bold text-base hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <Gift size={18} />
                Montar Combo
              </button>
            </div>
          </div>

          {/* ═══ INFO CARDS — Premium Glassmorphism ═══ */}
          <div className="grid gap-4 md:gap-5 md:grid-cols-3 mb-10">
            {[
              { icon: MapPin, title: "Entrega Regional", desc: "São Bento do Sul, Rio Negrinho, Campo Alegre e região", gradient: "from-primary/15 to-teal/10" },
              { icon: Truck, title: "Delivery ou Retirada", desc: "Entregamos na sua porta ou retire na loja", gradient: "from-accent/15 to-lime/10" },
              { icon: Calendar, title: "Pedidos 24h", desc: "Faça seu pedido a qualquer hora, 7 dias por semana", gradient: "from-tangerine/15 to-sun/10" }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="animate-in group relative glass-card rounded-3xl p-6 hover-lift cursor-default"
                  style={{ animationDelay: `${550 + i * 100}ms` }}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative flex items-start gap-4">
                    <div className="shrink-0 p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-sm leading-tight">{card.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promo Carousel */}
          {promoBanners.filter((b) => b?.image_url).length > 0 && (
            <div className="animate-in" style={{ animationDelay: "850ms" }}>
              <PromoCarousel banners={promoBanners} />
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMO FUNCIONA — Steps Premium
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
        
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Simples assim</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-foreground leading-tight">
              Como Funciona
            </h2>
            <div className="mt-4 mx-auto w-16 h-1 rounded-full bg-gradient-brand" />
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {[
              { step: "01", title: "Escolha", desc: "Navegue pelo cardápio e selecione suas marmitas favoritas. Monte combos com desconto progressivo.", icon: ShoppingBag },
              { step: "02", title: "Receba", desc: "Entregamos congeladas na sua porta ou retire na loja. Praticidade total para sua rotina.", icon: Truck },
              { step: "03", title: "Aproveite", desc: "Aqueça em apenas 7 minutos e tenha uma refeição caseira de verdade, sem esforço.", icon: Sparkles }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="relative text-center group">
                  {/* Step number circle */}
                  <div className="relative inline-flex mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-soft group-hover:shadow-lift group-hover:scale-110 transition-all duration-300">
                      <Icon className="size-6 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-sun text-sun-foreground text-[10px] font-black flex items-center justify-center shadow-md">
                      {item.step}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">{item.desc}</p>
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
                    className="cursor-pointer mb-12 rounded-3xl overflow-hidden relative group"
                  >
                    {/* Background with animated gradient */}
                    <div className="absolute inset-0 bg-gradient-brand animate-gradient opacity-95" />
                    
                    {/* Premium decorative elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 md:px-12 py-10 md:py-12 text-white">
                      <div className="text-center md:text-left flex-1">
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] mb-5">
                          <Gift size={13} className="animate-float" />
                          Economia garantida
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black leading-tight">
                          Monte seu Combo
                          <span className="block text-white/80 text-xl md:text-2xl mt-1 font-mazzard font-bold">com desconto progressivo</span>
                        </h2>
                        <p className="mt-4 text-white/70 max-w-md text-sm leading-relaxed">
                          Quanto mais marmitas você escolher, maior o desconto. Simples, automático e sem código.
                        </p>
                        
                        {/* Mini discount tiers */}
                        <div className="flex flex-wrap gap-3 mt-5">
                          {[
                            { qty: "6+", pct: "5%" },
                            { qty: "10+", pct: "8%" },
                            { qty: "15+", pct: "12%" },
                          ].map((tier) => (
                            <span key={tier.qty} className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-1.5 text-[11px] font-bold">
                              <Tag size={10} />
                              {tier.qty} → {tier.pct} off
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setComboModalOpen(true); }}
                        className="shrink-0 flex items-center gap-3 bg-sun text-sun-foreground font-bold px-8 py-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl active:scale-95 text-base"
                      >
                        <ShoppingBag size={20} />
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
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="relative rounded-[2rem] overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-brand animate-gradient opacity-[0.97]" />
          
          {/* Premium decorative mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float-slow" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-float" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
            {/* Dot pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          </div>

          <div className="relative z-10 px-8 md:px-16 py-16 md:py-24">
            {/* Stats row - Social Proof */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12">
              {[
                { value: "7min", label: "para ficar pronta" },
                { value: "6 meses", label: "de validade" },
                { value: "0", label: "conservantes" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-black text-white premium-stat">{stat.value}</div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider mt-1 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/90 mb-8">
                <Sparkles size={13} className="animate-float" />
                Comida que cuida de você
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] text-white">
                Pronto para facilitar
                <span className="block mt-1 text-white/85">sua rotina alimentar?</span>
              </h2>
              
              <p className="mt-6 text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
                Escolha suas marmitas, receba em casa e tenha refeições saudáveis todos os dias sem precisar cozinhar.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#cardapio"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group inline-flex items-center gap-3 bg-sun text-sun-foreground px-9 py-4.5 rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.97]"
                >
                  <ShoppingBag size={20} />
                  Ver Cardápio
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
                <a
                  href="https://wa.me/5547991507757?text=Olá! Gostaria de fazer um pedido."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 text-white px-9 py-4.5 rounded-full font-bold text-base hover:bg-white/25 transition-all duration-300 hover:scale-[1.05] active:scale-[0.97]"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>

              {/* Trust badges - refined */}
              <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-white/60 text-xs">
                {["Sem conservantes", "Ingredientes naturais", "Sem fidelidade", "Entrega rápida"].map((badge) => (
                  <div key={badge} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-lime/80" />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
