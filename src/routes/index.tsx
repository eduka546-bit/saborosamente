import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Truck,
  MapPin,
  Calendar,
  ShoppingBag,
  Tag,
  Sparkles,
  Gift,
  X,
  Timer,
  Leaf,
  WheatOff,
  ChefHat,
  ShieldCheck,
} from "lucide-react";
import bannerCarouselAsset from "@/assets/banner-carousel.png.asset.json";
import { ProductCard } from "@/components/product-card";
import { DiscountProgressWidget } from "@/components/discount-progress-widget";
import { PromoCarousel } from "@/components/promo-carousel";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/lib/products.functions";
import { formatBRL } from "@/lib/products";
import { imgUrl } from "@/lib/image-proxy";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { ComboBuilderModal } from "@/components/combo-builder-modal";
import { MarmitaPersonalizadaModal } from "@/components/marmita-personalizada-modal";
import { COMBO_RULES } from "@/lib/combo-rules";
import {
  normalizarMarmitaConfig,
  type MarmitaGrupo,
} from "@/lib/marmita-personalizada-config";
import { WelcomePopup } from "@/components/welcome-popup";
import heroMarmitas from "@/assets/hero-marmitas.jpg";

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const productText = (product: any) =>
  normalizeText(
    [
      product.nome,
      product.descricao,
      product.ingredientes,
      product.informacao_nutricional,
      product.categorias?.nome,
    ].join(" "),
  );

