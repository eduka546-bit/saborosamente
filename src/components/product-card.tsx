import {
  Minus,
  Plus,
  X,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Gift,
  Dumbbell,
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
import { usePrecosMarmita } from "@/lib/use-precos-marmita";

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
const normalizarIngredienteCard = (valor: unknown) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const simplificarIngredientesCard = (ingredientes: unknown): string => {
  const lista = Array.isArray(ingredientes)
    ? ingredientes
    : String(ingredientes || "")
        .replace(/^\{\}|^\[\]$/, "")
        .split(/[,;]+/);

  const ignorar = new Set([
    "agua",
    "sal",
    "demi glace",
    "pimenta",
    "molho de tomate",
    "extrato de tomate",
    "salsinha",
    "oleo de soja",
  ]);

  const mapa: Record<string, string> = {
    "arroz branco parboilizado": "Arroz branco",

    "sassami": "Frango",
    "sassami em tiras": "Frango",
    "file de sassami": "Frango",
    "file de sassami frango": "Frango",
    "peito de frango desfiado": "Frango desfiado",
    "file de coxa e sobrecoxa": "Coxa e sobrecoxa de frango",
    "carne bovina em cubos pequenos": "Carne bovina",
    "patinho em tiras": "Tiras de patinho",
    "macarrao espaguete": "Espaguete",
    "macarrao penne": "Penne",
    "massa lasanha": "Massa de lasanha",
    "demi glace": "Demi-glace",
    "queijo ralado": "Queijo",
  };

  const vistos = new Set<string>();
  const resultado: string[] = [];

  for (const bruto of lista) {
    let texto = String(bruto || "").trim();
    if (!texto) continue;

    texto = texto
      .replace(/\([^)]*(?:industrializad[oa]|industraliad[oa]|marca|in natura)[^)]*\)/gi, "")
      .replace(/\b(?:industrializad[oa]|industraliad[oa])\b/gi, "")
      .replace(/\bmarca\s+[\p{L}\d._-]+/giu, "")
      .replace(/\bin natura\b/gi, "")
      .replace(/\s*[-–—]\s*$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    let chave = normalizarIngredienteCard(texto);
    if (!chave || ignorar.has(chave) || /^pimenta(?:\s|$)/.test(chave) || /^demi\s*glace/.test(chave)) continue;

    const simplificado = mapa[chave] || texto;
    chave = normalizarIngredienteCard(simplificado);
    if (!chave || vistos.has(chave)) continue;

    vistos.add(chave);
    resultado.push(simplificado.charAt(0).toUpperCase() + simplificado.slice(1));
  }

  return resultado.join(", ");
};

