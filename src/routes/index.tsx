import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { isHighProteinFlavor, maxProteinForFlavor } from "@/lib/nutrition-rules";
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
  ChevronDown,
  Search,
  SlidersHorizontal,
  ShoppingCart,
} from "lucide-react";
import bannerCarouselAsset from "@/assets/banner-carousel.png.asset.json";
import { ProductCard } from "@/components/product-card";
import { DiscountProgressWidget } from "@/components/discount-progress-widget";
import { CartSheet } from "@/components/cart-sheet";
import { useCart } from "@/lib/cart";
import { PromoCarousel } from "@/components/promo-carousel";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/lib/products.functions";
import { formatBRL } from "@/lib/products";
import { imgUrl } from "@/lib/image-proxy";
import { supabase } from "@/integrations/supabase/client";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { useState, useMemo, useEffect } from "react";
import { ComboBuilderModal } from "@/components/combo-builder-modal";
import { CombosProntosModal } from "@/components/combos-prontos-modal";
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
      product.subgrupo,
      product.proteina,
    ].join(" "),
  );

const nutritionValue = (product: any, field: "kcal" | "prot" | "carb" | "sodio") => {
  // Para marmitas, o tamanho padrão da vitrine é 300 g. Sopas/complementos
  // continuam usando a tabela principal quando não possuem 300 g.
  const raw =
    product.tabela_nutricional_300g?.[field] ??
    product.tabela_nutricional?.[field] ??
    product.tabela_nutricional_400g?.[field] ??
    "";
  const parsed = Number(String(raw).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const productPrice = (product: any) => {
  const values = [
    product.preco,
    product.preco_200g,
    product.preco_300g,
    product.preco_400g,
  ]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : Number.POSITIVE_INFINITY;
};

function InstagramFeedSection() {
  useEffect(() => {
    const scriptId = "sociablekit-instagram-feed-script";
    document.getElementById(scriptId)?.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://widgets.sociablekit.com/instagram-feed/widget.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <section className="border-t border-[#e8eadf] bg-[#fbfaf5] py-7 md:py-10">
      <div className="mx-auto max-w-6xl px-3 md:px-4">
        <div className="mb-4 flex flex-col gap-1.5 text-center md:mb-6 md:gap-2">
          <p className="font-sans text-xs font-semibold text-[#78922f] md:text-sm">
            ACOMPANHE A SABOROSAMENTE
          </p>
          <h2 className="font-display text-2xl font-bold text-[#075636] md:text-3xl">
            Nosso Instagram
          </h2>
          <p className="mx-auto max-w-2xl text-xs leading-relaxed text-[#587064] md:text-sm">
            Novidades, bastidores, lançamentos e muito sabor no
            <a
              href="https://www.instagram.com/saborosamente.sbs/"
              target="_blank"
              rel="noreferrer"
              className="ml-1 font-bold text-[#087443] underline decoration-[#91b93a] decoration-2 underline-offset-4"
            >
              @saborosamente.sbs
            </a>
          </p>
        </div>

        <div className="mx-auto max-w-[430px] md:max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-[#e5e1d4] bg-white shadow-sm md:rounded-[1.75rem]">
            <div className="max-h-[640px] overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:thin] md:max-h-[520px] md:p-3">
              <div className="sk-instagram-feed" data-embed-id="25718106"></div>
            </div>
          </div>
          <a
            href="https://www.instagram.com/saborosamente.sbs/"
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-3 flex w-fit items-center justify-center rounded-full border border-[#d9e2d2] bg-white px-4 py-2 text-xs font-bold text-[#087443] transition hover:border-[#087443] hover:bg-[#f3f8ef] md:hidden"
          >
            Ver perfil completo no Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

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

function isComboPronto(nome: string, cat?: string, tipo?: string): boolean {
  const n = (nome || "").toLowerCase();
  const c = (cat || "").toLowerCase();
  const t = (tipo || "").toLowerCase();
  return (
    c.includes("combo pronto") ||
    c.includes("combos prontos") ||
    (t === "combo" && n.includes("pratos mais vendidos"))
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
      { property: "og:url", content: "https://www.saborosamente.com/" },
      { property: "og:image", content: "https://www.saborosamente.com/icon-app.jpg" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Saborosamente" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      {
        name: "twitter:description",
        content:
          "Marmitas congeladas artesanais. Prontas em 7 minutos, validade 6 meses. Entrega em São Bento do Sul e região.",
      },
      { name: "twitter:image", content: "https://www.saborosamente.com/favicon.png" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "SaborosaMente" },
    ],
    links: [{ rel: "canonical", href: "https://www.saborosamente.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FoodEstablishment",
          name: "SaborosaMente",
          description: "Marmitas congeladas artesanais feitas com ingredientes naturais",
          servesCuisine: ["Culinária Brasileira", "Marmitas Congeladas"],
          url: "https://www.saborosamente.com/",
          image: "https://www.saborosamente.com/favicon.png",
          priceRange: "R$$",
          hasMenu: "https://www.saborosamente.com/#cardapio",
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
            { "@type": "City", name: "Mafra" },
            { "@type": "City", name: "Rio Negro" },
            { "@type": "City", name: "Piên" },
          ],
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "09:30",
              closes: "19:00",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Saturday"],
              opens: "09:30",
              closes: "13:00",
            },
          ],
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
  const { count, selectedCity, setSelectedCity } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = "saborosamente.referral";
    const agora = Date.now();
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get("ref") || "").trim().toUpperCase();

    if (/^IND-[A-Z0-9]{5,12}$/.test(ref)) {
      const payload = {
        code: ref,
        capturedAt: new Date(agora).toISOString(),
        expiresAt: agora + 30 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } else {
      try {
        const atual = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (atual?.expiresAt && Number(atual.expiresAt) <= agora) {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, []);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [combosProntosModalOpen, setCombosProntosModalOpen] = useState(false);
  const [marmitaModalOpen, setMarmitaModalOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const {
    data: products = [],
    isLoading,
    isError: productsError,
    error: productsErrorDetail,
    refetch: refetchProducts,
    isFetching: productsFetching,
  } = useQuery({
    queryKey: ["public-products-all"],
    queryFn: async () => {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("O cardápio demorou mais que o esperado para carregar.")),
          15000,
        );
      });
      return Promise.race([getPublicProducts(), timeout]);
    },
    retry: 1,
    retryDelay: 750,
    staleTime: 1000 * 60 * 30, // Cache por 30 minutos para reduzir egress
    gcTime: 1000 * 60 * 60,
  });

  const scrollToSection = (id: string) => {
    if (typeof window === "undefined") return;
    const run = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => window.requestAnimationFrame(run));
  };

  useEffect(() => {
    if (isLoading || typeof window === "undefined" || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;
    const timer = window.setTimeout(() => scrollToSection(id), 80);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

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
      // Combos têm seus próprios atalhos/modais e não precisam poluir os filtros do cardápio.
      return (data ?? []).filter(
        (c: any) => !isComboEscolhaVoceMesmo(c.nome) && !isComboPronto("", c.nome),
      );
    },
    staleTime: 1000 * 60,
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      return getPublicSiteSettings();
    },
  });

  const { data: bestSellerRows = [] } = useQuery({
    queryKey: ["best-sellers-90d"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("produtos_mais_vendidos_90d", { p_limite: 8 });
      if (error) return [];
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const bestSellerIds = useMemo(
    () => new Set((bestSellerRows as any[]).map((row) => row.produto_id)),
    [bestSellerRows],
  );
  const bestSellerProducts = useMemo(() => {
    const byId = new Map(products.map((product: any) => [product.id, product]));
    return (bestSellerRows as any[])
      .map((row) => byId.get(row.produto_id))
      .filter(Boolean)
      .slice(0, 4);
  }, [products, bestSellerRows]);

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

  const quickFilters = [
    "Mais escolhidas",
    "Até 300 kcal",
    "Alta proteína",
    "Mais leves",
    "Mais calóricas",
    "Mais proteicas",
    "Menor preço",
    "Frango",
    "Carne bovina",
    "Peixes",
    "Suína",
    "Vegetariano",
    "Misto",
    "Sopas",
  ];
  const restrictionFilters = ["Sem Glúten", "Sem Lactose"];
  const advancedFilters = ["Até 500mg sódio", "Até 30g carboidratos"];
  const sortFilters = ["Mais leves", "Mais calóricas", "Mais proteicas", "Menor preço"];
  const proteinFilters = ["Frango", "Carne bovina", "Peixes", "Suína", "Vegetariano", "Misto"];
  const subgruposDisponiveis = useMemo(
    () =>
      Array.from(new Set(products.map((p: any) => String(p.subgrupo || "").trim()).filter(Boolean))).sort(
        (a: string, b: string) => a.localeCompare(b, "pt-BR"),
      ),
    [products],
  );
  const activeFiltersLabel =
    selectedFilters.length > 0
      ? selectedFilters.map((f) => f.startsWith("Subgrupo:") ? f.replace("Subgrupo:", "") : f).join(" + ")
      : "Todos os Produtos";

  const filteredProducts = useMemo(() => {
    let result = [...products];
    const selectedSubgroups = selectedFilters
      .filter((filter) => filter.startsWith("Subgrupo:"))
      .map((filter) => filter.replace("Subgrupo:", ""));
    const selectedCategories = selectedFilters.filter(
      (filter) =>
        !filter.startsWith("Subgrupo:") &&
        !quickFilters.includes(filter) &&
        !restrictionFilters.includes(filter) &&
        !advancedFilters.includes(filter),
    );
    const selectedProteins = selectedFilters.filter((filter) => proteinFilters.includes(filter));
    if (selectedCategories.length > 0) result = result.filter((p: any) => selectedCategories.includes(p.categorias?.nome));
    if (selectedSubgroups.length > 0) result = result.filter((p: any) => selectedSubgroups.includes(p.subgrupo));
    if (selectedProteins.length > 0) {
      result = result.filter((p: any) => selectedProteins.some((filter) => {
        const cadastrado = String(p.proteina || "").trim();
        if (cadastrado) {
          if (filter === "Peixes") return cadastrado === "Peixe" || cadastrado === "Peixes";
          return cadastrado === filter;
        }
        const text = productText(p);
        if (filter === "Frango") return /frango|ave|peito de frango/.test(text);
        if (filter === "Carne bovina") return /patinho|carne bovina|ac[eé]m|cox[aã]o|alcatra|mignon|carne mo[ií]da/.test(text);
        if (filter === "Peixes") return /peixe|salm[aã]o|til[aá]pia|atum/.test(text);
        if (filter === "Suína") return /bacon|calabresa|su[ií]n|paio/.test(text);
        return false;
      }));
    }
    if (selectedFilters.includes("Sem Glúten")) result = result.filter((p: any) => p.sem_gluten);
    if (selectedFilters.includes("Sem Lactose")) result = result.filter((p: any) => p.sem_lactose);
    if (selectedFilters.includes("Mais escolhidas")) {
      result = result.filter((p: any) => bestSellerIds.has(p.id));
    }
    if (selectedFilters.includes("Até 300 kcal")) {
      result = result.filter((p: any) => {
        const kcal = nutritionValue(p, "kcal");
        return kcal > 0 && kcal <= 300;
      });
    }
    if (selectedFilters.includes("Alta proteína")) {
      result = result.filter((p: any) => isHighProteinFlavor(p));
    }
    if (selectedFilters.includes("Até 500mg sódio")) {
      result = result.filter((p: any) => {
        const sodio = nutritionValue(p, "sodio");
        return sodio > 0 && sodio <= 500;
      });
    }
    if (selectedFilters.includes("Até 30g carboidratos")) {
      result = result.filter((p: any) => {
        const carb = nutritionValue(p, "carb");
        return carb >= 0 && carb <= 30;
      });
    }
    if (selectedFilters.includes("Sopas")) {
      result = result.filter((p: any) => {
        const category = normalizeText(p.categorias?.nome);
        return category.includes("sopa") || /^so\d+/i.test(String(p.nome || ""));
      });
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
    // Combos prontos e "escolha você mesmo" ficam nos atalhos próprios, fora do grid principal.
    return result
      .filter((p: any) => {
        const cat = p.categorias?.nome || "";
        const nome = p.nome || "";
        return (
          !isComboEscolhaVoceMesmo(nome, cat) &&
          !isComboPronto(nome, cat, p.tipo_produto)
        );
      })
      .sort((a: any, b: any) => {
        const activeSort = [...selectedFilters].reverse().find((filter) => sortFilters.includes(filter));
        if (activeSort === "Mais calóricas") return nutritionValue(b, "kcal") - nutritionValue(a, "kcal");
        if (activeSort === "Mais leves") return nutritionValue(a, "kcal") - nutritionValue(b, "kcal");
        if (activeSort === "Mais proteicas") return maxProteinForFlavor(b) - maxProteinForFlavor(a);
        if (activeSort === "Menor preço") return productPrice(a) - productPrice(b);
        const catOrdemA = a.categorias?.ordem_filtro ?? 999;
        const catOrdemB = b.categorias?.ordem_filtro ?? 999;
        if (catOrdemA !== catOrdemB) return catOrdemA - catOrdemB;
        return (a.ordem ?? 999) - (b.ordem ?? 999);
      });
  }, [products, selectedFilters, searchTerm, bestSellerIds]);

  const categoriesWithProducts = useMemo(() => {
    // Filtros especiais por selo de restrição (só se houver produtos com o selo).
    const filtrosRestricao: string[] = [];
    if (products.some((p: any) => p.sem_gluten)) filtrosRestricao.push("Sem Glúten");
    if (products.some((p: any) => p.sem_lactose)) filtrosRestricao.push("Sem Lactose");

    // Se temos categorias ordenadas do banco, usa essa ordem
    if (orderedCategories.length > 0) {
      const withProducts = orderedCategories
        .map((c: any) => c.nome)
        .filter((nome: string) =>
          products.some(
            (p: any) =>
              p.categorias?.nome === nome &&
              !isComboPronto(p.nome || "", p.categorias?.nome || "", p.tipo_produto),
          ),
        );
      return ["Todas", ...withProducts, ...filtrosRestricao];
    }
    // Fallback: ordem alfabética sem "Combos Escolha Você Mesmo"
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.categorias?.nome) {
        const cat = p.categorias.nome;
        if (
          !isComboEscolhaVoceMesmo("", cat) &&
          !isComboPronto(p.nome || "", cat, p.tipo_produto)
        ) set.add(cat);
      }
    });
    return ["Todas", ...Array.from(set).sort(), ...filtrosRestricao];
  }, [products, orderedCategories]);

  const menuCategories = categoriesWithProducts.filter(
    (category) => !restrictionFilters.includes(category) && !quickFilters.includes(category),
  );
  const availableRestrictionFilters = categoriesWithProducts.filter((category) =>
    restrictionFilters.includes(category),
  );

  const defaultHeroFeatures = [
    { label: "Pronto em até", value: "7 minutos" },
    { label: "Até 6 meses", value: "de validade" },
    { label: "Temperos naturais", value: "0 conservantes" },
    { label: "Entrega regional", value: "ou retirada" },
  ];
  // Diferenciais definidos para a nova vitrine. Eles substituem o bloco antigo
  // que ficava encaixado no rodapé do hero.
  const heroFeatures = defaultHeroFeatures;

  const abrirCardapio = (categoria = "Todas") => {
    setSelectedFilters(categoria === "Todas" ? [] : [categoria]);
    setSearchTerm("");
    window.setTimeout(() => scrollToSection("cardapio"), 0);
  };

  const abrirCombosProntos = () => {
    setCombosProntosModalOpen(true);
  };

  const abrirObjetivo = (filter: string) => {
    setSelectedFilters([filter]);
    setSearchTerm("");
    window.setTimeout(() => scrollToSection("cardapio"), 0);
  };

  const objetivos = [
    {
      filtro: "Mais proteicas",
      titulo: "Mais proteína",
      texto: "Veja primeiro as refeições com maior teor de proteína.",
      destaque: "Proteína",
      icon: "💪",
    },
    {
      filtro: "Até 300 kcal",
      titulo: "Até 300 kcal",
      texto: "Opções com até 300 kcal na porção de referência.",
      destaque: "Leve",
      icon: "⚡",
    },
    {
      filtro: "Sem Glúten",
      titulo: "Sem glúten",
      texto: "Filtre apenas os produtos identificados como sem glúten.",
      destaque: "Restrição",
      icon: "🌾",
    },
    {
      filtro: "Sem Lactose",
      titulo: "Sem lactose",
      texto: "Encontre rapidamente as opções identificadas como sem lactose.",
      destaque: "Restrição",
      icon: "🥛",
    },
    {
      filtro: "Sopas",
      titulo: "Sopas e caldos",
      texto: "Opções práticas para variar o cardápio e aquecer a rotina.",
      destaque: "Conforto",
      icon: "🥣",
    },
  ];

  const toggleFilter = (filter: string) => {
    if (filter === "Todas") return setSelectedFilters([]);
    setSelectedFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  };

  return (
    <>
      {/* Popup de boas-vindas */}
      {settings?.popup_boas_vindas?.ativo && (
        <WelcomePopup config={settings.popup_boas_vindas as any} />
      )}

      <CombosProntosModal
        isOpen={combosProntosModalOpen}
        onClose={() => setCombosProntosModalOpen(false)}
        products={products
          .filter((p: any) =>
            isComboPronto(
              p.nome || "",
              p.categorias?.nome || "",
              p.tipo_produto,
            ),
          )
          .sort((a: any, b: any) => {
            const qtd = (produto: any) =>
              Number(String(produto.nome || "").match(/(\d+)\s*un/i)?.[1] || 999);
            return qtd(a) - qtd(b);
          })
          .map((p: any) => ({
            ...p,
            categoria: p.categorias?.nome || "Combos Prontos",
            imagem: imgUrl(p.imagem_url),
          }))}
        allProducts={products.map((p: any) => ({
          ...p,
          categoria: p.categorias?.nome || "Marmita",
          imagem: imgUrl(p.imagem_url),
        }))}
      />

      <section className="bg-[#fbfaf5] pb-8 pt-6 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#e5e1d4] bg-[#f7f5ed] shadow-sm">
            <div className="grid lg:grid-cols-[1.02fr_.98fr] xl:aspect-[20/7]">
              <div className="flex flex-col justify-center px-7 py-10 md:px-12 lg:py-10 xl:px-10 xl:py-7">
                <span className="mb-3 inline-flex w-fit rounded-full bg-[#e9f1d7] px-3 py-1 text-xs font-semibold tracking-normal text-primary">
                  Sabor e praticidade para sua rotina
                </span>
                <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.04] text-[#075636] md:text-5xl xl:text-5xl">
                  Comida de verdade, pronta em até <span className="font-halimun text-[#91b93a]">7 minutos</span>
                </h1>
                <p className="mt-4 max-w-md text-base leading-relaxed text-[#48554d] md:text-lg xl:text-base">
                  Marmitas artesanais congeladas, saborosas e sem conservantes para facilitar seus dias.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => abrirCardapio()} className="rounded-full bg-[#f6d83d] px-6 py-3 text-sm font-semibold text-[#174229] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Comprar agora</button>
                  <button onClick={() => setMarmitaModalOpen(true)} className="rounded-full border-2 border-[#075636] px-6 py-3 text-sm font-semibold text-[#075636] transition hover:bg-[#075636] hover:text-white">Montar minha marmita</button>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#315440]">
                  <span className="inline-flex items-center gap-1.5"><Truck size={16} />Entrega regional</span>
                  <span className="inline-flex items-center gap-1.5"><ShoppingBag size={16} />Retirada na loja</span>
                </div>
              </div>
              <div className="relative aspect-[7/5] overflow-hidden bg-[#087149] lg:aspect-auto lg:min-h-[430px] xl:min-h-0">
                {promoBanners.filter((banner) => banner?.image_url).length > 0 ? (
                  <PromoCarousel banners={promoBanners} fill className="absolute inset-0 max-w-none" />
                ) : (
                  <img src={imgUrl((settings as any)?.hero_image_url) || heroMarmitas} alt="Marmitas e sopas SaborosaMente" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {heroFeatures.map((feature: any, index: number) => {
              const Icon = [Timer, Calendar, Leaf, Truck][index] ?? Sparkles;
              return (
                <div key={`${feature.label}-${index}`} className="flex min-h-24 flex-col items-center justify-center rounded-[1.35rem] bg-[#087149] px-3 py-4 text-center text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#075f3e]">
                  <Icon className="mb-2 size-6" strokeWidth={1.8} />
                  <p className="text-sm font-semibold leading-snug"><span className="block">{feature.label}</span><span className="block text-white/85">{feature.value}</span></p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-7 text-center"><p className="font-sans text-sm font-semibold text-[#78922f]">Seu pedido, do seu jeito</p><h2 className="mt-1 font-display text-3xl font-bold text-[#075636]">Escolha <span className="font-pacifico text-[.9em] font-normal text-[#87a833]">do seu jeito</span></h2></div>
          <div className="grid gap-5 md:grid-cols-3">
            <OrderChoiceBanner
              icon={Gift}
              badge="Combinações prontas"
              title="Combos Prontos"
              text="Combos de 5 a 20 marmitas com os sabores mais escolhidos."
              action="Ver Combos"
              chips={["Opções para toda a semana", "Escolha e receba"]}
              tone="ready"
              onClick={abrirCombosProntos}
            />
            <OrderChoiceBanner
              icon={ShoppingBag}
              badge="Desconto progressivo"
              title="Monte seu Combo"
              text="Quanto mais marmitas, maior o desconto. Automático e sem código."
              action="Montar Combo"
              chips={["5+ → preço especial", "10+ → economize mais", "20+ → melhor preço"]}
              tone="combo"
              onClick={() => setComboModalOpen(true)}
            />
            {marmitaConfig.ativo && <OrderChoiceBanner
              icon={ChefHat}
              badge="Do seu jeito"
              title="Marmita Personalizada"
              text="Escolha os ingredientes, o modo de preparo e a gramatura da sua marmita. Preço pelo tamanho, mínimo 3 unidades."
              action="Marmitas Personalizadas"
              chips={marmitaConfig.tamanhos.map(
                (t) => `${t.sigla} → ${formatBRL(t.preco)}`,
              )}
              tone="personalizada"
              onClick={() => setMarmitaModalOpen(true)}
            />}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8eadf] bg-[#f7f8f1] py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-sans text-sm font-semibold text-[#78922f]">
                ESCOLHA PELO SEU OBJETIVO
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold text-[#075636]">
                Encontre mais rápido o que combina com você
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#587064]">
                Atalhos baseados nos dados nutricionais e restrições cadastrados nas etiquetas dos produtos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => abrirCardapio()}
              className="w-fit text-sm font-bold text-[#075636] underline decoration-[#91b93a] decoration-2 underline-offset-4"
            >
              Ver cardápio completo
            </button>
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-5">
            {objetivos.map((objetivo) => (
              <button
                key={objetivo.filtro}
                type="button"
                onClick={() => abrirObjetivo(objetivo.filtro)}
                className="group flex min-h-[170px] w-[78vw] max-w-[280px] shrink-0 snap-start flex-col rounded-[1.5rem] border border-[#dce4d4] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#8eb85a] hover:shadow-md md:w-auto md:max-w-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl" aria-hidden="true">{objetivo.icon}</span>
                  <span className="rounded-full bg-[#edf5e6] px-2 py-1 text-xs font-bold tracking-normal text-[#658638]">
                    {objetivo.destaque}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-[#075636]">
                  {objetivo.titulo}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#607168]">
                  {objetivo.texto}
                </p>
                <span className="mt-auto pt-3 text-xs font-bold text-[#087149] transition group-hover:translate-x-1">
                  Ver opções →
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {bestSellerProducts.length > 0 && (
        <section className="bg-white py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="font-sans text-sm font-semibold text-[#78922f]">Os favoritos de quem já compra</p>
                <h2 className="mt-1 font-display text-3xl font-bold text-[#075636]">Mais pedidos</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#587064]">
                  Os sabores mais escolhidos nos últimos 90 dias.
                </p>
              </div>
              <button
                type="button"
                onClick={() => abrirObjetivo("Mais escolhidas")}
                className="hidden text-sm font-bold text-[#075636] underline decoration-[#91b93a] decoration-2 underline-offset-4 sm:block"
              >
                Ver todos
              </button>
            </div>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 no-scrollbar md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
              {bestSellerProducts.map((product: any) => (
                <div key={product.id} className="w-[82vw] max-w-[315px] shrink-0 snap-start md:w-auto md:max-w-none">
                  <ProductCard
                    product={{
                      ...product,
                      mais_vendido: true,
                      categoria: product.categorias?.nome || "Marmita",
                      imagem: imgUrl(product.imagem_url),
                    }}
                    allProducts={products.map((p: any) => ({
                      ...p,
                      categoria: p.categorias?.nome || "Marmita",
                      imagem: imgUrl(p.imagem_url),
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Filters + Products */}
      <section id="cardapio" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-10 md:py-12">
        <div className="sticky top-2 z-30 -mx-2 mb-5 flex items-center gap-2 rounded-2xl border border-[#dce7d5] bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#f5f7f2] px-3 py-2.5">
            <Search size={17} className="shrink-0 text-[#087443]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar no cardápio"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#173a2d] outline-none placeholder:text-[#829087]"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} className="text-[#708078]">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className={cn(
              "relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl border",
              mobileFiltersOpen
                ? "border-[#087443] bg-[#087443] text-white"
                : "border-[#cfe0c4] bg-[#f3f7ee] text-[#087443]",
            )}
            aria-label="Abrir filtros"
          >
            <SlidersHorizontal size={19} />
            {selectedFilters.length > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f6d83d] text-xs font-bold text-[#173a2d]">
                {selectedFilters.length}
              </span>
            )}
          </button>
          <CartSheet>
            <button
              type="button"
              className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#087443] text-white"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart size={19} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f6d83d] text-xs font-bold text-[#173a2d]">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </CartSheet>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Menu de Categorias - Sticky */}
          <div className="w-full lg:w-80 lg:self-start space-y-4 shrink-0">
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-bold text-foreground leading-tight">
                Nosso Cardápio
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Escolha suas marmitas favoritas e monte seu combo com desconto progressivo.
              </p>
            </div>

            <DiscountProgressWidget className="mb-6" />

            <div className={cn(
              "rounded-2xl border border-[#d5e5ca] bg-[#edf5e6] p-4 shadow-sm",
              !mobileFiltersOpen && "hidden lg:block",
            )}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-semibold text-[#78922f]">Filtros</p>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-[#075636]">Encontre suas favoritas</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#487156]">Combine os filtros para achar exatamente o que você quer comer.</p>
                </div>
                {selectedFilters.length > 0 && (
                  <button onClick={() => setSelectedFilters([])} className="shrink-0 pt-1 text-xs font-bold text-[#075636] underline underline-offset-2">
                    Limpar
                  </button>
                )}
              </div>

              <p className="mb-2 text-xs font-semibold tracking-normal text-[#567044]">Preferências</p>
              <div className="flex flex-wrap gap-2">
                {[...quickFilters, ...availableRestrictionFilters].map((filter) => {
                  const selected = selectedFilters.includes(filter);
                  return (
                    <button
                      key={filter}
                      onClick={() => toggleFilter(filter)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 font-mazzard text-xs font-bold transition-all",
                        selected
                          ? "border-[#075636] bg-[#075636] text-white shadow-sm"
                          : "border-[#c6d9b9] bg-white text-[#28513a] hover:-translate-y-px hover:border-[#075636]",
                      )}
                    >
                      {filter === "Sem Glúten" && <WheatOff size={14} />}
                      {filter === "Sem Lactose" && <span className="text-sm leading-none">🥛</span>}
                      {filter}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setAdvancedFiltersOpen((open) => !open)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#075636]"
                aria-expanded={advancedFiltersOpen}
              >
                Mais filtros nutricionais
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", advancedFiltersOpen && "rotate-180")}
                />
              </button>

              {advancedFiltersOpen && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {advancedFilters.map((filter) => {
                    const selected = selectedFilters.includes(filter);
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => toggleFilter(filter)}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-full border px-3 py-2 text-xs font-bold transition-all",
                          selected
                            ? "border-[#075636] bg-[#075636] text-white shadow-sm"
                            : "border-[#c6d9b9] bg-white text-[#28513a] hover:border-[#075636]",
                        )}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="my-4 border-t border-[#cfe0c4]" />
              <p className="mb-2 text-xs font-semibold tracking-normal text-[#567044]">Categorias</p>
              {isLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary/30" size={22} /></div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {menuCategories.map((category) => {
                    const selected = category === "Todas" ? selectedFilters.length === 0 : selectedFilters.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => toggleFilter(category)}
                        aria-pressed={selected}
                        className={cn(
                          "rounded-full border px-3 py-2 text-[13px] font-bold transition-all",
                          selected
                            ? "border-[#075636] bg-[#075636] text-white shadow-sm"
                            : "border-[#c6d9b9] bg-white text-[#28513a] hover:border-[#075636]",
                        )}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              )}

              {subgruposDisponiveis.length > 0 && (
                <>
                  <div className="my-4 border-t border-[#cfe0c4]" />
                  <p className="mb-2 text-xs font-semibold tracking-normal text-[#567044]">Subgrupos</p>
                  <div className="flex flex-wrap gap-2">
                    {subgruposDisponiveis.map((subgrupo) => {
                      const chave = "Subgrupo:" + subgrupo;
                      const selected = selectedFilters.includes(chave);
                      return (
                        <button
                          key={chave}
                          onClick={() => toggleFilter(chave)}
                          aria-pressed={selected}
                          className={cn(
                            "rounded-full border px-3 py-2 text-[13px] font-bold transition-all",
                            selected
                              ? "border-[#075636] bg-[#075636] text-white shadow-sm"
                              : "border-[#c6d9b9] bg-white text-[#28513a] hover:border-[#075636]",
                          )}
                        >
                          {subgrupo}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 w-full" id="produtos-grid">
            {/* Header com título e busca */}
            <div className="mb-5">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    {searchTerm
                      ? `Buscando "${searchTerm}"`
                      : activeFiltersLabel}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? `Encontramos ${filteredProducts.length} opção${filteredProducts.length !== 1 ? "s" : ""}.`
                      : selectedFilters.length === 0
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
                    className="relative flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border border-border/30 shadow-sm flex-1 focus-within:ring-2 focus-within:ring-primary/20"
                  >
                    <input
                      name="q"
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                      className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                    />
                    <button
                      type="submit"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <Tag size={18} />
                    </button>
                    {searchFocused && searchTerm.trim().length >= 2 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
                        {products
                          .filter((product: any) => productText(product).includes(normalizeText(searchTerm)))
                          .slice(0, 5)
                          .map((product: any) => (
                            <button
                              key={product.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSearchFocused(false);
                                navigate({ to: "/produto/$id", params: { id: product.id } });
                              }}
                              className="flex w-full items-center gap-3 border-b border-border/50 px-3 py-2.5 text-left last:border-b-0 hover:bg-[#f7f9f4]"
                            >
                              <img
                                src={imgUrl(product.imagem_url)}
                                alt=""
                                className="size-9 shrink-0 rounded-lg object-cover"
                                loading="lazy"
                              />
                              <span className="line-clamp-1 text-xs font-bold text-[#315440]">
                                {product.nome}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
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

            {productsError ? (
              <div className="rounded-3xl border border-[#dce7d5] bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#eef5e9] text-2xl">🍽️</div>
                <h3 className="mt-4 text-lg font-bold text-[#173a2d]">
                  Não conseguimos carregar o cardápio agora
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Sua conexão pode ter oscilado por alguns instantes. Tente novamente — seu carrinho continua salvo.
                </p>
                {productsErrorDetail instanceof Error && (
                  <p className="sr-only">{productsErrorDetail.message}</p>
                )}
                <button
                  type="button"
                  onClick={() => refetchProducts()}
                  disabled={productsFetching}
                  className="mt-5 inline-flex min-w-40 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  {productsFetching ? "Tentando novamente..." : "Tentar novamente"}
                </button>
              </div>
            ) : isLoading ? (
              <div aria-label="Carregando cardápio" className="space-y-6">
                <div className="h-5 w-40 animate-pulse rounded-full bg-[#e7ece3]" />
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-2xl border border-[#e6e9e1] bg-white"
                    >
                      <div className="aspect-4/3 animate-pulse bg-[#edf0e9]" />
                      <div className="space-y-3 p-4">
                        <div className="h-4 w-4/5 animate-pulse rounded-full bg-[#e7ece3]" />
                        <div className="h-3 w-2/5 animate-pulse rounded-full bg-[#eef1eb]" />
                        <div className="flex items-end justify-between pt-3">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-[#e7ece3]" />
                          <div className="size-9 animate-pulse rounded-full bg-[#dce7d5]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    setSelectedFilters([]);
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
                  {selectedFilters.length === 0 ? (
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
                          <h3 className="mb-1 text-xl font-bold tracking-normal text-primary">
                            {category}
                          </h3>
                          {(() => {
                            const catInfo = orderedCategories.find((c: any) => c.nome === category);
                            return catInfo?.descricao ? (
                              <p className="text-sm font-medium text-gray-600 mb-4">{catInfo.descricao}</p>
                            ) : <div className="mb-4" />;
                          })()}
                          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {categoryProducts.map((product: any) => (
                              <ProductCard
                                key={product.id}
                                product={{
                                  ...product,
                                  mais_vendido: bestSellerIds.has(product.id),
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
                            mais_vendido: bestSellerIds.has(product.id),
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

      <section className="border-t border-[#e8eadf] bg-[#f7f8f1] py-10 md:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="font-sans text-sm font-semibold text-[#78922f]">Simples do início ao fim</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-[#075636]">Como funciona</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShoppingBag, title: "1. Escolha", text: "Monte seu pedido com os sabores e tamanhos que preferir." },
                { icon: Truck, title: "2. Receba", text: "Escolha entrega na sua região ou retirada na loja." },
                { icon: Timer, title: "3. Aqueça", text: "Do freezer para a mesa em poucos minutos." },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl border border-[#dce4d4] bg-white p-4 shadow-sm">
                    <div className="grid size-10 place-items-center rounded-xl bg-[#edf5e6] text-[#087443]">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-3 text-base font-bold text-[#173a2d]">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#607168]">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-[#087149] p-5 text-white shadow-sm md:p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
                <MapPin size={21} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-normal text-white/70">Onde você quer receber?</p>
                <h2 className="mt-1 text-2xl font-bold">Escolha sua cidade</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/75">
                  Você confirma bairro, taxa e disponibilidade no checkout.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["São Bento do Sul", "Rio Negrinho", "Campo Alegre", "Corupá", "Mafra", "Rio Negro", "Piên"].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-bold transition",
                    selectedCity === city
                      ? "border-[#f6d83d] bg-[#f6d83d] text-[#173a2d]"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-semibold text-white/85">
              <ShoppingBag size={16} />
              Retirada na loja em São Bento do Sul também disponível.
            </div>
          </div>
        </div>
      </section>

      <InstagramFeedSection />
    </>
  );
}

function OrderChoiceBanner({
  icon: Icon,
  badge,
  title,
  text,
  action,
  chips,
  tone,
  onClick,
}: {
  icon: typeof Gift;
  badge: string;
  title: string;
  text: string;
  action: string;
  chips: string[];
  tone: "ready" | "combo" | "personalizada";
  onClick: () => void;
}) {
  const styles = {
    ready: {
      card: "border-[#e8e1cf] bg-[#fffdf8]",
      icon: "bg-[#eef5e8] text-[#087149]",
      badge: "border-[#dfe8d9] bg-[#f6f8f2] text-[#5d725f]",
      chip: "border-[#e5e8df] bg-white text-[#617065]",
      button: "bg-[#f6d83d] text-[#173a2d] hover:bg-[#ffe45d]",
    },
    combo: {
      card: "border-[#dce8d5] bg-[#f7faf4]",
      icon: "bg-white text-[#087149]",
      badge: "border-[#dbe6d4] bg-white/80 text-[#5d725f]",
      chip: "border-[#dde7d8] bg-white/85 text-[#617065]",
      button: "bg-[#087149] text-white hover:bg-[#075f3e]",
    },
    personalizada: {
      card: "border-[#e0e6dc] bg-white",
      icon: "bg-[#f0f4ed] text-[#075636]",
      badge: "border-[#e1e7dd] bg-[#f7f8f5] text-[#5d725f]",
      chip: "border-[#e2e8df] bg-[#fafbf8] text-[#617065]",
      button: "bg-[#173a2d] text-white hover:bg-[#0f3023]",
    },
  }[tone];

  return (
    <article
      className={`group flex h-full flex-col rounded-[1.5rem] border px-4.5 py-4.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md md:px-5 md:py-5 ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`grid size-10 shrink-0 place-items-center rounded-2xl ${styles.icon}`}>
          <Icon size={19} strokeWidth={1.8} />
        </div>
        <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${styles.badge}`}>
          {badge}
        </span>
      </div>

      <div className="mt-3.5 flex-1">
        <h3 className="max-w-[22ch] font-display text-[1.35rem] font-bold leading-[1.12] text-[#173a2d] md:text-[1.5rem]">
          {title}
        </h3>
        <p className="mt-2.5 text-[14px] leading-[1.6] text-[#5f6f66] md:text-[14.5px]">
          {text}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5 pb-1">
          {chips.map((chip) => (
            <span
              key={chip}
              className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold ${styles.chip}`}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={onClick}
        className={`mt-5 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-bold shadow-sm transition group-hover:translate-x-0.5 ${styles.button}`}
      >
        <Icon size={16} strokeWidth={2} />
        {action}
      </button>
    </article>
  );
}