const nutritionValue = (product: any, field: "kcal" | "prot") => {
  const raw = product.tabela_nutricional?.[field] ?? product[`tabela_nutricional_300g`]?.[field] ?? "";
  const parsed = Number(String(raw).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

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
      {
        name: "keywords",
        content:
          "marmitas congeladas, marmitas artesanais, São Bento do Sul, Rio Negrinho, Campo Alegre, refeições prontas, comida congelada, delivery marmitas",
      },
      { property: "og:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      {
        property: "og:description",
        content:
          "Marmitas congeladas artesanais feitas com ingredientes naturais. Prontas em 7 minutos. Entrega em São Bento do Sul e região.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://saborosamente.vercel.app/" },
      { property: "og:image", content: "https://saborosamente.vercel.app/favicon.png" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Saborosamente" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      {
        name: "twitter:description",
        content:
          "Marmitas congeladas artesanais. Prontas em 7 minutos, validade 6 meses. Entrega em São Bento do Sul e região.",
      },
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
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
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
  const [marmitaModalOpen, setMarmitaModalOpen] = useState(false);

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
        .select("id, nome, descricao, visivel_no_filtro, ordem_filtro")
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

  // ── Marmita Personalizada ─────────────────────────────────────────────────
  const marmitaConfig = useMemo(
    () => normalizarMarmitaConfig((settings as any)?.parametros_loja?.marmita_personalizada),
    [settings],
  );

  const { data: marmitaGrupos = [] } = useQuery<MarmitaGrupo[]>({
    queryKey: ["marmita-grupos"],
    enabled: marmitaConfig.ativo,
    queryFn: async () => {
      const { data: grupos } = await supabase
        .from("marmita_grupos")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      const { data: ings } = await supabase
        .from("marmita_ingredientes")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      return (grupos ?? []).map((g: any) => ({
        ...g,
        ingredientes: (ings ?? []).filter((i: any) => i.grupo_id === g.id),
      })) as MarmitaGrupo[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory === "Sem Glúten") {
      result = result.filter((p: any) => p.sem_gluten);
    } else if (selectedCategory === "Sem Lactose") {
      result = result.filter((p: any) => p.sem_lactose);
    } else if (selectedCategory === "Frango") {
      result = result.filter((p: any) => /frango|ave|peito de frango/.test(productText(p)));
    } else if (selectedCategory === "Carne bovina") {
      result = result.filter((p: any) => /patinho|carne bovina|ac[eé]m|cox[aã]o|alcatra|mignon|carne mo[ií]da/.test(productText(p)));
    } else if (selectedCategory === "Peixes") {
      result = result.filter((p: any) => /peixe|salm[aã]o|til[aá]pia|atum/.test(productText(p)));
    } else if (selectedCategory === "Vegetarianas") {
      result = result.filter((p: any) => /vegetar|vegana|vegetal/.test(productText(p)));
    } else if (selectedCategory === "Mais escolhidas") {
      result = result.filter((p: any) => p.destaque);
    } else if (selectedCategory === "Mais saudáveis") {
      result = result.filter((p: any) => /fitness|low carb|integral|vegetar|vegana|leve/.test(productText(p)));
    } else if (["Mais leves", "Mais calóricas", "Mais proteicas"].includes(selectedCategory)) {
      // Estes filtros ordenam o cardápio pelos valores cadastrados na tabela nutricional.
    } else if (selectedCategory !== "Todas") {
      result = result.filter((p: any) => p.categorias?.nome === selectedCategory);
    }
    if (searchTerm) {
      // Normaliza (remove acentos) para casar "gluten"/"glúten", "lactose" etc.
      const search = normalizeText(searchTerm);
      // Termos de restrição: "sem gluten" / "sem lactose" (ou só "gluten"/"lactose").
      const buscaSemGluten = search.includes("gluten");
      const buscaSemLactose = search.includes("lactose");
      result = result.filter((p: any) => {
        if (buscaSemGluten && p.sem_gluten) return true;
        if (buscaSemLactose && p.sem_lactose) return true;
        return (
          productText(p).includes(search)
        );
      });
    }
    // Remove apenas "Combos Escolha Você Mesmo" do grid — Combos Prontos ficam
    return result
      .filter((p: any) => {
        const cat = p.categorias?.nome || "";
        const nome = p.nome || "";
        return !isComboEscolhaVoceMesmo(nome, cat);
      })
      .sort((a: any, b: any) => {
        if (selectedCategory === "Mais calóricas") return nutritionValue(b, "kcal") - nutritionValue(a, "kcal");
        if (selectedCategory === "Mais leves") return nutritionValue(a, "kcal") - nutritionValue(b, "kcal");
        if (selectedCategory === "Mais proteicas") return nutritionValue(b, "prot") - nutritionValue(a, "prot");
        const catOrdemA = a.categorias?.ordem_filtro ?? 999;
        const catOrdemB = b.categorias?.ordem_filtro ?? 999;
        if (catOrdemA !== catOrdemB) return catOrdemA - catOrdemB;
        return (a.ordem ?? 999) - (b.ordem ?? 999);
      });
  }, [products, selectedCategory, searchTerm]);

  const quickFilters = [
    "Mais escolhidas",
    "Mais saudáveis",
    "Mais leves",
    "Mais calóricas",
    "Mais proteicas",
    "Frango",
    "Carne bovina",
    "Peixes",
    "Vegetarianas",
  ];

  const categoriesWithProducts = useMemo(() => {
    // Filtros especiais por selo de restrição (só se houver produtos com o selo).
    const filtrosRestricao: string[] = [];
    if (products.some((p: any) => p.sem_gluten)) filtrosRestricao.push("Sem Glúten");
    if (products.some((p: any) => p.sem_lactose)) filtrosRestricao.push("Sem Lactose");

    // Se temos categorias ordenadas do banco, usa essa ordem
    if (orderedCategories.length > 0) {
      const withProducts = orderedCategories
        .map((c: any) => c.nome)
        .filter((nome: string) => products.some((p: any) => p.categorias?.nome === nome));
      return ["Todas", ...withProducts, ...filtrosRestricao];
    }
    // Fallback: ordem alfabética sem "Combos Escolha Você Mesmo"
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.categorias?.nome) {
        const cat = p.categorias.nome;
        if (!isComboEscolhaVoceMesmo("", cat)) set.add(cat);
      }
    });
    return ["Todas", ...Array.from(set).sort(), ...filtrosRestricao];
  }, [products, orderedCategories]);

  const heroFeatures =
    Array.isArray((settings as any)?.hero_features) && (settings as any).hero_features.length > 0
      ? (settings as any).hero_features
      : [
          { label: "PRONTO EM ATÉ", value: "7 MINUTOS" },
          { label: "VALIDADE NO", value: "CONGELADOR" },
          { label: "INGREDIENTES", value: "DE VERDADE" },
          { label: "SEM", value: "CONSERVANTES" },
        ];

  const abrirCardapio = (categoria = "Todas") => {
    setSelectedCategory(categoria);
    setSearchTerm("");
    window.setTimeout(() => {
      document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const abrirCombosProntos = () => {
    const categoria = categoriesWithProducts.find((item) => item.toLowerCase().includes("combo"));
    abrirCardapio(categoria || "Todas");
  };

  return (
    <>
      {/* Popup de boas-vindas */}
      {settings?.popup_boas_vindas?.ativo && (
        <WelcomePopup config={settings.popup_boas_vindas as any} />
      )}

      <section className="bg-[#fbfaf5] pb-8 pt-6 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#e5e1d4] bg-[#f7f5ed] shadow-sm">
            <div className="grid min-h-[430px] lg:grid-cols-[1.02fr_.98fr]">
              <div className="flex flex-col justify-center px-7 py-10 md:px-12 lg:py-14">
                <span className="mb-4 inline-flex w-fit rounded-full bg-[#e9f1d7] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-primary">
                  Sabor e praticidade para sua rotina
                </span>
                <h1 className="max-w-xl font-display text-4xl font-black leading-[1.04] text-[#075636] md:text-5xl lg:text-6xl">
                  Comida de verdade, pronta em até <span className="text-[#91b93a]">7 minutos</span>
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-[#48554d] md:text-lg">
                  Marmitas artesanais congeladas, saborosas e sem conservantes para facilitar seus dias.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => abrirCardapio()} className="rounded-full bg-[#f6d83d] px-6 py-3 text-sm font-extrabold text-[#174229] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Comprar agora</button>
                  <button onClick={() => setMarmitaModalOpen(true)} className="rounded-full border-2 border-[#075636] px-6 py-3 text-sm font-extrabold text-[#075636] transition hover:bg-[#075636] hover:text-white">Montar minha marmita</button>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#315440]">
                  <span className="inline-flex items-center gap-1.5"><Truck size={16} />Entrega regional</span>
                  <span className="inline-flex items-center gap-1.5"><ShoppingBag size={16} />Retirada na loja</span>
                </div>
              </div>
              <div className="relative min-h-[290px] overflow-hidden lg:min-h-full">
                <img src={imgUrl((settings as any)?.hero_image_url) || heroMarmitas} alt="Marmitas e sopas SaborosaMente" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#f7f5ed]/55 via-transparent to-transparent lg:from-[#f7f5ed]/30" />
              </div>
            </div>
            <div className="grid border-t border-[#e5e1d4] bg-[#fffef9] sm:grid-cols-2 lg:grid-cols-4">
              {heroFeatures.slice(0, 4).map((feature: any, index: number) => {
                const Icon = [Timer, Calendar, Leaf, ShieldCheck][index] ?? Sparkles;
                return <div key={`${feature.label}-${index}`} className="flex items-center gap-3 px-5 py-4 lg:border-r lg:last:border-r-0 border-[#e5e1d4]"><Icon className="size-7 shrink-0 text-[#075636]" strokeWidth={1.5}/><p className="text-xs leading-tight text-[#526158]"><span className="block font-extrabold uppercase text-[#16442c]">{feature.label}</span><span>{feature.value}</span></p></div>;
              })}
            </div>
          </div>
          {promoBanners.filter((b) => b?.image_url).length > 0 && <div className="mt-6"><PromoCarousel banners={promoBanners} /></div>}
        </div>
      </section>

      <section className="bg-white py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 text-center"><p className="text-sm font-semibold text-[#78922f]">SEU PEDIDO, DO SEU JEITO</p><h2 className="mt-1 font-display text-3xl font-black text-[#075636]">Escolha como quer pedir</h2></div>
          <div className="grid gap-4 md:grid-cols-3">
            <ChoiceCard icon={Gift} title="Combos prontos" text="Combinações práticas e saborosas para facilitar a rotina." action="Ver combos" tone="green" onClick={abrirCombosProntos} />
            <ChoiceCard icon={ShoppingBag} title="Monte seu combo" text="Escolha suas favoritas e ganhe descontos por quantidade." action="Montar combo" tone="yellow" onClick={() => setComboModalOpen(true)} />
            {marmitaConfig.ativo && <ChoiceCard icon={ChefHat} title="Marmita personalizada" text="Monte sua refeição com ingredientes e tamanhos do seu jeito." action="Pedir personalizada" tone="cream" onClick={() => setMarmitaModalOpen(true)} />}
          </div>
        </div>
      </section>

      {/* Main Content: Filters + Products */}
      <section id="cardapio" className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
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

            <div className="rounded-2xl border border-[#e6e5db] bg-[#fbfaf6] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#567044]">Encontre do seu jeito</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <button key={filter} onClick={() => setSelectedCategory(filter)} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", selectedCategory === filter ? "border-[#075636] bg-[#075636] text-white" : "border-[#dbe3d5] bg-white text-[#315440] hover:border-[#075636]")}>{filter}</button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Use a busca para excluir ou localizar qualquer ingrediente.</p>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-3 no-scrollbar">
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="animate-spin text-primary/30" size={24} />
                </div>
              ) : (
                categoriesWithProducts.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setTimeout(() => {
                        document.getElementById("produtos-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 50);
                    }}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg text-sm font-bold transition-all border duration-200 flex items-center gap-2",
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-card text-foreground border-border/30 hover:border-primary/50 hover:bg-primary/5",
                    )}
                  >
                    {cat === "Sem Glúten" && (
                      <img
                        src="/selo-sem-gluten.png"
                        alt=""
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                    )}
                    {cat === "Sem Lactose" && (
                      <img
                        src="/selo-sem-lactose.png"
                        alt=""
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                    )}
                    <span>{cat}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 w-full" id="produtos-grid">
            {/* Header com título e busca */}
            <div className="mb-5">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                    {searchTerm
                      ? `Buscando "${searchTerm}"`
                      : selectedCategory === "Todas"
                        ? "Todos os Produtos"
                        : selectedCategory}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? `Encontramos ${filteredProducts.length} opção${filteredProducts.length !== 1 ? "s" : ""}.`
                      : selectedCategory === "Todas"
                        ? `${filteredProducts.length} produtos disponíveis`
                        : `${filteredProducts.length} opção${filteredProducts.length !== 1 ? "s" : ""}`}
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
                    <button
                      type="submit"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
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
                <p className="text-muted-foreground text-base font-medium">
                  Carregando cardápio...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-muted-foreground text-base font-medium">
                  Nenhum produto encontrado.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("Todas");
                  }}
                  className="mt-4 text-sm font-bold text-primary hover:underline"
                >
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="space-y-8">
                  {selectedCategory === "Todas" ? (
                    // Agrupar por categoria
                    Array.from(
                      new Map(
                        filteredProducts.map((p: any) => [p.categorias?.nome || "Marmita", p]),
                      ).entries(),
                    ).map(([category, _], categoryIndex) => {
                      const categoryProducts = filteredProducts.filter(
                        (p: any) => (p.categorias?.nome || "Marmita") === category,
                      );

                      return (
                        <div key={category}>
                          {categoryIndex > 0 && <div className="my-6 border-t border-border/30" />}
                          <h3 className="text-lg font-bold text-primary mb-1 uppercase tracking-wide">
                            {category}
                          </h3>
                          {(() => {
                            const catInfo = orderedCategories.find((c: any) => c.nome === category);
                            return catInfo?.descricao ? (
                              <p className="text-xs text-gray-400 mb-4">{catInfo.descricao}</p>
                            ) : <div className="mb-4" />;
                          })()}
                          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {categoryProducts.map((product: any) => (
                              <ProductCard
                                key={product.id}
                                product={{
                                  ...product,
                                  categoria: product.categorias?.nome || "Marmita",
                                  imagem: imgUrl(product.imagem_url),
                                }}
                                allProducts={products.map((p: any) => ({
                                  ...p,
                                  categoria: p.categorias?.nome || "Marmita",
                                  imagem: imgUrl(p.imagem_url),
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
                            imagem: product.imagem_url,
                          }}
                          allProducts={products.map((p: any) => ({
                            ...p,
                            categoria: p.categorias?.nome || "Marmita",
                            imagem: p.imagem_url,
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
                      imagem: p.imagem_url,
                    }))}
                />

                {/* Marmita Personalizada Modal */}
                {marmitaConfig.ativo && (
                  <MarmitaPersonalizadaModal
                    isOpen={marmitaModalOpen}
                    onClose={() => setMarmitaModalOpen(false)}
                    grupos={marmitaGrupos}
                    config={marmitaConfig}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA — Premium with Social Proof
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-4 py-6 md:py-8">
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
                  <div className="text-[9px] text-white/55 uppercase tracking-wider font-medium">
                    {stat.label}
                  </div>
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
                href="https://wa.me/5547991607757?text=Olá! Gostaria de fazer um pedido."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-white/25 transition-all duration-300"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

function ChoiceCard({
  icon: Icon,
  title,
  text,
  action,
  tone,
  onClick,
}: {
  icon: typeof Gift;
  title: string;
  text: string;
  action: string;
  tone: "green" | "yellow" | "cream";
  onClick: () => void;
}) {
  const styles = {
    green: "border-[#dbe9d1] bg-[#f1f8ea] text-[#075636]",
    yellow: "border-[#eee2ae] bg-[#fff9df] text-[#5a581a]",
    cream: "border-[#eadfce] bg-[#fbf5ec] text-[#075636]",
  }[tone];

  return (
    <article className={`flex min-h-52 flex-col rounded-3xl border p-6 ${styles}`}>
      <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-white/80 shadow-sm"><Icon size={25} strokeWidth={1.6} /></div>
      <h3 className="font-display text-2xl font-black leading-tight">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed opacity-80">{text}</p>
      <button onClick={onClick} className="mt-5 w-fit rounded-full bg-[#075636] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-[#043b26]">{action}</button>
    </article>
  );
}
