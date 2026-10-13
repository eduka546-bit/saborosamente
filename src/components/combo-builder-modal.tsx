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
        {/* Header */}
        <div className="bg-[#086e45] px-4 md:px-6 py-3 md:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">{combo.nome}</h2>
            <p className="text-base text-white/75 mt-0.5">
              Escolha suas marmitas — quanto mais, maior o desconto!
            </p>
          </div>
          <button
            aria-label="Fechar modal"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Faixas compactas em uma única linha no mobile. */}
        <div className="shrink-0 border-b bg-[#eef5f0] px-3 py-3 md:px-6">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[...COMBO_RULES].sort((a, b) => a.min - b.min).map((rule) => {
              const active = totalQty >= rule.min;
              return (
                <div key={rule.min} className={cn(
                  "flex min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-2 text-center leading-tight transition-colors",
                  active ? "border-[#086e45] bg-[#dcefe3] text-[#075636]" :
                    "border-[#d6e7dd] bg-white/70 text-[#526457]",
                )}>
                  <span className="flex items-center justify-center gap-1 text-[12px] font-extrabold sm:text-sm">
                    <Tag size={12} className="shrink-0" /> {rule.badge}
                  </span>
                  <span className="mt-1 text-[11px] font-medium sm:text-xs">{rule.min}+ ITENS</span>
                </div>
              );
            })}
          </div>
          <p aria-live="polite" className="mt-2 text-center text-xs font-medium text-[#315440] sm:text-sm">
            {nextRule
              ? <>Faltam <strong className="text-[#086e45]">{nextRule.min - totalQty} {nextRule.min - totalQty === 1 ? "marmita" : "marmitas"}</strong> para {nextRule.badge}</>
              : <strong className="text-[#086e45]">Parabéns! Você desbloqueou o maior desconto: {currentRule?.badge}.</strong>}
          </p>
        </div>

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
                        "grid gap-1.5 border-t border-gray-100 px-2 pb-3 pt-2 sm:gap-2 sm:px-3 lg:gap-1.5 lg:pb-2 lg:pt-2",
                        weights.length >= 3 ? "grid-cols-3" : weights.length === 2 ? "grid-cols-2" : "max-w-[180px] grid-cols-1",
                      )}>
                        {weights.map((w) => {
                          const price = getPrice(product, w);
                          const qty = getQty(product.id, w);
                          const fullPrice = noDiscount ? price : precoCheioMarmita(w, tabelaPrecos) || price;
                          const tierPrice = noDiscount ? price : precoMarmitaPorFaixa(w, totalQty, fullPrice, tabelaPrecos);
                          const hasDiscount = !noDiscount && tierPrice < fullPrice;
                          return (
                            <div key={w} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-1 gap-y-1 rounded-xl border border-[#dce8df] bg-[#fdfefd] px-1.5 py-2 text-center min-[390px]:px-2 lg:flex lg:flex-row lg:justify-between lg:gap-1 lg:px-2.5 lg:py-1.5">
                              <span className="shrink-0 text-[11px] font-bold text-gray-600 sm:text-sm lg:text-xs">{w}</span>
                              <div className="flex min-w-0 flex-col items-end justify-center leading-tight lg:items-center lg:flex-1">
                                {hasDiscount && <span className="text-[10px] text-gray-500 line-through">{formatBRL(fullPrice)}</span>}
                                <span className="whitespace-nowrap text-[11px] font-bold text-[#086e45] sm:text-sm lg:text-xs">
                                  {formatBRL(hasDiscount ? tierPrice : price)}
                                </span>
                              </div>
                              <div className="col-span-2 flex w-full items-center justify-center gap-0.5 sm:gap-1 lg:col-auto lg:w-auto lg:shrink-0 lg:gap-0.5">
                                <button type="button" aria-label={"Diminuir " + product.nome + ", " + w}
                                  onClick={() => changeQty(product, w, -1)} disabled={qty === 0}
                                  className={cn("flex size-6 min-[360px]:size-7 min-[400px]:size-8 shrink-0 items-center justify-center rounded-full border sm:size-9 lg:size-7",
                                    qty > 0 ? "border-[#086e45] text-[#086e45]" : "border-gray-200 text-gray-300")}>
                                  <Minus size={14} />
                                </button>
                                <span className={cn("min-w-3 text-center text-xs font-semibold tabular-nums sm:text-sm lg:text-xs", qty > 0 ? "text-[#086e45]" : "text-gray-400")}>{qty}</span>
                                <button type="button" aria-label={"Aumentar " + product.nome + ", " + w}
                                  onClick={() => changeQty(product, w, 1)}
                                  className="flex size-6 min-[360px]:size-7 min-[400px]:size-8 shrink-0 items-center justify-center rounded-full bg-[#086e45] text-white sm:size-9 lg:size-7">
                                  <Plus size={14} />
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

          {/* Coluna direita — resumo */}
          <div className="w-full md:w-72 flex flex-col shrink-0 border-t md:border-t-0">
            <div className="px-4 pt-4 pb-2 border-b shrink-0">
              <h3 className="text-lg font-semibold text-[#064e32] tracking-normal flex items-center gap-2">
                <ShoppingCart size={14} /> Seu combo
                <span className="ml-auto text-[#086e45] font-bold text-base">{totalQty}</span>
              </h3>
            </div>

            {/* Itens selecionados — escondido no mobile */}
            <div className="hidden md:block max-h-none md:flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-3xl mb-2">🍱</div>
                  <p className="text-sm text-gray-600">Adicione marmitas ao seu combo</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={getItemKey(item.productId, item.weight)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="font-bold text-[#086e45] w-5 text-center shrink-0">
                      {item.quantity}×
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-800 font-medium leading-tight">
                        {item.nome}
                      </p>
                      <p className="text-gray-600">{item.weight}</p>
                    </div>
                    <span className="font-bold text-gray-600 shrink-0">
                      {formatBRL(item.preco * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Totais e CTA */}
            <div className="px-4 pb-4 pt-3 border-t space-y-3 shrink-0">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Desconto nas marmitas</span>
                    <span>− {formatBRL(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t">
                  <span>Total</span>
                  <span className="text-[#086e45]">{formatBRL(total)}</span>
                </div>
              </div>

              {/* Info sobre sopas */}
              {items.some((i) => isNoDiscountLocal(i.categoria)) && (
                <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-2.5 text-sm text-blue-700">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <span>
                    Sopas e complementos têm preço fixo e não recebem desconto, mas contam na
                    quantidade do combo.
                  </span>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={items.length === 0}
                className={cn(
                  "w-full rounded-2xl py-3.5 text-base font-semibold transition-all flex items-center justify-center gap-2",
                  items.length > 0
                    ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg hover:shadow-[#086e45]/30"
                    : "bg-gray-100 text-gray-600 cursor-not-allowed",
                )}
              >
                <ShoppingCart size={16} />
                Adicionar ao carrinho
                {totalQty > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                    {totalQty} itens
                  </span>
                )}
              </button>
            </div>
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
