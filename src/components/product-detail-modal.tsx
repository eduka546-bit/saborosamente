import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

// Modal de detalhes do produto — abre por cima do catálogo (sem trocar de página).
export function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
  const { add } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Tamanhos disponíveis
  const weights = (() => {
    const hasSizes = product?.preco_300g || product?.preco_400g;
    if (hasSizes) {
      const sizes: string[] = ["200g"];
      if (product.preco_300g) sizes.push("300g");
      if (product.preco_400g) sizes.push("400g");
      return sizes;
    }
    const peso: string | undefined = product?.peso;
    if (peso?.includes("-")) return peso.split("-").map((w: string) => w.trim());
    if (peso?.includes(",")) return peso.split(",").map((w: string) => w.trim());
    return peso ? [peso] : [];
  })();

  const [selectedWeight, setSelectedWeight] = useState<string>(
    weights.includes("300g") ? "300g" : weights[0] || "",
  );

  if (!product) return null;

  const categoriaNome = product.categorias?.nome || product.categoria || "Marmita";
  const rating = product.rating ?? ((product.id as any) % 2 === 0 ? 5.0 : 4.9);

  // Imagens (aceita imagem_url ou imagem, mais galeria opcional)
  const principal = product.imagem_url || product.imagem;
  const allImages = [principal, ...(Array.isArray(product.imagens) ? product.imagens : [])].filter(
    Boolean,
  );
  const currentImage = allImages[currentImageIndex] || principal;

  const isSopa = categoriaNome.toLowerCase().includes("sopa");
  const currentPrice = isSopa
    ? 18.0
    : selectedWeight === "300g" && product.preco_300g
      ? product.preco_300g
      : selectedWeight === "400g" && product.preco_400g
        ? product.preco_400g
        : product.preco;

  const currentNutritional =
    selectedWeight === "300g" && product.tabela_nutricional_300g
      ? product.tabela_nutricional_300g
      : selectedWeight === "400g" && product.tabela_nutricional_400g
        ? product.tabela_nutricional_400g
        : product.tabela_nutricional;

  const isComboPronto = categoriaNome.toLowerCase().includes("combo pronto");
  const weightLabel = (w: string) => {
    if (!isComboPronto) return w;
    if (w === "200g") return "P";
    if (w === "300g") return "M";
    if (w === "400g") return "G";
    return w;
  };

  const handleAddToCart = () => {
    add(product.id, 1, selectedWeight);
    toast.success("Adicionado ao carrinho!", {
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-2xl">
        <div className="grid gap-0 md:grid-cols-2">
          {/* Galeria */}
          <div className="relative aspect-square bg-muted md:aspect-auto md:min-h-[420px]">
            <img
              src={currentImage}
              alt={product.nome}
              className="h-full w-full object-cover md:rounded-l-2xl"
            />
            <Badge className="absolute left-4 top-4 bg-sun text-sun-foreground hover:bg-sun z-10">
              {categoriaNome}
            </Badge>
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((p) => (p === 0 ? allImages.length - 1 : p - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "rounded-full transition-all",
                        currentImageIndex === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Informações */}
          <div className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{product.nome}</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-4",
                        i < Math.floor(rating) ? "fill-sun text-sun" : "text-border",
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
              </div>
              {product.descricao && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {product.descricao}
                </p>
              )}
            </div>

            {weights.length > 1 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">
                  Escolha o tamanho:
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {weights.map((w: string) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeight(w)}
                      className={cn(
                        "rounded-xl border-2 py-3 text-sm font-bold transition-all",
                        selectedWeight === w
                          ? "border-primary bg-primary/5 text-primary shadow-md"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30",
                      )}
                    >
                      {weightLabel(w)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentNutritional?.kcal && (
              <div className="rounded-xl bg-muted/50 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calorias</span>
                  <span className="font-bold text-primary">{currentNutritional.kcal} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carboidratos</span>
                  <span className="font-bold">{currentNutritional.carb}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proteína</span>
                  <span className="font-bold">{currentNutritional.prot}g</span>
                </div>
              </div>
            )}

            <div className="mt-auto space-y-3 border-t border-border/30 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Valor por {selectedWeight || "porção"}
                </span>
                <span className="text-3xl font-black text-primary">{formatBRL(currentPrice)}</span>
              </div>
              <Button
                onClick={handleAddToCart}
                className="w-full h-12 rounded-xl text-base font-bold gap-2"
              >
                <ShoppingCart className="size-5" />
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
