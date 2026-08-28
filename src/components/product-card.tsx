import {
  Plus,
  Info,
  X,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { formatBRL, type Product } from "@/lib/products";
import { ComboBuilderModal } from "@/components/combo-builder-modal";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { ComboSaboresModal } from "@/components/combo-sabores-modal";
import {
  isNoDiscount,
  precoMarmitaPorFaixa,
  precoCheioMarmita,
  faixaPorQuantidade,
  isMarmita,
} from "@/lib/combo-rules";

// Apenas produtos "Monte Você Mesmo" abrem o ComboBuilderModal
// Combos Prontos são produtos normais com tamanho fixo
function isComboProduct(product: Product | any): boolean {
  const cat = (product.categorias?.nome || product.categoria || "").toLowerCase();
  const nome = (product.nome || "").toLowerCase();
  return (
    nome.includes("monte você mesmo") ||
    nome.includes("monte voce mesmo") ||
    nome.includes("escolha você mesmo") ||
    nome.includes("escolha voce mesmo") ||
    cat.includes("escolha você mesmo") ||
    cat.includes("escolha voce mesmo")
  );
}
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ProductCardProps {
  product: Product;
  allProducts?: any[]; // lista completa do catálogo, necessária para abrir o combo builder
}

export function ProductCard({ product, allProducts = [] }: ProductCardProps) {
  const { add, count } = useCart();
  const [comboOpen, setComboOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [comboSaboresOpen, setComboSaboresOpen] = useState(false);
  const combo = isComboProduct(product);

  const weights = (() => {
    // Se tem preços por tamanho no banco, monta os tamanhos disponíveis automaticamente
    const hasSizes = product.preco_300g || product.preco_400g;
    if (hasSizes) {
      const sizes: string[] = ["200g"];
      if (product.preco_300g) sizes.push("300g");
      if (product.preco_400g) sizes.push("400g");
      return sizes;
    }
    // Fallback: lê do campo peso
    if (product.peso?.includes("-")) return product.peso.split("-").map((w: string) => w.trim());
    if (product.peso?.includes(",")) return product.peso.split(",").map((w: string) => w.trim());
    return product.peso ? [product.peso] : [];
  })();
  const [selectedWeight, setSelectedWeight] = useState(
    weights.includes("300g") ? "300g" : weights[0] || "",
  );

  // Para combos prontos, mostra P/M/G em vez de 200g/300g/400g
  const isComboPronto = (product.categorias?.nome || product.categoria || "")
    .toLowerCase()
    .includes("combo pronto");
  const weightLabel = (w: string) => {
    if (!isComboPronto) return w;
    if (w === "200g") return "P";
    if (w === "300g") return "M";
    if (w === "400g") return "G";
    return w;
  };
  const isSopa = product.categoria?.toLowerCase().includes("sopa");
  const currentPrice = isSopa
    ? 18.0
    : selectedWeight === "300g" && product.preco_300g
      ? product.preco_300g
      : selectedWeight === "400g" && product.preco_400g
        ? product.preco_400g
        : product.preco;

  // Imagem por tamanho — usa a específica se cadastrada, senão a principal
  const currentImage = (() => {
    if (selectedWeight === "200g" && (product as any).imagem_200g)
      return (product as any).imagem_200g;
    if (selectedWeight === "300g" && (product as any).imagem_300g)
      return (product as any).imagem_300g;
    if (selectedWeight === "400g" && (product as any).imagem_400g)
      return (product as any).imagem_400g;
    return product.imagem;
  })();

  const currentNutritional =
    selectedWeight === "300g" && product.tabela_nutricional_300g
      ? product.tabela_nutricional_300g
      : selectedWeight === "400g" && product.tabela_nutricional_400g
        ? product.tabela_nutricional_400g
        : product.tabela_nutricional;

  // ── Desconto progressivo por faixa (só marmitas) ───────────────────────────
  const categoriaCard = product.categorias?.nome || product.categoria || "";
  const podeTerDesconto = !combo && !isSopa && !isNoDiscount(categoriaCard);
  const precoCheioCard = podeTerDesconto ? precoCheioMarmita(selectedWeight) || currentPrice : currentPrice;
  const precoFaixaCard = podeTerDesconto
    ? precoMarmitaPorFaixa(selectedWeight, count, precoCheioCard)
    : currentPrice;
  const temDescontoAtivo = podeTerDesconto && precoFaixaCard < precoCheioCard;
  // Próxima faixa: quantas unidades faltam para o primeiro/próximo nível de desconto.
  const PROXIMAS_FAIXAS = [5, 10, 20];
  const proximaFaixa = PROXIMAS_FAIXAS.find((m) => count < m);
  const faltamParaDesconto = proximaFaixa ? proximaFaixa - count : 0;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (combo) {
      setComboOpen(true);
      return;
    }
    // Marmitas precisam da escolha "pronta/congelada" (e garfo e faca).
    // Abre o modal de detalhes para o cliente definir antes de adicionar.
    if (isMarmita(product.nome, product.categorias?.nome || product.categoria)) {
      setDetailOpen(true);
      return;
    }
    add(product.id, 1, selectedWeight);
    toast.success("Adicionado", {
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}`,
      className: "max-w-[280px] text-xs font-medium",
    });
  };

  // ── Card de combo: sem Dialog, abre direto o ComboBuilderModal ─────────────
  if (combo) {
    return (
      <>
        <article
          onClick={() => setComboOpen(true)}
          className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition-all hover:shadow-lift hover:-translate-y-1"
        >
          {/* Badges container */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <div className="bg-gradient-sun/95 backdrop-blur-md text-white rounded-full px-3 py-1.5 text-[10px] font-black flex items-center gap-1.5 shadow-lg border border-white/40 uppercase tracking-wider">
              <Gift className="size-3.5" />
              Combo
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden bg-muted">
            <img
              src={product.imagem}
              alt={`Combo ${product.nome}`}
              loading="lazy"
              width={800}
              height={600}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-white/95 p-3 text-primary shadow-lg backdrop-blur-sm">
                <ShoppingCart className="size-6" />
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            {/* Category */}
            <div className="flex items-center justify-end">
              <span className="rounded-full bg-gradient-brand/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white border border-white/40 uppercase tracking-wider">
                {product.categoria}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold font-mazzard leading-snug text-foreground group-hover:text-primary transition-colors">
                {product.nome}
              </h3>
              {product.descricao && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {product.descricao}
                </p>
              )}
            </div>
            <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase">
                  A partir de
                </span>
                <span className="text-xl font-black text-primary bg-gradient-brand bg-clip-text text-transparent">
                  {formatBRL(product.preco)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setComboOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="size-4" /> Montar
              </button>
            </div>
          </div>
        </article>
        <ComboBuilderModal
          isOpen={comboOpen}
          onClose={() => setComboOpen(false)}
          combo={{ id: product.id, nome: product.nome, descricao: product.descricao }}
          products={allProducts}
        />
      </>
    );
  }

  // ── Card normal ──────────────────────────────────────────────────────────
  return (
    <>
      <div onClick={() => isComboPronto ? setComboSaboresOpen(true) : setDetailOpen(true)} className="h-full">
        <article className="group flex cursor-pointer flex-col overflow-hidden bg-card shadow-soft transition-all hover:shadow-lift hover:-translate-y-1 rounded-b-2xl border border-border/50 h-full">
          {/* Imagem — sem arredondamento no topo */}
          <div className="relative aspect-4/3 overflow-hidden bg-muted">
            <img
              src={currentImage}
              alt={`Marmita de ${product.nome}`}
              loading="lazy"
              width={800}
              height={800}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {product.imagens && product.imagens.length > 0 && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2">
                <div className="bg-white/90 p-1 rounded-full text-primary shadow-sm pointer-events-none">
                  <ChevronLeft size={16} />
                </div>
                <div className="bg-white/90 p-1 rounded-full text-primary shadow-sm pointer-events-none">
                  <ChevronRight size={16} />
                </div>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-white/95 p-3 text-primary shadow-lg backdrop-blur-sm">
                <Info className="size-6" />
              </div>
            </div>

            {/* Selos sem glúten / sem lactose — canto inferior direito da imagem, empilhados vertical */}
            {(product.sem_gluten || product.sem_lactose) && (
              <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1">
                {product.sem_gluten && (
                  <img
                    src="/selo-sem-gluten.png"
                    alt="Sem Glúten"
                    title="Sem Glúten"
                    className="h-9 w-9 object-contain drop-shadow-md"
                  />
                )}
                {product.sem_lactose && (
                  <img
                    src="/selo-sem-lactose.png"
                    alt="Sem Lactose"
                    title="Sem Lactose"
                    className="h-9 w-9 object-contain drop-shadow-md"
                  />
                )}
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex flex-1 flex-col gap-2.5 p-4 pt-3">
            <h3 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
              {product.nome}
            </h3>

            {/* Seletor de peso */}
            {weights.length > 1 ? (
              <div className="flex gap-1.5">
                {weights.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWeight(w);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-all border",
                      selectedWeight === w
                        ? "bg-[#086e45] text-white border-[#086e45] shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#086e45]/40",
                    )}
                  >
                    {weightLabel(w)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                {product.peso}
              </p>
            )}

            {/* Preço + botão adicionar */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                {selectedWeight && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {selectedWeight}
                  </span>
                )}
                {temDescontoAtivo ? (
                  <>
                    <span className="text-xs font-bold text-gray-400 line-through leading-none">
                      {formatBRL(precoCheioCard)}
                    </span>
                    <span className="text-xl font-black text-[#086e45] leading-tight">
                      {formatBRL(precoFaixaCard)}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-black text-[#086e45]">
                    {formatBRL(currentPrice)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex size-9 items-center justify-center rounded-full bg-[#086e45] text-white transition-all hover:scale-110 active:scale-95 shadow-md"
              >
                <Plus className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Card de desconto — fundo preto, quantidade e % em verde */}
            {podeTerDesconto &&
              (proximaFaixa ? (
                <div className="mt-1.5 rounded-lg bg-neutral-900 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-bold text-white leading-tight">
                    Adicione mais{" "}
                    <span className={proximaFaixa === 5 ? "text-[#86efac]" : proximaFaixa === 10 ? "text-[#34d399]" : "text-[#059669]"}>
                      {faltamParaDesconto} {faltamParaDesconto === 1 ? "unidade" : "unidades"}
                    </span>
                  </p>
                  <p className="text-[10px] font-bold text-white leading-tight">
                    para ganhar{" "}
                    {proximaFaixa === 5 && (
                      <span className="text-[#86efac] font-black">3%</span>
                    )}
                    {proximaFaixa === 10 && (
                      <span className="text-[#34d399] font-black">5%</span>
                    )}
                    {proximaFaixa === 20 && (
                      <span className="text-[#059669] font-black">7%</span>
                    )}{" "}
                    de desconto!
                  </p>
                </div>
              ) : (
                <div className="mt-1.5 rounded-lg bg-[#086e45] px-3 py-2 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wide text-white">
                    ✓ Desconto máximo aplicado
                  </span>
                </div>
              ))}
          </div>
        </article>
      </div>

      <ProductDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={product}
      />

      <ComboSaboresModal
        isOpen={comboSaboresOpen}
        onClose={() => setComboSaboresOpen(false)}
        combo={product}
      />
    </>
  );
}

function ProductCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative size-full overflow-hidden">
      <div
        className="flex size-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            className="size-full object-cover shrink-0"
            alt={`Imagem ${i + 1}`}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 flex items-center justify-center text-primary shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 flex items-center justify-center text-primary shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRight className="size-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all",
                  currentIndex === i ? "w-4 bg-primary" : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
