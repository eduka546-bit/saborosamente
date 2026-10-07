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
  ChefHat,
  ShieldCheck,
  ChevronDown,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  ArrowRight,
  Trophy,
  Dumbbell,
  WheatOff,
  MilkOff,
  Soup,
  CreditCard,
  Clock,
} from "lucide-react";
import bannerCarouselAsset from "@/assets/banner-carousel.png.asset.json";
import { ProductCard } from "@/components/product-card";
import { FoodTypeIcon } from "@/components/food-type-icon";
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
import { DeliveryRegionMiniMap, HomeInfoModal } from "@/components/home-info-modal";
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
    <section className="border-t border-[#e8eadf] bg-[#fbfaf5] py-8 md:py-9">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#78922f]">
              Dicas, novidades e uma comida boa
            </p>
            <h2 className="mt-1 font-display text-[2rem] font-bold leading-tight text-[#075636] md:text-[2.4rem]">
              Acompanhe no Instagram
            </h2>
          </div>

          <a
            href="https://www.instagram.com/saborosamente.sbs/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 text-xs font-extrabold text-[#075636] transition hover:translate-x-0.5"
          >
            <span className="grid size-7 place-items-center rounded-lg border border-[#d9e2d2] bg-white text-[#087443]">
              @
            </span>
            @saborosamente.sbs
            <ArrowRight size={14} />
          </a>
        </div>

        <div className="overflow-hidden rounded-[1.55rem] border border-[#e5e1d4] bg-white shadow-sm">
          <div className="h-[430px] overflow-hidden p-2 sm:h-[420px] md:h-[400px] md:p-3">
            <div className="sk-instagram-feed" data-embed-id="25718106"></div>
          </div>
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
      { property: "og:url", content: "https://saborosamente.com/" },
      { property: "og:image", content: "https://saborosamente.com/icon-app.jpg" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Saborosamente" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Saborosamente | Marmitas Congeladas Artesanais" },
      {
        name: "twitter:description",
        content:
          "Marmitas congeladas artesanais. Prontas em 7 minutos, validade 6 meses. Entrega em São Bento do Sul e região.",
      },
      { name: "twitter:image", content: "https://saborosamente.com/favicon.png" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "SaborosaMente" },
    ],
    links: [{ rel: "canonical", href: "https://saborosamente.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FoodEstablishment",
          name: "SaborosaMente",
          description: "Marmitas congeladas artesanais feitas com ingredientes naturais",
          servesCuisine: ["Culinária Brasileira", "Marmitas Congeladas"],
          url: "https://saborosamente.com/",
          image: "https://saborosamente.com/favicon.png",
          priceRange: "R$$",
          hasMenu: "https://saborosamente.com/#cardapio",
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
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

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
  const bestSellerRank = useMemo(
    () =>
      new Map(
        (bestSellerRows as any[]).map((row, index) => [
          row.produto_id,
          index,
        ]),
      ),
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
    "Frango",
    "Carne bovina",
    "Peixes",
    "Suína",
    "Misto",
    "Sopas",
  ];
  const restrictionFilters = ["Sem Glúten", "Sem Lactose"];
  const advancedFilters = ["Até 500mg sódio", "Até 30g carboidratos"];
  const sortFilters = ["Mais leves", "Mais calóricas", "Mais proteicas"];
  const proteinFilters = ["Frango", "Carne bovina", "Peixes", "Suína", "Misto"];
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
        if (selectedFilters.includes("Mais escolhidas")) {
          return (
            (bestSellerRank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (bestSellerRank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
          );
        }
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
  }, [products, selectedFilters, searchTerm, bestSellerIds, bestSellerRank]);

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
    { label: "Pronto em até", value: "7min" },
    { label: "6 meses", value: "de validade" },
    { label: "Temperos", value: "100% Naturais" },
    { label: "Zero Conservantes", value: "e Industrializados" },
  ];
  // Diferenciais definidos para a nova vitrine. Eles substituem o bloco antigo
  // que ficava encaixado no rodapé do hero.
  const heroFeatures = defaultHeroFeatures;

  const comboReadyImage = imgUrl(
    products.find(
      (p: any) =>
        p.tipo_produto === "marmita" &&
        normalizeText(p.nome).includes("frango grelhado ao molho sugo"),
    )?.imagem_url ||
      products.find((p: any) => p.tipo_produto === "marmita" && p.imagem_url)?.imagem_url,
  );
  const comboBuildImage = imgUrl(
    products.find(
      (p: any) =>
        p.tipo_produto === "marmita" &&
        normalizeText(p.nome).includes("file de tilapia"),
    )?.imagem_url ||
      products.find((p: any) => p.tipo_produto === "marmita" && p.imagem_url)?.imagem_url,
  );
  const comboSoupImage = imgUrl(
    products.find(
      (p: any) =>
        p.tipo_produto === "sopa" &&
        normalizeText(p.nome).includes("sopa de frango"),
    )?.imagem_url ||
      products.find((p: any) => p.tipo_produto === "sopa" && p.imagem_url)?.imagem_url,
  );
  const personalizadaImage = imgUrl(
    products.find(
      (p: any) =>
        p.tipo_produto === "marmita" &&
        normalizeText(p.nome).includes("parmegiana de frango"),
    )?.imagem_url ||
      products.find((p: any) => p.tipo_produto === "marmita" && p.imagem_url)?.imagem_url,
  );

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

  const quickCardImage = (predicate: (product: any) => boolean) =>
    imgUrl(products.find((product: any) => product.imagem_url && predicate(product))?.imagem_url);

  const lightestProductImage = imgUrl(
    [...products]
      .filter((product: any) => product.imagem_url && nutritionValue(product, "kcal") > 0)
      .sort((a: any, b: any) => nutritionValue(a, "kcal") - nutritionValue(b, "kcal"))[0]
      ?.imagem_url,
  );

  const objetivos = [
    {
      filtro: "Mais escolhidas",
      titulo: "Mais escolhidas",
      texto: "Nossos pratos mais amados.",
      icon: Trophy,
      tone: "rose",
      image: imgUrl(bestSellerProducts[0]?.imagem_url) || quickCardImage((p) => p.tipo_produto === "marmita"),
      rank: true,
    },
    {
      filtro: "Mais proteicas",
      titulo: "Mais proteína",
      texto: "Para quem busca mais proteína.",
      icon: Dumbbell,
      tone: "orange",
      image:
        quickCardImage((p) => p.tipo_produto === "marmita" && isHighProteinFlavor(p)) ||
        quickCardImage((p) => p.tipo_produto === "marmita"),
    },
    {
      filtro: "Mais leves",
      titulo: "Mais Leves",
      texto: "Opções equilibradas e nutritivas.",
      icon: Leaf,
      tone: "green",
      image: lightestProductImage || quickCardImage((p) => p.tipo_produto === "marmita"),
    },
    {
      filtro: "Sem Glúten",
      titulo: "Sem Glúten",
      texto: "Sabor e segurança para o seu dia.",
      icon: WheatOff,
      tone: "yellow",
      image:
        quickCardImage((p) => Boolean(p.sem_gluten) && p.tipo_produto === "marmita") ||
        quickCardImage((p) => Boolean(p.sem_gluten)),
    },
    {
      filtro: "Sem Lactose",
      titulo: "Sem Lactose",
      texto: "Opções deliciosas sem lactose.",
      icon: MilkOff,
      tone: "blue",
      image:
        quickCardImage((p) => Boolean(p.sem_lactose) && p.tipo_produto === "marmita") ||
        quickCardImage((p) => Boolean(p.sem_lactose)),
    },
    {
      filtro: "Sopas",
      titulo: "Sopas e Caldos",
      texto: "Conforto em qualquer momento.",
      icon: Soup,
      tone: "purple",
      image: quickCardImage((p) => p.tipo_produto === "sopa"),
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

      <HomeInfoModal kind="delivery" open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen} />
      <HomeInfoModal kind="store" open={storeModalOpen} onOpenChange={setStoreModalOpen} />
      <HomeInfoModal kind="discount" open={discountModalOpen} onOpenChange={setDiscountModalOpen} />

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

      <section className="bg-[#fbfaf5] pb-6 pt-4 md:pb-8 md:pt-6">
        <div className="mx-auto max-w-7xl px-3 md:px-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#e5e1d4] bg-[#f7f5ed] shadow-sm">
            <div className="grid lg:min-h-[390px] lg:grid-cols-[1.12fr_.88fr]">
              <div className="flex flex-col justify-center px-6 py-7 md:px-9 md:py-8 lg:px-10 lg:py-8 xl:px-12">
                <span className="mb-2.5 inline-flex w-fit rounded-full bg-[#e9f1d7] px-3 py-1 text-xs font-semibold tracking-normal text-primary">
                  Sabor e praticidade para sua rotina
                </span>
                <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.02] text-[#075636] md:text-5xl">
                  <span className="block">Comida de verdade,</span>
                  <span className="block">
                    pronta em até <span className="font-halimun font-normal text-[#91b93a]">7 minutos</span>
                  </span>
                </h1>
                <p className="mt-3 max-w-none text-sm leading-6 text-[#48554d] md:text-[15px] lg:whitespace-nowrap">
                  Marmitas artesanais congeladas, saborosas e sem conservantes para facilitar seus dias.
                </p>

                <div className="mt-2 h-1" aria-hidden="true" />
              </div>
              <div className="relative aspect-[7/5] overflow-hidden bg-[#087149] lg:aspect-auto lg:min-h-[390px]">
                {promoBanners.filter((banner) => banner?.image_url).length > 0 ? (
                  <PromoCarousel banners={promoBanners} fill className="absolute inset-0 max-w-none" />
                ) : (
                  <img src={imgUrl((settings as any)?.hero_image_url) || heroMarmitas} alt="Marmitas e sopas SaborosaMente" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {heroFeatures.map((feature: any, index: number) => {
              const Icon = [Timer, Calendar, Leaf, ShieldCheck][index] ?? Sparkles;
              const styles = [
                {
                  card: "border-[#064b30] bg-[#075636] text-white",
                  icon: "text-[#f6d83d]",
                  value: "text-white",
                  deco: "text-[#2b8a62]",
                },
                {
                  card: "border-[#0b6244] bg-[#0b6847] text-white",
                  icon: "text-[#d9ef83]",
                  value: "text-white",
                  deco: "text-[#79a83b]",
                },
                {
                  card: "border-[#789f3d] bg-[#88ad42] text-white",
                  icon: "text-white",
                  value: "text-white",
                  deco: "text-[#6fa533]",
                },
                {
                  card: "border-[#cfddb5] bg-[#eaf1d7] text-[#075636]",
                  icon: "text-[#075636]",
                  value: "text-[#075636]",
                  deco: "text-[#7ead3f]",
                },
              ][index];

              return (
                <div
                  key={`${feature.label}-${index}`}
                  className={`group relative min-h-[96px] overflow-hidden rounded-[1.25rem] border px-4 py-3 shadow-[0_6px_16px_rgba(7,86,54,.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(7,86,54,.12)] ${styles.card}`}
                >
                  <div className="relative z-10 flex h-full items-center gap-4">
                    <div className={`grid size-11 shrink-0 place-items-center ${styles.icon}`}>
                      <Icon size={34} strokeWidth={1.8} />
                    </div>

                    <p className="text-[12.5px] font-extrabold leading-[1.18] sm:text-[13.5px]">
                      <span className="block">{feature.label}</span>
                      <span className={`mt-1 block text-[1.12em] font-extrabold ${styles.value}`}>
                        {feature.value}
                      </span>
                    </p>
                  </div>

                  <Leaf
                    className={`pointer-events-none absolute -bottom-2 right-2 size-10 rotate-[-20deg] opacity-60 ${styles.deco}`}
                    strokeWidth={1.4}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8eadf] bg-[#fbfaf5] py-9 md:py-11">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6">
            <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#78922f] sm:text-[11px]">
              Tudo o que você precisa saber
            </p>
            <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <h2 className="font-display text-[2rem] font-bold leading-tight text-[#075636] md:text-[2.4rem]">
                Entrega, retirada e descontos
              </h2>
              <p className="text-[12px] leading-relaxed text-[#6a7a71] md:text-[13px]">
                Clique nos cards para ver todos os detalhes.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => setDeliveryModalOpen(true)}
              className="group overflow-hidden rounded-[1.55rem] border border-[#dce5d5] bg-white text-left shadow-[0_7px_18px_rgba(7,86,54,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(7,86,54,.11)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#edf1e9] px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#edf5e6] text-[#075636]">
                    <Truck size={19} />
                  </span>
                  <div>
                    <p className="text-[16px] font-extrabold text-[#173a2d]">Áreas de Entrega</p>
                    <p className="text-[11px] leading-relaxed text-[#708078]">Cidades selecionadas de SC + PR</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[#075636] transition group-hover:translate-x-1" />
              </div>

              <div className="p-4">
                <DeliveryRegionMiniMap className="h-[190px] w-full" />

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["São Bento do Sul", "Rio Negrinho", "Campo Alegre", "Corupá", "Mafra", "Rio Negro", "Piên"].map((city) => (
                    <span
                      key={city}
                      className="rounded-full border border-[#dfe6d9] bg-[#fafbf8] px-2 py-1 text-[10px] font-bold text-[#557061]"
                    >
                      {city}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-[12px] leading-relaxed text-[#6a7a71]">
                  Veja bairros atendidos, taxas e a localização correta de cada cidade.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStoreModalOpen(true)}
              className="group overflow-hidden rounded-[1.55rem] border border-[#dce5d5] bg-white text-left shadow-[0_7px_18px_rgba(7,86,54,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(7,86,54,.11)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#edf1e9] px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#edf5e6] text-[#075636]">
                    <ShoppingBag size={19} />
                  </span>
                  <div>
                    <p className="text-[16px] font-extrabold text-[#173a2d]">Retire em nossa loja</p>
                    <p className="text-[11px] leading-relaxed text-[#708078]">São Bento do Sul/SC</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[#075636] transition group-hover:translate-x-1" />
              </div>

              <div className="grid min-h-[275px] sm:grid-cols-[0.9fr_1.1fr]">
                <div className="flex flex-col justify-center p-4">
                  <div className="space-y-3 text-[12px] leading-relaxed text-[#607168]">
                    <p className="flex items-start gap-2">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-[#075636]" />
                      <span>Rua Augusto Wunderwald, 7 — Progresso</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock size={15} className="mt-0.5 shrink-0 text-[#075636]" />
                      <span>Seg–Sex 9h30–19h<br />Sáb 9h30–13h</span>
                    </p>
                    <p className="flex items-start gap-2 font-bold text-[#315c46]">
                      <Calendar size={15} className="mt-0.5 shrink-0" />
                      <span>Encomendas em tempo integral</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center bg-[#f7f5ed] p-3">
                  <img
                    src="/loja-saborosamente.jpg"
                    alt="Loja física SaborosaMente"
                    className="max-h-[250px] w-full rounded-2xl object-contain shadow-sm"
                  />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDiscountModalOpen(true)}
              className="group overflow-hidden rounded-[1.55rem] border border-[#dce5d5] bg-white text-left shadow-[0_7px_18px_rgba(7,86,54,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(7,86,54,.11)]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#edf1e9] px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#fff4bf] text-[#6d5b00]">
                    <Tag size={19} />
                  </span>
                  <div>
                    <p className="text-[16px] font-extrabold text-[#173a2d]">Como ganhar desconto</p>
                    <p className="text-[11px] leading-relaxed text-[#708078]">Desconto progressivo automático</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[#075636] transition group-hover:translate-x-1" />
              </div>

              <div className="p-4">
                <p className="text-center text-[13px] font-extrabold leading-snug text-[#173a2d]">
                  Quanto mais você compra,<br />mais você economiza.
                </p>

                <div className="mt-4 space-y-2">
                  {COMBO_RULES.map((rule, index) => (
                    <div
                      key={rule.min}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                        index === 0
                          ? "bg-[#f6f8ed]"
                          : index === 1
                            ? "bg-[#edf5e6]"
                            : "bg-[#e3f0d9]"
                      }`}
                    >
                      <span className="text-[12px] font-extrabold text-[#315c46]">
                        {rule.min} marmitas
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#075636] shadow-sm">
                        {rule.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-[#075636] px-3 py-3 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/65">São Bento do Sul</p>
                  <p className="mt-1 text-[11px] font-extrabold leading-relaxed">
                    Frete R$ 5,00 acima de 5 marmitas ou R$ 100,00.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf5] py-9 md:py-11">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 text-center">
            <div className="mx-auto flex max-w-xl items-center justify-center gap-3">
              <span className="hidden h-px w-16 bg-[#9bbd5d] sm:block" />
              <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.34em] text-[#315c46] sm:text-[11px]">
                Simples do início ao fim
              </p>
              <span className="hidden h-px w-16 bg-[#9bbd5d] sm:block" />
            </div>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-none text-[#075636] md:text-[2.4rem]">
              Como funciona
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[12px] leading-relaxed text-[#6a7a71] md:text-[13px]">
              Do seu pedido à sua mesa, sem complicação.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShoppingCart,
                title: "Escolha seus produtos",
                text: "Monte seu pedido com os sabores e tamanhos que preferir.",
                card: "border-[#d9e7bb] bg-[#eef6dc]",
                bubble: "bg-[#91b93a] text-white",
                titleColor: "text-[#315b2f]",
                textColor: "text-[#607157]",
              },
              {
                icon: CreditCard,
                title: "Finalize a compra",
                text: "Selecione entrega ou retirada e conclua seu pedido.",
                card: "border-[#cde2b0] bg-[#dff0c9]",
                bubble: "bg-[#76b64a] text-white",
                titleColor: "text-[#2d5d36]",
                textColor: "text-[#58705a]",
              },
              {
                icon: Truck,
                title: "Receba ou retire",
                text: "Entregamos na sua região ou você retira diretamente na loja.",
                card: "border-[#9fd7a2] bg-[#bfe9b8]",
                bubble: "bg-[#13955e] text-white",
                titleColor: "text-[#1d6040]",
                textColor: "text-[#416c55]",
              },
              {
                icon: Timer,
                title: "É só aquecer e aproveitar",
                text: "Pronto em até 7 minutos, com sabor e praticidade para o seu dia.",
                card: "border-[#076342] bg-[#087149]",
                bubble: "bg-[#123d30] text-[#f6d83d]",
                titleColor: "text-white",
                textColor: "text-white/76",
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`group relative min-h-[160px] overflow-hidden rounded-[1.45rem] border p-4 shadow-[0_6px_16px_rgba(7,86,54,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(7,86,54,.11)] ${step.card}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`grid size-11 place-items-center rounded-full shadow-sm ${step.bubble}`}>
                      <Icon size={20} strokeWidth={1.9} />
                    </div>
                    <span className={`grid size-6 place-items-center rounded-full text-[10px] font-black ${
                      index === 3 ? "bg-white/10 text-white/80" : "bg-white/70 text-[#45684f]"
                    }`}>
                      {index + 1}
                    </span>
                  </div>

                  <h3 className={`mt-4 text-[15px] font-extrabold leading-tight ${step.titleColor}`}>
                    {step.title}
                  </h3>
                  <p className={`mt-1.5 text-[12px] leading-[1.5] ${step.textColor}`}>
                    {step.text}
                  </p>

                  <div className={`pointer-events-none absolute -bottom-9 -right-7 size-24 rounded-full ${
                    index === 3 ? "bg-white/5" : "bg-white/28"
                  }`} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 text-center">
            <div className="mx-auto flex max-w-xl items-center justify-center gap-3">
              <span className="hidden h-px w-16 bg-[#9bbd5d] sm:block" />
              <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.34em] text-[#315c46] sm:text-[11px]">
                Seu pedido, ao seu jeito
              </p>
              <span className="hidden h-px w-16 bg-[#9bbd5d] sm:block" />
            </div>
            <h2 className="mt-2 font-display text-[2rem] font-bold leading-none text-[#075636] md:text-[2.4rem]">
              Escolha <span className="font-pacifico text-[.92em] font-normal text-[#6faa2d]">do seu jeito</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <OrderChoiceBanner
              icon={Gift}
              badge="Combinações prontas"
              title="Combos Prontos"
              text="Combos Prontos para facilitar na correria, separados especialmente pra você"
              action="Ver Combos"
              chips={["5, 10 ou 20 marmitas"]}
              image={comboReadyImage}
              tone="ready"
              onClick={abrirCombosProntos}
            />

            <OrderChoiceBanner
              icon={ShoppingBag}
              badge="Monte como quiser"
              title="Monte seu Combo"
              text="Monte seu combo como quiser, quanto mais comprar, mais desconto tem!"
              action="Montar Combo"
              chips={["Desconto automático"]}
              image={comboBuildImage}
              secondaryImage={comboSoupImage}
              tone="combo"
              onClick={() => setComboModalOpen(true)}
            />

            {marmitaConfig.ativo && (
              <OrderChoiceBanner
                icon={ChefHat}
                badge="Do seu jeito"
                title="Marmita Personalizada"
                text="Escolha os ingredientes, o modo de preparo e a gramatura."
                action="Marmitas Personalizadas"
                chips={[
                  "Mais de 30 opções",
                  "Tamanhos e valores por tamanho",
                  "Mínimo 3 unidades",
                ]}
                image={personalizadaImage}
                tone="personalizada"
                onClick={() => setMarmitaModalOpen(true)}
              />
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8eadf] bg-[#fbfaf5] py-9 md:py-11">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#78922f]">
                Escolha pelo seu objetivo
              </p>
              <h2 className="mt-1 font-display text-[2rem] font-bold leading-tight text-[#075636] md:text-[2.4rem]">
                Encontre mais rápido o que combina com você
              </h2>
            </div>
            <button
              type="button"
              onClick={() => abrirCardapio()}
              className="hidden text-xs font-bold text-[#075636] underline decoration-[#91b93a] decoration-2 underline-offset-4 sm:block"
            >
              Ver cardápio completo
            </button>
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6">
            {objetivos.map((objetivo) => {
              const Icon = objetivo.icon;
              const tones: Record<string, { card: string; icon: string; title: string; badge: string }> = {
                rose: {
                  card: "border-[#f2caca] bg-[#fde8e7]",
                  icon: "bg-white/72 text-[#dc4545]",
                  title: "text-[#b52f36]",
                  badge: "bg-[#f6d83d] text-[#173a2d]",
                },
                orange: {
                  card: "border-[#efc6a8] bg-[#fae2cf]",
                  icon: "bg-white/72 text-[#df7d26]",
                  title: "text-[#bf5d1e]",
                  badge: "bg-white/82 text-[#bf5d1e]",
                },
                green: {
                  card: "border-[#cde1b9] bg-[#e5f2d5]",
                  icon: "bg-white/72 text-[#4b9c3c]",
                  title: "text-[#358332]",
                  badge: "bg-white/82 text-[#358332]",
                },
                yellow: {
                  card: "border-[#ebdda1] bg-[#fff3c9]",
                  icon: "bg-white/72 text-[#d99516]",
                  title: "text-[#b87800]",
                  badge: "bg-white/82 text-[#b87800]",
                },
                blue: {
                  card: "border-[#c3ddef] bg-[#deeffb]",
                  icon: "bg-white/72 text-[#3d82c7]",
                  title: "text-[#276cab]",
                  badge: "bg-white/82 text-[#276cab]",
                },
                purple: {
                  card: "border-[#d8c9ee] bg-[#eee5fb]",
                  icon: "bg-white/72 text-[#8055c8]",
                  title: "text-[#6e42b5]",
                  badge: "bg-white/82 text-[#6e42b5]",
                },
              };
              const style = tones[objetivo.tone];

              return (
                <button
                  key={objetivo.filtro}
                  type="button"
                  onClick={() => abrirObjetivo(objetivo.filtro)}
                  className={`group relative flex min-h-[188px] w-[62vw] max-w-[210px] shrink-0 snap-start flex-col overflow-hidden rounded-[1.45rem] border p-3.5 text-left shadow-[0_6px_16px_rgba(7,86,54,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(7,86,54,.11)] md:w-auto md:max-w-none ${style.card}`}
                >
                  <div className="relative z-20 flex items-start justify-between gap-2">
                    <span className={`grid size-9 place-items-center rounded-xl shadow-sm ${style.icon}`}>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    {objetivo.rank && (
                      <span className={`grid size-7 place-items-center rounded-full text-[11px] font-black shadow-sm ${style.badge}`}>
                        1
                      </span>
                    )}
                  </div>

                  <div className="relative z-20 mt-3 max-w-[90%]">
                    <h3 className={`font-display text-[15px] font-bold leading-tight ${style.title}`}>
                      {objetivo.titulo}
                    </h3>
                    <p className="mt-1 text-[11.5px] font-medium leading-[1.5] text-[#586b61] md:text-[12px]">
                      {objetivo.texto}
                    </p>
                  </div>

                  {objetivo.image && (
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[47%]"
                      style={{
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.55) 20%, #000 48%)",
                        maskImage:
                          "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.55) 20%, #000 48%)",
                      }}
                    >
                      <img
                        src={objetivo.image}
                        alt=""
                        className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                  )}

                  <span className="relative z-20 mt-auto pt-10 text-[10px] font-extrabold text-[#365c49] opacity-0 transition group-hover:opacity-100">
                    Ver opções →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

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

            <div id="descontos" className="scroll-mt-32">
              <DiscountProgressWidget className="mb-6" />
            </div>

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
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 font-mazzard text-[11px] font-bold uppercase tracking-[0.03em] transition-all",
                        selected
                          ? "border-[#075636] bg-[#075636] text-white shadow-sm"
                          : "border-[#c6d9b9] bg-white text-[#28513a] hover:-translate-y-px hover:border-[#075636]",
                      )}
                    >
                      <FoodTypeIcon label={filter} size={14} className="shrink-0" />
                      <span>{filter}</span>
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
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.03em] transition-all",
                          selected
                            ? "border-[#075636] bg-[#075636] text-white shadow-sm"
                            : "border-[#c6d9b9] bg-white text-[#28513a] hover:border-[#075636]",
                        )}
                      >
                        <FoodTypeIcon label={filter} size={14} className="shrink-0" />
                        <span>{filter}</span>
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
                          "rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.03em] transition-all",
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
                            "rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.03em] transition-all",
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
  image,
  secondaryImage,
  tone,
  onClick,
}: {
  icon: typeof Gift;
  badge: string;
  title: string;
  text: string;
  action: string;
  chips: string[];
  image?: string;
  secondaryImage?: string;
  tone: "ready" | "combo" | "personalizada";
  onClick: () => void;
}) {
  const styles = {
    ready: {
      card: "border-[#efd66a] bg-[linear-gradient(145deg,#fff8db_0%,#fff1b2_100%)]",
      title: "text-[#073e2b]",
      text: "text-[#345849]",
      icon: "border-[#ead88a] bg-white/82 text-[#075636]",
      badge: "border-[#e7d581] bg-white/66 text-[#365b46]",
      chip: "border-[#e4cc65] bg-white/76 text-[#365846]",
      arrow: "bg-white text-[#075636]",
      deco: "text-[#78a938]",
      orb: "bg-[#f6d83d]/18",
    },
    combo: {
      card: "border-[#c6dca8] bg-[linear-gradient(145deg,#f0f8e8_0%,#dcefc8_100%)]",
      title: "text-[#073e2b]",
      text: "text-[#345849]",
      icon: "border-[#c8dcad] bg-white/80 text-[#075636]",
      badge: "border-[#c5d9a9] bg-white/65 text-[#365b46]",
      chip: "border-[#bfd5a1] bg-white/74 text-[#365846]",
      arrow: "bg-white text-[#075636]",
      deco: "text-[#5d9131]",
      orb: "bg-[#91b93a]/16",
    },
    personalizada: {
      card: "border-[#06472f] bg-[linear-gradient(145deg,#075b3b_0%,#06462f_100%)]",
      title: "text-white",
      text: "text-white/84",
      icon: "border-white/15 bg-white/10 text-[#f6d83d]",
      badge: "border-white/20 bg-white/8 text-white/84",
      chip: "border-white/18 bg-black/10 text-white",
      arrow: "bg-white text-[#075636]",
      deco: "text-[#8bc23f]",
      orb: "bg-white/5",
    },
  }[tone];

  const isCustom = tone === "personalizada";

  return (
    <article
      className={`group relative min-h-[340px] overflow-hidden rounded-[1.75rem] border shadow-[0_10px_26px_rgba(7,86,54,.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_17px_34px_rgba(7,86,54,.15)] ${styles.card}`}
    >
      <div className={`pointer-events-none absolute -right-16 top-16 size-52 rounded-full ${styles.orb}`} />
      <Leaf
        className={`pointer-events-none absolute bottom-6 left-5 size-16 rotate-[-18deg] opacity-50 ${styles.deco}`}
        strokeWidth={1.1}
      />
      <Leaf
        className={`pointer-events-none absolute bottom-20 right-[31%] size-10 rotate-[34deg] opacity-45 ${styles.deco}`}
        strokeWidth={1.1}
      />

      <div className={`relative z-20 p-5 ${isCustom ? "max-w-[58%]" : "max-w-[74%]"}`}>
        <div className="flex items-center gap-2">
          <div className={`grid size-10 shrink-0 place-items-center rounded-full border ${styles.icon}`}>
            <Icon size={18} strokeWidth={1.9} />
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.04em] ${styles.badge}`}
          >
            {badge}
          </span>
        </div>

        <h3
          className={`mt-5 font-display font-bold leading-[1.02] ${styles.title} ${
            isCustom ? "text-[1.6rem] md:text-[1.78rem]" : "text-[1.5rem] md:text-[1.65rem]"
          }`}
        >
          {title}
        </h3>

        <p
          className={`mt-3 text-[12px] leading-[1.58] md:text-[12.5px] ${styles.text} ${
            isCustom ? "max-w-[25ch]" : "max-w-[31ch]"
          }`}
        >
          {text}
        </p>

        <div className={`${isCustom ? "mt-6 space-y-2" : "mt-5 flex flex-wrap gap-2"}`}>
          {chips.map((chip, index) => (
            <span
              key={chip}
              className={`${
                isCustom
                  ? "flex w-fit max-w-[220px] items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-bold"
                  : "inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-bold"
              } ${styles.chip} ${isCustom && index === 2 ? "opacity-80" : ""}`}
            >
              {isCustom && index < 2 && (
                <span className="grid size-5 place-items-center rounded-full border border-current/20">
                  {index === 0 ? <Sparkles size={11} /> : <ShoppingBag size={11} />}
                </span>
              )}
              {chip}
            </span>
          ))}
        </div>
      </div>

      {image && (
        <div
          className={`pointer-events-none absolute z-10 ${
            isCustom
              ? "inset-y-0 right-0 w-[58%]"
              : "bottom-0 right-[-4%] h-[62%] w-[79%]"
          }`}
          style={{
            WebkitMaskImage: isCustom
              ? "linear-gradient(to right, transparent 0%, rgba(0,0,0,.24) 10%, #000 31%)"
              : "radial-gradient(ellipse 78% 86% at 70% 78%, #000 56%, rgba(0,0,0,.92) 70%, transparent 100%)",
            maskImage: isCustom
              ? "linear-gradient(to right, transparent 0%, rgba(0,0,0,.24) 10%, #000 31%)"
              : "radial-gradient(ellipse 78% 86% at 70% 78%, #000 56%, rgba(0,0,0,.92) 70%, transparent 100%)",
          }}
        >
          <img
            src={image}
            alt=""
            className={`h-full w-full max-w-none object-cover transition duration-500 group-hover:scale-[1.035] ${
              isCustom ? "object-center" : "object-[55%_52%]"
            }`}
          />
        </div>
      )}

      {secondaryImage && !isCustom && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 size-[76px] overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-lg">
          <img src={secondaryImage} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label={action}
        title={action}
        className={`absolute right-4 top-4 z-40 grid size-11 place-items-center rounded-full shadow-[0_6px_16px_rgba(0,0,0,.12)] transition duration-200 hover:scale-105 ${styles.arrow}`}
      >
        <ArrowRight size={21} strokeWidth={2.2} />
      </button>

      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 z-30 cursor-pointer"
        aria-label={action}
      >
        <span className="sr-only">{action}</span>
      </button>
    </article>
  );
}
