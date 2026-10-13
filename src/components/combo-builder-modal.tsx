import { useCommerceDialog } from "@/lib/use-commerce-dialog";
/**
 * ComboBuilderModal
 *
 * Modal para montar combos "Monte Você Mesmo".
 * Regras:
 * - Sopas e Complementos: preço fixo, sem desconto, MAS contam na quantidade
 * - Marmitas: recebem desconto progressivo por quantidade total
 *   5+  = 3% OFF
 *   10+ = 7% OFF
 *   20+ = 12% OFF
 */

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Minus, ShoppingCart, Info, Search, Tag, SlidersHorizontal, ChevronRight, Dumbbell } from "lucide-react";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { isHighProteinFlavor, maxProteinForFlavor } from "@/lib/nutrition-rules";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  COMBO_RULES,
  isNoDiscount,
  precoMarmitaPorFaixa,
  precoCheioMarmita,
  faixaPorQuantidade,
  getComboDiscount,
} from "@/lib/combo-rules";
import { usePrecosMarmita } from "@/lib/use-precos-marmita";
import { imgUrl } from "@/lib/image-proxy";

export { COMBO_RULES };

const quickFilters = [
  "Mais escolhidas", "Até 300 kcal", "Alta proteína", "Mais leves",
  "Mais calóricas", "Mais proteicas", "Frango", "Carne bovina",
  "Peixes", "Suína", "Misto", "Sopas",
];
const sortFilters = ["Mais leves", "Mais calóricas", "Mais proteicas"];
const proteinFilters = ["Frango", "Carne bovina", "Peixes", "Suína", "Misto"];
const normalizeText = (value: unknown) => String(value ?? "").toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const productText = (product: any) => normalizeText([
  product.nome, product.descricao, product.ingredientes,
  product.informacao_nutricional, product.categorias?.nome,
  product.subgrupo, product.proteina,
].join(" "));
const nutritionValue = (product: any, field: "kcal" | "prot" | "carb" | "sodio") => {
  const raw = product.tabela_nutricional_300g?.[field] ??
    product.tabela_nutricional?.[field] ??
    product.tabela_nutricional_400g?.[field] ?? "";
  const parsed = Number(String(raw).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};


function isNoDiscountLocal(categoria: string) {
  return isNoDiscount(categoria);
}

interface ComboItem {
  productId: string;
  weight: string;
  quantity: number;
  nome: string;
  preco: number;
  categoria: string;
  imagem: string;
}

interface ComboBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  combo: {
    id: string;
    nome: string;
    descricao?: string;
  };
  products: any[]; // todos os produtos do catálogo
  bestSellerIds?: Set<string>;
  bestSellerRank?: Map<string, number>;
}

