/**
 * ComboBuilderModal
 *
 * Modal para montar combos "Monte Você Mesmo".
 * Regras:
 * - Sopas e Complementos: preço fixo, sem desconto, MAS contam na quantidade
 * - Marmitas: recebem desconto progressivo por quantidade total
 *   5+  = 3% OFF
 *   10+ = 5% OFF
 *   20+ = 7% OFF
 */

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Minus, ShoppingCart, Info, Search, Tag } from "lucide-react";
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
} from "@/lib/combo-rules";

export { COMBO_RULES };

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
}

export function ComboBuilderModal({ isOpen, onClose, combo, products }: ComboBuilderModalProps) {
  const { add } = useCart();
  const [items, setItems] = useState<ComboItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

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

  // ── Produtos filtrados ────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const cat = p.categorias?.nome || p.categoria || "";
      const matchCat = selectedCategory === "Todas" || cat === selectedCategory;
      const matchSearch = !search || p.nome?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

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
        const cheio = precoCheioMarmita(i.weight) || i.preco;
        const efetivo = precoMarmitaPorFaixa(i.weight, totalQty, cheio);
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
  }, [items]);

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
    const peso = product.peso || "";
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
  }

  const nextRule = COMBO_RULES.slice()
    .reverse()
    .find((r) => r.min > totalQty);
  const currentRule = COMBO_RULES.find((r) => totalQty >= r.min);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[100dvh] md:max-h-[95vh] rounded-t-3xl md:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#086e45] px-4 md:px-6 py-3 md:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black">{combo.nome}</h2>
            <p className="text-sm text-white/75 mt-0.5">
              Escolha suas marmitas — quanto mais, maior o desconto!
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de progresso do desconto */}
        <div className="bg-[#086e45]/5 border-b px-6 py-3 shrink-0">
          <div className="flex items-center gap-6 flex-wrap">
            {COMBO_RULES.slice()
              .reverse()
              .map((rule) => {
                const active = totalQty >= rule.min;
                const isCurrent = currentRule?.min === rule.min;
                return (
                  <div
                    key={rule.min}
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold transition-all",
                      active ? "text-[#086e45]" : "text-gray-400",
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 px-2 rounded-full flex items-center gap-1 transition-all",
                        active ? "bg-[#086e45] text-white" : "bg-gray-200 text-gray-400",
                      )}
                    >
                      <Tag size={10} />
                      {rule.badge}
                    </div>
                    {rule.min}+ itens
                    {isCurrent && <span className="text-[#086e45]">✓</span>}
                  </div>
                );
              })}
            {nextRule && totalQty > 0 && (
              <span className="text-xs text-gray-400 ml-auto">
                Faltam <strong className="text-[#086e45]">{nextRule.min - totalQty}</strong> para{" "}
                {nextRule.badge}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Coluna esquerda — catálogo */}
          <div className="flex-1 flex flex-col overflow-hidden md:border-r">
            {/* Busca e filtro */}
            <div className="px-4 pt-4 pb-3 space-y-3 shrink-0">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar marmita..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all border",
                      selectedCategory === cat
                        ? "bg-[#086e45] text-white border-[#086e45]"
                        : "bg-gray-50 text-gray-500 border-transparent hover:border-[#086e45]/30",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de produtos */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
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
                      <div className="flex gap-3 p-3">
                        {/* Foto — thumbnail, clicável pra abrir grande */}
                        <div
                          className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 cursor-pointer"
                          onClick={() => setLightboxImg(product.imagem_url || product.imagem || "")}
                        >
                          {product.imagem_url || product.imagem ? (
                            <img
                              src={product.imagem_url || product.imagem}
                              alt={product.nome}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300 text-lg">
                              📦
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {product.nome}
                          </p>
                          {product.descricao && (
                            <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mt-0.5">
                              {product.descricao}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-400 uppercase font-bold">{cat}</span>
                            {noDiscount && (
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
                                Preço fixo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tamanhos + controles */}
                      <div className="px-3 pb-3 space-y-1.5">
                        {weights.map((w) => {
                          const price = getPrice(product, w);
                          const qty = getQty(product.id, w);
                          const precoCheioW = noDiscount ? price : precoCheioMarmita(w) || price;
                          const precoFaixa = noDiscount
                            ? price
                            : precoMarmitaPorFaixa(w, totalQty, precoCheioW);
                          const temDesconto = !noDiscount && precoFaixa < precoCheioW;
                          return (
                            <div key={w} className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-500 w-9 font-bold shrink-0">
                                {w}
                              </span>
                              <span className="flex flex-col items-end leading-tight w-[72px] shrink-0">
                                {temDesconto ? (
                                  <>
                                    <span className="text-[9px] text-gray-400 line-through">
                                      {formatBRL(precoCheioW)}
                                    </span>
                                    <span className="text-xs font-bold text-green-600">
                                      {formatBRL(precoFaixa)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-[#086e45]">
                                    {formatBRL(price)}
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-1 ml-auto shrink-0">
                                <button
                                  onClick={() => changeQty(product, w, -1)}
                                  disabled={qty === 0}
                                  className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center transition-all border text-sm",
                                    qty > 0
                                      ? "border-[#086e45] text-[#086e45] hover:bg-[#086e45] hover:text-white"
                                      : "border-gray-200 text-gray-300 cursor-not-allowed",
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <span
                                  className={cn(
                                    "w-6 text-center text-sm font-black",
                                    qty > 0 ? "text-[#086e45]" : "text-gray-300",
                                  )}
                                >
                                  {qty}
                                </span>
                                <button
                                  onClick={() => changeQty(product, w, 1)}
                                  className="h-7 w-7 rounded-full flex items-center justify-center bg-[#086e45] text-white hover:bg-[#065a38] transition-colors"
                                >
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

          {/* Coluna direita — resumo */}
          <div className="w-full md:w-72 flex flex-col shrink-0 border-t md:border-t-0">
            <div className="px-4 pt-4 pb-2 border-b shrink-0">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart size={14} /> Seu combo
                <span className="ml-auto text-[#086e45] font-black text-base">{totalQty}</span>
              </h3>
            </div>

            {/* Itens selecionados — escondido no mobile */}
            <div className="hidden md:block max-h-none md:flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-3xl mb-2">🍱</div>
                  <p className="text-xs text-gray-400">Adicione marmitas ao seu combo</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={getItemKey(item.productId, item.weight)}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="font-bold text-[#086e45] w-5 text-center shrink-0">
                      {item.quantity}×
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-800 font-medium leading-tight">
                        {item.nome}
                      </p>
                      <p className="text-gray-400">{item.weight}</p>
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
              <div className="space-y-1.5 text-xs">
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
                <div className="flex justify-between font-black text-base text-gray-900 pt-1 border-t">
                  <span>Total</span>
                  <span className="text-[#086e45]">{formatBRL(total)}</span>
                </div>
              </div>

              {/* Info sobre sopas */}
              {items.some((i) => isNoDiscountLocal(i.categoria)) && (
                <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-2.5 text-[10px] text-blue-700">
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
                  "w-full rounded-2xl py-3.5 text-sm font-black transition-all flex items-center justify-center gap-2",
                  items.length > 0
                    ? "bg-[#086e45] text-white hover:bg-[#065a38] shadow-lg hover:shadow-[#086e45]/30"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed",
                )}
              >
                <ShoppingCart size={16} />
                Adicionar ao carrinho
                {totalQty > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {totalQty} itens
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox — foto ampliada */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Foto ampliada"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
          />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );

  // Renderiza via portal no body — escapa de qualquer ancestral com transform/
  // filter/overflow (ex.: gradientes com blur do layout) que prendia o modal
  // atrás do cabeçalho do site.
  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
