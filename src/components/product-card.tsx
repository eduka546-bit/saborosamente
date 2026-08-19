import { Plus, Info, X, ShoppingCart, ChevronLeft, ChevronRight, Star, Flame, Gift, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { formatBRL, type Product } from "@/lib/products";
import { ComboBuilderModal } from "@/components/combo-builder-modal";
import { Link } from "@tanstack/react-router";

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
  const { add } = useCart();
  const [comboOpen, setComboOpen] = useState(false);
  const combo = isComboProduct(product);
  
  // ── Badges dinâmicas ──────────────────────────────────────────────
  const getBadges = () => {
    const badges: { label: string; color: string; icon: any }[] = [];
    
    // Simulação: produtos com "melhor" ou categoria especial
    if (product.nome?.toLowerCase().includes("melhor") || product.nome?.toLowerCase().includes("destaque")) {
      badges.push({ label: "Bestseller", color: "bg-tangerine", icon: TrendingUp });
    }
    
    // Simulação: produtos recentes (últimos adicionados)
    if ((product.id as any) % 7 === 0) {
      badges.push({ label: "Novo", color: "bg-accent", icon: Gift });
    }
    
    // Simulação: desconto (para produtos com preco_300g diferente)
    if (product.preco_300g && product.preco_300g < product.preco * 0.9) {
      badges.push({ label: "-10%", color: "bg-destructive", icon: Flame });
    }
    
    return badges.slice(0, 2); // Máximo 2 badges
  };

  // ── Rating simulado (para exibição) ──────────────────────────────
  const getRating = () => {
    // Busca o rating do banco de dados, se não existir usa padrão
    return product.rating ?? ((product.id as any) % 2 === 0 ? 5.0 : 4.9);
  };

  const badges = getBadges();
  const rating = getRating();
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
  const [selectedWeight, setSelectedWeight] = useState(weights.includes("300g") ? "300g" : (weights[0] || ""));

  // Para combos prontos, mostra P/M/G em vez de 200g/300g/400g
  const isComboPronto = (product.categorias?.nome || product.categoria || "").toLowerCase().includes("combo pronto");
  const weightLabel = (w: string) => {
    if (!isComboPronto) return w;
    if (w === "200g") return "P";
    if (w === "300g") return "M";
    if (w === "400g") return "G";
    return w;
  };
  const isSopa = product.categoria?.toLowerCase().includes("sopa");
  const currentPrice = isSopa ? 18.00 : (selectedWeight === "300g" && product.preco_300g 
    ? product.preco_300g 
    : selectedWeight === "400g" && product.preco_400g
      ? product.preco_400g
      : product.preco);

  // Imagem por tamanho — usa a específica se cadastrada, senão a principal
  const currentImage = (() => {
    if (selectedWeight === "200g" && (product as any).imagem_200g) return (product as any).imagem_200g;
    if (selectedWeight === "300g" && (product as any).imagem_300g) return (product as any).imagem_300g;
    if (selectedWeight === "400g" && (product as any).imagem_400g) return (product as any).imagem_400g;
    return product.imagem;
  })();

  const currentNutritional = selectedWeight === "300g" && product.tabela_nutricional_300g
    ? product.tabela_nutricional_300g
    : selectedWeight === "400g" && product.tabela_nutricional_400g
      ? product.tabela_nutricional_400g
      : product.tabela_nutricional;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (combo) {
      setComboOpen(true);
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
            {/* Rating + Category */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 transition-colors fill-sun text-sun`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-foreground">5.0</span>
              </div>
              <span className="rounded-full bg-gradient-brand/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white border border-white/40 uppercase tracking-wider">
                {product.categoria}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold font-mazzard leading-snug text-foreground group-hover:text-primary transition-colors">{product.nome}</h3>
              {product.descricao && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{product.descricao}</p>
              )}
            </div>
            <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase">A partir de</span>
                <span className="text-xl font-black text-primary bg-gradient-brand bg-clip-text text-transparent">
                  {formatBRL(product.preco)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setComboOpen(true); }}
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
    <Link to={`/produto/${product.id}`}>
      <article
        className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition-all hover:shadow-lift hover:-translate-y-1"
      >
          {/* Badges container */}
          <div className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap">
            {badges.map((badge, idx) => {
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={idx}
                  className={`${badge.color} text-white rounded-full px-3 py-1.5 text-[10px] font-black flex items-center gap-1.5 shadow-lg backdrop-blur-sm border border-white/30 animate-in fade-in slide-in-from-top-2 duration-500`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <BadgeIcon className="size-3.5" />
                  <span className="uppercase tracking-wide">{badge.label}</span>
                </div>
              );
            })}
          </div>

          <div className="relative aspect-4/3 overflow-hidden bg-muted group/thumb">
            <img
              src={currentImage}
              alt={`Marmita de ${product.nome}`}
              loading="lazy"
              width={800}
              height={800}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {product.imagens && product.imagens.length > 0 && (
              <div className="absolute inset-0 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-between px-2">
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
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            {/* Rating + Category */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 transition-colors ${
                        i < Math.floor(rating)
                          ? "fill-sun text-sun"
                          : i < Math.ceil(rating) && rating % 1 !== 0
                          ? "fill-sun/50 text-sun"
                          : "text-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
              </div>
              <span className="rounded-full bg-gradient-brand/90 backdrop-blur-md px-2.5 py-1 text-[9px] font-black text-white border border-white/40 uppercase tracking-wider">
                {product.categoria}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold font-mazzard leading-snug text-foreground group-hover:text-primary transition-colors">{product.nome}</h3>
            </div>

            {weights.length > 1 ? (
              <div className="flex gap-1.5 flex-wrap">
                {weights.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWeight(w);
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all",
                      selectedWeight === w
                        ? "bg-gradient-brand text-white shadow-md scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:scale-105 border border-border/50"
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
            
            <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase">
                  {selectedWeight ? `${selectedWeight}` : "PREÇO"}
                </span>
                <span className="text-xl font-black text-primary bg-gradient-brand bg-clip-text text-transparent">
                  {formatBRL(currentPrice)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full text-primary-foreground transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg bg-primary hover:bg-primary/90"
                )}
              >
                <Plus className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
      </Link>
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
                  currentIndex === i ? "w-4 bg-primary" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}