export function ComboBuilderModal({ isOpen, onClose, combo, products, bestSellerIds, bestSellerRank }: ComboBuilderModalProps) {
  const { add } = useCart();
  const tabelaPrecos = usePrecosMarmita();
  const [items, setItems] = useState<ComboItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const dialogRef = useCommerceDialog(isOpen && !detailProduct, onClose);
  const subgroups = useMemo(() => Array.from(new Set(
    products.map((p: any) => String(p.subgrupo || "").trim()).filter(Boolean),
  )).sort((a: string, b: string) => a.localeCompare(b, "pt-BR")), [products]);
  const restrictionFilters = [
    ...(products.some((p: any) => p.sem_gluten) ? ["Sem Glúten"] : []),
    ...(products.some((p: any) => p.sem_lactose) ? ["Sem Lactose"] : []),
  ];
  const toggleFilter = (filter: string) => {
    setSelectedFilters((current) => current.includes(filter)
      ? current.filter((item) => item !== filter)
      : [...current.filter((item) => !sortFilters.includes(filter) || !sortFilters.includes(item)), filter]);
  };

  // ── Categorias disponíveis ────────────────────────────────────────────────
  // Respeita a MESMA ordem definida no admin (ordem_filtro) — igual à home.
  const categories = useMemo(() => {
    const ordemPorCategoria = new Map<string, number>();
    products.forEach((p: any) => {
      const cat = p.categorias?.nome || p.categoria || "";
      if (!cat || cat.toLowerCase().includes("combo")) return;
      // guarda a menor ordem_filtro vista para a categoria (fallback 999)
      const ordem = Number(p.categorias?.ordem_filtro ?? 999);
      if (!ordemPorCategoria.has(cat) || ordem < ordemPorCategoria.get(cat)!) {
        ordemPorCategoria.set(cat, ordem);
      }
    });
    const ordenadas = Array.from(ordemPorCategoria.keys()).sort((a, b) => {
      const oa = ordemPorCategoria.get(a)!;
      const ob = ordemPorCategoria.get(b)!;
      if (oa !== ob) return oa - ob;
      return a.localeCompare(b); // desempate alfabético
    });
    return ["Todas", ...ordenadas];
  }, [products]);

  // Mesmos filtros e ordenações da vitrine; a categoria continua em uma linha.
  const filteredProducts = useMemo(() => {
    let result = products.filter((p: any) => {
      const cat = p.categorias?.nome || p.categoria || "";
      return (selectedCategory === "Todas" || cat === selectedCategory) &&
        (!search.trim() || productText(p).includes(normalizeText(search.trim())));
    });
    const selectedSubgroups = selectedFilters.filter((f) => f.startsWith("Subgrupo:"))
      .map((f) => f.slice("Subgrupo:".length));
    if (selectedSubgroups.length) result = result.filter((p: any) => selectedSubgroups.includes(p.subgrupo));
    const proteins = selectedFilters.filter((f) => proteinFilters.includes(f));
    if (proteins.length) result = result.filter((p: any) => proteins.some((filter) => {
      const cadastrado = String(p.proteina || "").trim();
      if (cadastrado) return filter === "Peixes"
        ? cadastrado === "Peixe" || cadastrado === "Peixes" : cadastrado === filter;
      const text = productText(p);
      if (filter === "Frango") return /frango|ave|peito de frango/.test(text);
      if (filter === "Carne bovina") return /patinho|carne bovina|ac[eé]m|cox[aã]o|alcatra|mignon|carne mo[ií]da/.test(text);
      if (filter === "Peixes") return /peixe|salmao|tilapia|atum/.test(text);
      if (filter === "Suína") return /bacon|calabresa|suina|paio/.test(text);
      return false;
    }));
    if (selectedFilters.includes("Sem Glúten")) result = result.filter((p: any) => p.sem_gluten);
    if (selectedFilters.includes("Sem Lactose")) result = result.filter((p: any) => p.sem_lactose);
    if (selectedFilters.includes("Mais escolhidas")) result = result.filter((p: any) => bestSellerIds?.has(p.id));
    if (selectedFilters.includes("Até 300 kcal")) result = result.filter((p: any) => {
      const value = nutritionValue(p, "kcal"); return value > 0 && value <= 300;
    });
    if (selectedFilters.includes("Alta proteína")) result = result.filter((p: any) => isHighProteinFlavor(p));
    if (selectedFilters.includes("Sopas")) result = result.filter((p: any) =>
      normalizeText(p.categorias?.nome || p.categoria).includes("sopa") || /^so\d+/i.test(String(p.nome || "")));
    return [...result].sort((a: any, b: any) => {
      if (selectedFilters.includes("Mais escolhidas")) {
        return (bestSellerRank?.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (bestSellerRank?.get(b.id) ?? Number.MAX_SAFE_INTEGER);
      }
      const order = [...selectedFilters].reverse().find((f) => sortFilters.includes(f));
      if (order === "Mais leves") return nutritionValue(a, "kcal") - nutritionValue(b, "kcal");
      if (order === "Mais calóricas") return nutritionValue(b, "kcal") - nutritionValue(a, "kcal");
      if (order === "Mais proteicas") return maxProteinForFlavor(b) - maxProteinForFlavor(a);
      return (a.categorias?.ordem_filtro ?? 999) - (b.categorias?.ordem_filtro ?? 999) ||
        (a.ordem ?? 999) - (b.ordem ?? 999);
    });
  }, [products, selectedCategory, search, selectedFilters, bestSellerIds, bestSellerRank]);

  // ── Totais (usa a tabela de preços por faixa — mesma lógica do carrinho) ────
  const { totalQty, subtotal, discount, total } = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    let subtotalCheio = 0;
    let subtotalEfetivo = 0;
    for (const i of items) {
      const semDesc = isNoDiscount(i.categoria);
      if (semDesc) {
        subtotalCheio += i.preco * i.quantity;
        subtotalEfetivo += i.preco * i.quantity;
      } else {
        const cheio = precoCheioMarmita(i.weight, tabelaPrecos) || i.preco;
        const efetivo = precoMarmitaPorFaixa(i.weight, totalQty, cheio, tabelaPrecos);
        subtotalCheio += cheio * i.quantity;
        subtotalEfetivo += efetivo * i.quantity;
      }
    }
    return {
      totalQty,
      subtotal: subtotalCheio,
      discount: Math.max(0, subtotalCheio - subtotalEfetivo),
      total: subtotalEfetivo,
    };
  }, [items, tabelaPrecos]);

  // Early return APÓS todos os hooks
  if (!isOpen) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getPrice(product: any, weight: string) {
    const cat = product.categorias?.nome || product.categoria || "";
    if (isNoDiscountLocal(cat)) return product.preco ?? 0;
    if (weight === "300g" && product.preco_300g) return product.preco_300g;
    if (weight === "400g" && product.preco_400g) return product.preco_400g;
    return product.preco ?? 0;
  }

  function getWeights(product: any): string[] {
    if (product.tipo_produto === "complemento") return ["150g"];
    if (product.tipo_produto === "sopa") return ["400g"];
    if (product.preco_300g || product.preco_400g) return [
      "200g", ...(product.preco_300g ? ["300g"] : []),
      ...(product.preco_400g ? ["400g"] : []),
    ];
    const peso = String(product.peso || "");
    if (peso.includes("-")) return peso.split("-").map((w: string) => w.trim());
    if (peso.includes(",")) return peso.split(",").map((w: string) => w.trim());
    return peso ? [peso] : ["200g"];
  }

  function getItemKey(productId: string, weight: string) {
    return `${productId}__${weight}`;
  }

  function getQty(productId: string, weight: string) {
    return items.find((i) => i.productId === productId && i.weight === weight)?.quantity ?? 0;
  }

  function changeQty(product: any, weight: string, delta: number) {
    const cat = product.categorias?.nome || product.categoria || "";
    const preco = getPrice(product, weight);
    const key = getItemKey(product.id, weight);

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.weight === weight);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0)
          return prev.filter((i) => !(i.productId === product.id && i.weight === weight));
        return prev.map((i) =>
          i.productId === product.id && i.weight === weight ? { ...i, quantity: newQty } : i,
        );
      }
      if (delta <= 0) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          weight,
          quantity: delta,
          nome: product.nome,
          preco,
          categoria: cat,
          imagem: product.imagem_url || product.imagem || "",
        },
      ];
    });
  }

  function handleAddToCart() {
    if (items.length === 0) {
      toast.error("Adicione pelo menos 1 item ao combo.");
      return;
    }
    items.forEach((item) => {
      add(item.productId, item.quantity, item.weight);
    });
    toast.success(`Combo adicionado!`, {
      description: `${totalQty} itens${discount > 0 ? ` — você economiza ${formatBRL(discount)}` : ""}`,
    });
    onClose();
    setItems([]);
    setSearch("");
    setSelectedCategory("Todas");
    setSelectedFilters([]);
    setFiltersOpen(false);
  }

  const nextRule = [...COMBO_RULES].sort((a, b) => a.min - b.min).find((r) => r.min > totalQty);
  const currentRule = getComboDiscount(totalQty);
  const activeFilterCount = selectedFilters.length + (selectedCategory === "Todas" ? 0 : 1);

  const modalContent = (
    <div className={cn("fixed inset-0 flex items-end md:items-center justify-center md:p-4", detailProduct ? "z-40" : "z-[9999]")}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Monte seu Combo" className="relative w-full max-w-5xl max-h-[100dvh] md:max-h-[95vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho único em todas as telas: título à esquerda e descontos à direita. */}
        <header className="relative shrink-0 bg-[#086e45] px-2 pb-2 pt-2 text-white sm:px-4 lg:px-7 lg:py-3">
          <div className="flex min-w-0 flex-row items-center gap-1.5 sm:gap-3 lg:gap-5">
            <div className="min-w-0 basis-[42%] shrink-0 sm:basis-[40%] lg:basis-[37%]">
              <h2 className="text-[15px] font-bold leading-tight sm:text-xl">{combo.nome}</h2>
              <p className="mt-1 text-[10px] leading-snug text-white/85 sm:text-sm lg:text-base">
                Escolha suas marmitas — quanto mais, maior o desconto!
              </p>
            </div>

            <div className="min-w-0 flex-1 self-stretch border-l border-white/40 pl-1.5 pt-8 sm:pl-3 md:pr-10 md:pt-0 lg:pl-5 lg:pr-12">
              <div className="mx-auto grid w-full max-w-[560px] grid-cols-3 gap-1 sm:gap-2">
                {[...COMBO_RULES].sort((a, b) => a.min - b.min).map((rule) => {
                  const active = totalQty >= rule.min;
                  return (
                    <div key={rule.min} className={cn(
                      "flex min-w-0 flex-col items-center justify-center rounded-lg border px-0.5 py-2 text-center leading-tight transition-colors sm:rounded-xl sm:px-1",
                      active
                        ? "border-[#b7e7d1] bg-[#d4f0df] text-[#075636]"
                        : "border-white/80 bg-white text-[#526457]",
                    )}>
                      <span className="flex items-center justify-center gap-0.5 whitespace-nowrap text-[9px] font-extrabold sm:gap-1 sm:text-xs">
                        <Tag size={12} className="hidden shrink-0 min-[430px]:block" /> {rule.badge}
                      </span>
                      <span className="mt-1 whitespace-nowrap text-[9px] font-medium sm:text-xs">{rule.min}+ ITENS</span>
                    </div>
                  );
                })}
              </div>
              <p aria-live="polite" className="mt-1 text-center text-[10px] font-medium leading-tight text-white/85 sm:text-xs">
                {nextRule
                  ? <>Faltam <strong className="font-bold text-white">{nextRule.min - totalQty} {nextRule.min - totalQty === 1 ? "marmita" : "marmitas"}</strong> para {nextRule.badge}</>
                  : <strong className="text-white">Parabéns! Você desbloqueou o maior desconto: {currentRule?.badge}.</strong>}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Fechar modal"
            onClick={onClose}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border border-white/65 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:size-8 md:size-9 lg:right-3 lg:top-3"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Coluna esquerda — catálogo */}
          <div className="flex-1 flex flex-col overflow-hidden md:border-r">
            {/* Busca + filtro avançado ao lado, categorias em linha única */}
            <div className="relative shrink-0 space-y-2 px-3 pb-3 pt-3 md:px-4">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Buscar marmita..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 rounded-xl pl-9 text-base"
                  />
                </div>
                <button type="button" aria-expanded={filtersOpen} aria-controls="combo-filtros"
                  onClick={() => setFiltersOpen((value) => !value)}
                  className={cn(
                    "relative flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors",
                    filtersOpen || activeFilterCount ? "border-[#087443] bg-[#e5f2e9] text-[#075636]" :
                      "border-[#cfe0c4] bg-[#f3f7ee] text-[#087443]",
                  )}>
                  <SlidersHorizontal size={17} /> Filtros
                  {activeFilterCount > 0 && <span className="rounded-full bg-[#086e45] px-1.5 text-[11px] text-white">{activeFilterCount}</span>}
                </button>
              </div>
              <div aria-label="Categorias de marmitas" className="flex w-full gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button key={cat} type="button" aria-pressed={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors sm:text-sm",
                      selectedCategory === cat
                        ? "border-[#086e45] bg-[#086e45] text-white"
                        : "border-transparent bg-gray-50 text-gray-600 hover:border-[#086e45]/30",
                    )}>
                    {cat}
                  </button>
                ))}
              </div>
              {/* A mesma legenda de selos usada no cardápio, em um único local no topo. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-[#dce7d5] bg-white/70 px-2.5 py-2 text-xs text-[#315440] sm:gap-x-4">
                <span className="font-semibold">Legenda</span>
                <span className="inline-flex items-center gap-1.5"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#b96527] text-[#fff8ed] shadow-sm"><Dumbbell size={16} /></span>Alta proteína</span>
                <span className="inline-flex items-center gap-1.5"><img src="/selo-sem-gluten.png" alt="" className="size-6 shrink-0 object-contain" />Sem glúten</span>
                <span className="inline-flex items-center gap-1.5"><img src="/selo-sem-lactose.png" alt="" className="size-6 shrink-0 object-contain" />Sem lactose</span>
              </div>
              {filtersOpen && (
                <div id="combo-filtros" className="absolute left-3 right-3 top-[calc(100%-4px)] z-30 max-h-[55dvh] overflow-y-auto overscroll-contain rounded-2xl border border-[#cfe0c4] bg-[#f5f9f1] p-3 shadow-xl md:left-4 md:right-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-[#075636]">Encontre suas favoritas</p>
                    <button type="button" onClick={() => { setSelectedFilters([]); setSelectedCategory("Todas"); }}
                      className="text-xs font-semibold text-[#075636] underline">Limpar filtros</button>
                  </div>
                  <p className="mb-2 text-xs font-bold uppercase text-[#567044]">Preferências</p>
                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((filter) => (
                      <button key={filter} type="button" aria-pressed={selectedFilters.includes(filter)}
                        onClick={() => toggleFilter(filter)}
                        className={cn("rounded-full border px-3 py-2 text-xs font-semibold uppercase",
                          selectedFilters.includes(filter)
                            ? "border-[#075636] bg-[#075636] text-white"
                            : "border-[#c6d9b9] bg-white text-[#28513a]")}>
                        {filter}
                      </button>
                    ))}
                  </div>
                  {restrictionFilters.length > 0 && <>
                    <div className="my-3 border-t border-[#cfe0c4]" />
                    <p className="mb-2 text-xs font-bold uppercase text-[#567044]">Restrições</p>
                    <div className="flex flex-wrap gap-2">
                      {restrictionFilters.map((filter) => (
                        <button key={filter} type="button" aria-pressed={selectedFilters.includes(filter)}
                          onClick={() => toggleFilter(filter)}
                          className={cn("rounded-full border px-3 py-2 text-xs font-semibold uppercase",
                            selectedFilters.includes(filter) ? "border-[#075636] bg-[#075636] text-white" :
                              "border-[#c6d9b9] bg-white text-[#28513a]")}>{filter}</button>
                      ))}
                    </div>
                  </>}
                  <div className="my-3 border-t border-[#cfe0c4]" />
                  <p className="mb-2 text-xs font-bold uppercase text-[#567044]">Categorias</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button key={cat} type="button" aria-pressed={selectedCategory === cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn("rounded-full border px-3 py-2 text-xs font-semibold uppercase",
                          selectedCategory === cat ? "border-[#075636] bg-[#075636] text-white" :
                            "border-[#c6d9b9] bg-white text-[#28513a]")}>{cat}</button>
                    ))}
                  </div>
                  {subgroups.length > 0 && <>
                    <div className="my-3 border-t border-[#cfe0c4]" />
                    <p className="mb-2 text-xs font-bold uppercase text-[#567044]">Subgrupos</p>
                    <div className="flex flex-wrap gap-2">
                      {subgroups.map((subgroup) => {
                        const key = "Subgrupo:" + subgroup;
                        return <button key={key} type="button" aria-pressed={selectedFilters.includes(key)}
                          onClick={() => toggleFilter(key)}
                          className={cn("rounded-full border px-3 py-2 text-xs font-semibold uppercase",
                            selectedFilters.includes(key) ? "border-[#075636] bg-[#075636] text-white" :
                              "border-[#c6d9b9] bg-white text-[#28513a]")}>{subgroup}</button>;
                      })}
                    </div>
                  </>}
                  <button type="button" onClick={() => setFiltersOpen(false)}
                    className="mt-4 w-full rounded-xl bg-[#086e45] px-3 py-2.5 text-sm font-semibold text-white">
                    Ver {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"}
                  </button>
                </div>
              )}
            </div>

            {/* Lista de produtos */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-600 text-base">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredProducts.map((product: any) => {
                  const cat = product.categorias?.nome || product.categoria || "";
                  const noDiscount = isNoDiscount(cat);
                  const weights = getWeights(product);

                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-gray-100 hover:border-[#086e45]/20 hover:bg-gray-50/50 transition-all overflow-hidden"
                    >
                      <button type="button" onClick={() => setDetailProduct(product)}
                        aria-label={"Ver informações completas de " + product.nome}
                        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-[#f6f9f4]">
                        <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                          {product.imagem_url || product.imagem ? (
                            <img src={imgUrl(product.imagem_url || product.imagem)} alt={product.nome}
                              className="h-full w-full object-cover" loading="lazy" />
                          ) : <div className="flex h-full w-full items-center justify-center text-lg text-gray-300">🍱</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug text-gray-900 sm:text-base">
                            {product.nome}
                            {isHighProteinFlavor(product) && (
                              <span className="ml-1 inline-grid size-[22px] align-middle place-items-center rounded-full bg-[#b96527] text-[#fff8ed] shadow-sm" title="Alta proteína" role="img" aria-label="Alta proteína">
                                <Dumbbell size={14} />
                              </span>
                            )}
                            {product.sem_gluten && (
                              <img src="/selo-sem-gluten.png" alt="Sem glúten" title="Sem glúten" className="ml-1 inline-block size-[22px] align-middle object-contain" />
                            )}
                            {product.sem_lactose && (
                              <img src="/selo-sem-lactose.png" alt="Sem lactose" title="Sem lactose" className="ml-1 inline-block size-[22px] align-middle object-contain" />
                            )}
                          </p>
                          {product.ingredientes && (
                            <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                              {Array.isArray(product.ingredientes) ? product.ingredientes.join(", ") : String(product.ingredientes)}
                            </p>
                          )}
                          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#086e45] sm:text-sm">
                            <Info size={14} /> Toque para ver detalhes <ChevronRight size={14} />
                          </span>
                          {noDiscount && <span className="ml-2 inline-block rounded-full bg-[#f0f2ef] px-1.5 py-0.5 text-[10px] text-gray-600">Preço fixo</span>}
                        </div>
                      </button>
                      <div className={cn(
                        "grid gap-1 border-t border-gray-100 px-1 pb-2 pt-2 sm:gap-2 sm:px-3 lg:gap-1.5 lg:pb-2 lg:pt-2",
                        weights.length >= 3 ? "grid-cols-3" : weights.length === 2 ? "grid-cols-2" : "max-w-[220px] grid-cols-1",
                      )}>
                        {weights.map((w) => {
                          const price = getPrice(product, w);
                          const qty = getQty(product.id, w);
                          const fullPrice = noDiscount ? price : precoCheioMarmita(w, tabelaPrecos) || price;
                          const tierPrice = noDiscount ? price : precoMarmitaPorFaixa(w, totalQty, fullPrice, tabelaPrecos);
                          const hasDiscount = !noDiscount && tierPrice < fullPrice;
                          return (
                            <div key={w} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#dce8df] bg-[#fdfefd] px-1 py-1.5 text-center sm:px-2 lg:flex-row lg:justify-between lg:gap-1 lg:py-2">
                              {/* Três gramaturas em paralelo no mobile, sem rolagem horizontal. */}
                              <div className="flex min-w-0 items-center justify-center gap-1 leading-tight lg:gap-1.5">
                                <span className="shrink-0 text-[10px] font-bold text-gray-600 sm:text-xs">{w}</span>
                                <div className="flex min-w-0 flex-col items-center justify-center leading-tight">
                                  {hasDiscount && <span className="whitespace-nowrap text-[9px] text-gray-500 line-through">{formatBRL(fullPrice)}</span>}
                                  <span className="whitespace-nowrap text-[10px] font-bold text-[#086e45] sm:text-xs">
                                    {formatBRL(hasDiscount ? tierPrice : price)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center justify-center gap-0.5">
                                <button type="button" aria-label={"Diminuir " + product.nome + ", " + w}
                                  onClick={() => changeQty(product, w, -1)} disabled={qty === 0}
                                  className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border sm:size-7",
                                    qty > 0 ? "border-[#086e45] text-[#086e45]" : "border-gray-200 text-gray-300")}>
                                  <Minus size={12} />
                                </button>
                                <span className={cn("min-w-[12px] text-center text-[11px] font-semibold tabular-nums sm:text-xs", qty > 0 ? "text-[#086e45]" : "text-gray-400")}>{qty}</span>
                                <button type="button" aria-label={"Aumentar " + product.nome + ", " + w}
                                  onClick={() => changeQty(product, w, 1)}
                                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#086e45] text-white sm:size-7">
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Rodapé compacto no mobile; sidebar completa no desktop. */}
          <div className="grid w-full shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2.5 md:flex md:w-72 md:flex-col md:gap-0 md:border-t-0 md:px-0 md:pb-0 md:pt-0">
            {/* À direita do mobile: resumo do combo e quantidade. */}
            <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-between gap-1 md:border-b md:px-4 md:pb-2 md:pt-4">
              <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-[#064e32] md:gap-2 md:text-lg">
                <ShoppingCart size={15} className="shrink-0" /> Seu combo
              </h3>
              <span className="shrink-0 text-sm font-bold text-[#086e45] md:text-base">{totalQty}</span>
            </div>

            {/* Itens selecionados: continuam detalhados apenas na barra lateral desktop. */}
            <div className="hidden md:block md:max-h-none md:flex-1 md:space-y-2 md:overflow-y-auto md:px-4 md:py-3">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-2 text-3xl">🍱</div>
                  <p className="text-sm text-gray-600">Adicione marmitas ao seu combo</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={getItemKey(item.productId, item.weight)} className="flex items-center gap-2 text-sm">
                    <span className="w-5 shrink-0 text-center font-bold text-[#086e45]">{item.quantity}×</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-tight text-gray-800">{item.nome}</p>
                      <p className="text-gray-600">{item.weight}</p>
                    </div>
                    <span className="shrink-0 font-bold text-gray-600">{formatBRL(item.preco * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>

            {/* À esquerda do mobile: subtotal, desconto e total sempre visíveis. */}
            <div className="col-start-1 row-span-2 row-start-1 flex min-w-0 flex-col justify-center gap-1 self-stretch text-[11px] leading-tight md:gap-1.5 md:border-t md:px-4 md:pt-3 md:text-sm">
              <div className="flex min-w-0 items-center justify-between gap-1 text-gray-500">
                <span>Subtotal</span>
                <span className="shrink-0 tabular-nums">{formatBRL(subtotal)}</span>
              </div>
              <div className={cn("flex min-w-0 items-center justify-between gap-1 font-medium text-green-700", discount <= 0 && "md:hidden")}>
                <span>Desconto</span>
                <span className="shrink-0 tabular-nums">− {formatBRL(discount)}</span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-1 border-t border-gray-200 pt-1 text-sm font-bold text-gray-900 md:text-base">
                <span>Total</span>
                <span className="shrink-0 tabular-nums text-[#086e45]">{formatBRL(total)}</span>
              </div>
            </div>

            {/* À direita do mobile, imediatamente abaixo de Seu combo. */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={items.length === 0}
              className={cn(
                "col-start-2 row-start-2 flex min-h-11 w-full min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-semibold leading-tight transition-colors sm:text-xs md:mt-3 md:min-h-12 md:gap-2 md:rounded-2xl md:py-3.5 md:text-base",
                items.length > 0
                  ? "bg-[#086e45] text-white hover:bg-[#065a38] md:shadow-lg"
                  : "cursor-not-allowed bg-gray-100 text-gray-600",
              )}
            >
              <ShoppingCart size={15} className="shrink-0" />
              <span>Adicionar ao carrinho</span>
              {totalQty > 0 && (
                <span className="hidden rounded-full bg-white/20 px-2 py-0.5 text-sm md:inline">{totalQty} itens</span>
              )}
            </button>

            {/* Aviso de preço fixo somente quando houver sopas/complementos. */}
            {items.some((i) => isNoDiscountLocal(i.categoria)) && (
              <div className="col-span-2 row-start-3 flex items-start gap-1.5 rounded-lg bg-blue-50 p-2 text-[11px] text-blue-700 md:mt-3 md:mx-4 md:text-sm">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>Sopas e complementos têm preço fixo, sem desconto, mas contam na quantidade do combo.</span>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );

  // Renderiza via portal no body — escapa de qualquer ancestral com transform/
  // filter/overflow (ex.: gradientes com blur do layout) que prendia o modal
  // atrás do cabeçalho do site.
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      {modalContent}
      {detailProduct && (
        <ProductDetailModal
          isOpen
          onClose={() => setDetailProduct(null)}
          product={detailProduct}
          allProducts={products}
          comboCount={totalQty}
          onAddToCombo={(weight, quantity) => {
            changeQty(detailProduct, weight, quantity);
            setDetailProduct(null);
          }}
        />
      )}
    </>,
    document.body,
  );
}