const stockForWeight = (product: Product | any, weight: string): number | null => {
  const raw =
    weight === "200g"
      ? product?.estoque_200g
      : weight === "300g"
        ? product?.estoque_300g
        : weight === "400g"
          ? product?.estoque_400g
          : product?.estoque ?? product?.estoque_200g;

  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const initialAvailableWeight = (product: Product | any, weights: string[]): string => {
  if (!weights.length) return "";

  const preferred = weights.includes("300g") ? "300g" : weights[0];
  const isAvailable = (weight: string) => {
    const stock = stockForWeight(product, weight);
    return stock === null || stock > 0;
  };

  if (preferred && isAvailable(preferred)) return preferred;
  return weights.find(isAvailable) || preferred || weights[0];
};

import { cn } from "@/lib/utils";
import { isHighProteinFlavor } from "@/lib/nutrition-rules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { imgUrl } from "@/lib/image-proxy";


export interface ProductCardProps {
  product: Product;
  allProducts?: any[]; // lista completa do catálogo, necessária para abrir o combo builder
}

export function ProductCard({ product, allProducts = [] }: ProductCardProps) {
  const { add, count, lines, setQuantity } = useCart();
  const [imageIndex, setImageIndex] = useState(0);
  const tabelaPrecos = usePrecosMarmita();
  const [comboOpen, setComboOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [comboSaboresOpen, setComboSaboresOpen] = useState(false);
  const combo = isComboProduct(product);
  const complemento = product.tipo_produto === "complemento" || /complemento/i.test(product.categorias?.nome || product.categoria || "");
  const displayName = complemento ? product.nome.replace(/\s*150\s*g\s*$/i, "") : product.nome;

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
    return product.peso ? [product.peso] : complemento ? ["150g"] : [];
  })();
  const [selectedWeight, setSelectedWeight] = useState(() =>
    initialAvailableWeight(product, weights),
  );

  // Para combos prontos (não "Monte Você Mesmo"), abre modal de sabores
  const isComboPronto = !combo && (
    product.tipo_produto === "combo" ||
    (product.categorias?.nome || product.categoria || "").toLowerCase().includes("combo pronto")
  );
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

  const gallery = [...new Set([currentImage, ...(product.imagens || []), (product as any).imagem_200g, (product as any).imagem_300g, (product as any).imagem_400g].filter(Boolean).map(imgUrl))];
  const openInformation = () => isComboPronto ? setComboSaboresOpen(true) : setDetailOpen(true);

  const currentNutritional =
    selectedWeight === "200g" && (product as any).tabela_nutricional_200g
      ? (product as any).tabela_nutricional_200g
      : selectedWeight === "300g" && product.tabela_nutricional_300g
        ? product.tabela_nutricional_300g
        : selectedWeight === "400g" && product.tabela_nutricional_400g
          ? product.tabela_nutricional_400g
          : product.tabela_nutricional;

  const currentStock = (() => {
    if (selectedWeight === "200g") return (product as any).estoque_200g;
    if (selectedWeight === "300g") return (product as any).estoque_300g;
    if (selectedWeight === "400g") return (product as any).estoque_400g;
    return (product as any).estoque ?? (product as any).estoque_200g ?? null;
  })();
  const stockNumber =
    currentStock === null || currentStock === undefined ? null : Number(currentStock);
  const quantityAlreadyInCart = lines.reduce((sum, line) => {
    if (line.custom || line.comboPronto) return sum;
    return line.productId === product.id && line.weight === selectedWeight
      ? sum + Number(line.quantity || 0)
      : sum;
  }, 0);
  const remainingStock =
    stockNumber === null ? null : Math.max(0, stockNumber - quantityAlreadyInCart);
  // Combos prontos não têm estoque próprio: a disponibilidade real vem da soma
  // dos sabores elegíveis para a gramatura escolhida no ComboSaboresModal.
  const soldOut = !isComboPronto && remainingStock !== null && remainingStock <= 0;
  const lowStock =
    !isComboPronto && remainingStock !== null && remainingStock > 0 && remainingStock <= 5;
  const isNew =
    Boolean((product as any).created_at) &&
    Date.now() - new Date((product as any).created_at).getTime() <= 30 * 24 * 60 * 60 * 1000;

  const linhasSelecionadasNoCarrinho = lines.filter(
    (line) =>
      !line.custom &&
      !line.comboPronto &&
      line.productId === product.id &&
      line.weight === selectedWeight,
  );
  const quantidadeSelecionadaNoCarrinho = linhasSelecionadasNoCarrinho.reduce(
    (total, line) => total + Number(line.quantity || 0),
    0,
  );
  const ajustarQuantidadeNoCard = (delta: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const alvo = linhasSelecionadasNoCarrinho[linhasSelecionadasNoCarrinho.length - 1];
    if (!alvo) {
      if (delta > 0) handleAddToCart(event);
      return;
    }
    setQuantity(
      alvo.productId,
      alvo.quantity + delta,
      alvo.weight,
      alvo.opcoes,
    );
  };

  const commercialBadge = soldOut
    ? { label: "Esgotado", className: "bg-neutral-900 text-white" }
    : lowStock
      ? { label: `Últimas ${remainingStock}`, className: "bg-[#fff1d6] text-[#9a5b00]" }
      : (product as any).mais_vendido
        ? { label: "Mais pedido", className: "bg-[#f5d94a] text-[#24432f]" }
        : isNew
          ? { label: "Novo", className: "bg-white text-[#086e45]" }
          : null;

  // ── Desconto progressivo por faixa (só marmitas) ───────────────────────────
  const categoriaCard = product.categorias?.nome || product.categoria || "";
  const podeTerDesconto = !combo && !isSopa && !isNoDiscount(categoriaCard);
  const precoCheioCard = podeTerDesconto ? precoCheioMarmita(selectedWeight, tabelaPrecos) || currentPrice : currentPrice;
  const precoFaixaCard = podeTerDesconto
    ? precoMarmitaPorFaixa(selectedWeight, count, precoCheioCard, tabelaPrecos)
    : currentPrice;
  const temDescontoAtivo = podeTerDesconto && precoFaixaCard < precoCheioCard;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (soldOut) {
      toast.info("Esta gramatura está esgotada no momento.");
      return;
    }
    if (combo) {
      setComboOpen(true);
      return;
    }
    if (isComboPronto) {
      setComboSaboresOpen(true);
      return;
    }
    add(product.id, 1, selectedWeight,
      isMarmita(product.nome, product.categorias?.nome || product.categoria)
        ? { consumo: "congelada", garfoEFaca: false } : undefined,
    );
    toast.success("Adicionado", {
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}`,
      className: "max-w-[280px] text-sm font-medium",
    });
  };

  // ── Card de combo: sem Dialog, abre direto o ComboBuilderModal ─────────────
  if (combo) {
    return (
      <>
        <article
          onClick={() => setComboOpen(true)}
          className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          {/* Badges container */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <div className="bg-gradient-sun/95 backdrop-blur-md text-white rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 shadow-lg border border-white/40 tracking-normal">
              <Gift className="size-3.5" />
              Combo
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden bg-muted">

            <img
              src={product.imagem}
              alt={`Combo ${product.nome}`}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              width={800}
              height={600}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
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
              <span className="rounded-full bg-gradient-brand/90 backdrop-blur-md px-2.5 py-1 text-sm font-semibold text-white border border-white/40 tracking-normal">
                {product.categoria}
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold font-mazzard leading-snug text-foreground group-hover:text-primary transition-colors">
                {product.nome}
              </h3>
              {product.descricao && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {product.descricao}
                </p>
              )}
            </div>
            <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">
                  A partir de
                </span>
                <span className="text-xl font-semibold text-primary bg-gradient-brand bg-clip-text text-transparent">
                  {formatBRL(product.preco)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setComboOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
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
      <div className="h-full">
        <article className="group flex flex-col overflow-hidden bg-card shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5 rounded-b-2xl border border-border/50 h-full">
          {/* Imagem — sem arredondamento no topo */}
          <div className="relative aspect-4/3 overflow-hidden bg-muted">

            {commercialBadge && (
              <span
                className={cn(
                  "absolute right-2 top-2 z-20 rounded-full px-2.5 py-1 text-sm font-semibold tracking-normal shadow-md",
                  commercialBadge.className,
                )}
              >
                {commercialBadge.label}
              </span>
            )}
            <img
              src={gallery[imageIndex % gallery.length]}
              alt={`Marmita de ${product.nome}`}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              width={800}
              height={800}
              className={cn(
                "size-full object-cover transition-all duration-500 group-hover:scale-[1.025]",
                soldOut && "grayscale-[35%] opacity-55",
              )}
            />
            {gallery.length > 1 && (
              <div className="pointer-events-none absolute inset-x-2 top-1/2 z-20 flex -translate-y-1/2 justify-between">
                <button type="button" aria-label="Foto anterior" onClick={() => setImageIndex((i) => (i - 1 + gallery.length) % gallery.length)} className="pointer-events-auto grid size-9 place-items-center rounded-full bg-white/95 text-primary shadow"><ChevronLeft size={20} /></button>
                <button type="button" aria-label="Próxima foto" onClick={() => setImageIndex((i) => (i + 1) % gallery.length)} className="pointer-events-auto grid size-9 place-items-center rounded-full bg-white/95 text-primary shadow"><ChevronRight size={20} /></button>
              </div>
            )}
            <button type="button" aria-label={`Abrir detalhes de ${product.nome}`} onClick={openInformation} className="absolute inset-0 z-10 cursor-pointer" />
            {isHighProteinFlavor(product) && (
              <button type="button" aria-label="Alta proteína" title="Alta proteína" className="group/protein absolute left-2 top-2 z-20 grid size-[22px] cursor-default place-items-center rounded-full bg-white/95 text-primary shadow">
                <Dumbbell size={14} />
                <span className="pointer-events-none absolute left-0 top-full mt-1 hidden whitespace-nowrap rounded bg-white px-2 py-1 text-sm shadow group-hover/protein:block group-focus-visible/protein:block">Alta proteína</span>
              </button>
            )}

            {/* Selos sem glúten / sem lactose — canto inferior direito da imagem, empilhados vertical */}
            {(product.sem_gluten || product.sem_lactose) && (
              <div className="absolute bottom-2 right-2 z-20 flex flex-col gap-1">
                {product.sem_gluten && (
                  <button
                    type="button"
                    aria-label="Sem Glúten"
                    title="Sem Glúten"
                    onClick={(event) => event.stopPropagation()}
                    className="group/restricao inline-flex size-[22px] cursor-default items-center justify-center rounded-full transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
                  >
                    <img
                      src="/selo-sem-gluten.png"
                      alt=""
                      aria-hidden="true"
                      className="size-[22px] object-contain drop-shadow-md transition-all duration-200 group-hover/restricao:drop-shadow-lg group-active/restricao:scale-110"
                    />
                    <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded bg-white px-2 py-1 text-sm shadow group-hover/restricao:block group-focus-visible/restricao:block">Sem Glúten</span>
                  </button>
                )}
                {product.sem_lactose && (
                  <button
                    type="button"
                    aria-label="Sem Lactose"
                    title="Sem Lactose"
                    onClick={(event) => event.stopPropagation()}
                    className="group/restricao inline-flex size-[22px] cursor-default items-center justify-center rounded-full transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
                  >
                    <img
                      src="/selo-sem-lactose.png"
                      alt=""
                      aria-hidden="true"
                      className="size-[22px] object-contain drop-shadow-md transition-all duration-200 group-hover/restricao:drop-shadow-lg group-active/restricao:scale-110"
                    />
                    <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded bg-white px-2 py-1 text-sm shadow group-hover/restricao:block group-focus-visible/restricao:block">Sem Lactose</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex flex-1 flex-col gap-2 p-3 pt-3 sm:p-4">
            <h3 className="min-h-[3rem] text-base font-semibold leading-[1.32] text-foreground transition-colors group-hover:text-primary">
              <button type="button" onClick={openInformation} className="cursor-pointer text-left hover:text-primary">{displayName}</button>
            </h3>

            {/* Seletor de peso */}
            {weights.length > 1 ? (
              <div className="flex min-h-7 items-center gap-1.5">
                {weights.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWeight(w);
                      setImageIndex(0);
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium tracking-normal transition-all",
                      selectedWeight === w
                        ? "border-[#086e45] bg-[#086e45] text-white shadow-sm ring-2 ring-[#086e45]/20 ring-offset-1"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#086e45]/40",
                    )}
                  >
                    {weightLabel(w)}
                  </button>
                ))}
              </div>
            ) : null}

            {currentNutritional?.kcal != null && (
              <button type="button" onClick={openInformation} aria-label={`Informações nutricionais de ${product.nome}`} className="flex cursor-pointer items-center justify-start gap-2 whitespace-nowrap text-xs font-normal text-[#315440] hover:text-primary">
                <span>{currentNutritional.kcal} KCAL</span>
                {currentNutritional.prot != null && <><span aria-hidden="true">•</span><span>{currentNutritional.prot}g PROT</span></>}
                {currentNutritional.carb != null && <><span aria-hidden="true">•</span><span>{currentNutritional.carb}g CARB</span></>}
              </button>
            )}

            {simplificarIngredientesCard(product.ingredientes) && (
              <button type="button" onClick={openInformation} className="cursor-pointer text-left text-sm leading-relaxed text-muted-foreground hover:text-primary">
                {simplificarIngredientesCard(product.ingredientes)}
              </button>
            )}

            {/* Preço + botão adicionar */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                {selectedWeight && (
                  <span className="text-sm font-medium text-gray-500">
                    {selectedWeight}
                  </span>
                )}
                {temDescontoAtivo ? (
                  <>
                    <span className="text-sm font-semibold text-gray-400 line-through leading-none">
                      {formatBRL(precoCheioCard)}
                    </span>
                    <span className="text-2xl font-semibold text-[#086e45] leading-tight">
                      {formatBRL(precoFaixaCard)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-semibold text-[#086e45]">
                    {formatBRL(currentPrice)}
                  </span>
                )}
              </div>
              {quantidadeSelecionadaNoCarrinho > 0 && !isComboPronto ? (
                <div
                  className="flex items-center gap-0.5 rounded-full border border-[#cfe0c4] bg-[#f4f8f1] p-0.5 shadow-sm"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    onClick={(event) => ajustarQuantidadeNoCard(-1, event)}
                    className="inline-flex size-7 items-center justify-center rounded-full text-[#086e45] transition hover:bg-white"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="min-w-5 text-center text-sm font-semibold text-[#173a2d]">
                    {quantidadeSelecionadaNoCarrinho}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={(event) => ajustarQuantidadeNoCard(1, event)}
                    disabled={soldOut}
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full text-white transition",
                      soldOut ? "cursor-not-allowed bg-gray-300" : "bg-[#086e45] hover:scale-105",
                    )}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={soldOut}
                  className={cn(
                    "inline-flex size-10 items-center justify-center rounded-full text-white transition-all shadow-md",
                    soldOut
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-[#086e45] hover:scale-110 active:scale-95",
                  )}
                >
                  <Plus className="size-5" aria-hidden="true" />
                </button>
              )}
            </div>


          </div>
        </article>
      </div>

      <ProductDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={product}
        allProducts={allProducts}
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
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
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
