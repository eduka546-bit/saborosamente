import { useState } from "react";
import { isMarmita } from "@/lib/combo-rules";
import { isNoDiscount, precoMarmitaPorFaixa, precoCheioMarmita } from "@/lib/combo-rules";
import { ProductSeals } from "@/components/product-seals";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { useCart, ADICIONAL_PRONTA, ADICIONAL_GARFO_FACA } from "@/lib/cart";
import { imgUrl } from "@/lib/image-proxy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

// Modal de detalhes do produto — layout robusto (imagem grande + ficha completa),
// abre por cima do catálogo sem trocar de página.
export function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
  const { add, count } = useCart();
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

  // Opções (só marmitas): consumo pronta/congelada + garfo e faca.
  const [consumo, setConsumo] = useState<"congelada" | "pronta">("congelada");
  const [garfoEFaca, setGarfoEFaca] = useState(false);

  if (!product) return null;

  const categoriaNome = product.categorias?.nome || product.categoria || "Marmita";
  const ehMarmita = isMarmita(product.nome, categoriaNome);

  // Imagens (aceita imagem_url ou imagem, mais galeria opcional)
  const principal = imgUrl(product.imagem_url || product.imagem);
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
    const opcoes = ehMarmita
      ? { consumo, garfoEFaca: consumo === "pronta" ? garfoEFaca : false }
      : undefined;
    add(product.id, 1, selectedWeight, opcoes);
    const detalheOpcao = ehMarmita
      ? ` — ${consumo === "pronta" ? "pronta para consumo" : "congelada"}`
      : "";
    toast.success("Adicionado ao carrinho!", {
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}${detalheOpcao}`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] w-[95vw] overflow-y-auto p-0 sm:max-w-4xl lg:max-w-5xl">
        <div className="flex flex-col md:flex-row min-h-full">
          {/* Imagem grande / galeria */}
          <div className="relative aspect-square w-full md:aspect-auto md:w-1/2 md:min-h-[500px] bg-muted overflow-hidden">
            <img src={currentImage} alt={product.nome} className="size-full object-cover" />
            <ProductSeals product={product} size={52} />
            <Badge className="absolute left-4 top-4 bg-sun text-sun-foreground hover:bg-sun z-10">
              {categoriaNome}
            </Badge>
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((p) => (p === 0 ? allImages.length - 1 : p - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((p) => (p + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg hover:bg-white"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={cn(
                        "rounded-full transition-all",
                        currentImageIndex === idx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Ficha do produto */}
          <div className="flex flex-1 flex-col p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-primary-dark">
                {product.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="mb-6 space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="mb-1 font-bold text-foreground">Descrição / Ingredientes:</h4>
                <p className="leading-relaxed">
                  {product.descricao ||
                    "Ingredientes frescos e selecionados, preparados com o tempero especial da casa para garantir sabor e saúde na sua mesa."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/50 p-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Valor Nutricional
                  </h4>
                  <div className="text-xs mt-1 flex flex-wrap gap-x-2 text-muted-foreground">
                    {currentNutritional?.kcal ? (
                      <>
                        <span className="font-bold text-primary">
                          {currentNutritional.kcal} KCAL
                        </span>
                        <span>|</span>
                        <span>{currentNutritional.carb}g CARB</span>
                        <span>|</span>
                        <span>{currentNutritional.prot}g PROT</span>
                      </>
                    ) : (
                      <span className="italic">Consulte a embalagem para detalhes</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Restrições
                  </h4>
                  <p className="text-xs mt-1">
                    {product.informacao_nutricional || "Sem Glúten | Sem Lactose"}
                  </p>
                </div>
              </div>

              {weights.length > 1 && (
                <div>
                  <h4 className="mb-2 font-bold text-foreground">Escolha o tamanho:</h4>
                  <div className="flex gap-2">
                    {weights.map((w: string) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWeight(w)}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
                          selectedWeight === w
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        {weightLabel(w)}
                        {isComboPronto && (
                          <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                            {w}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ehMarmita && (
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 font-bold text-foreground">Como você quer receber?</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConsumo("congelada")}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
                          consumo === "congelada"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        Congelada
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsumo("pronta")}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
                          consumo === "pronta"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30",
                        )}
                      >
                        Pronta para consumo
                        <span className="block text-[10px] font-medium text-muted-foreground mt-0.5">
                          +R$ 1,00
                        </span>
                      </button>
                    </div>
                  </div>

                  {consumo === "pronta" && (
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border bg-background p-3">
                      <input
                        type="checkbox"
                        checked={garfoEFaca}
                        onChange={(e) => setGarfoEFaca(e.target.checked)}
                        className="size-4 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">
                        Quero garfo e faca
                        <span className="text-[10px] font-medium text-muted-foreground ml-1">
                          +R$ 1,00
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t">
              {(() => {
                // Calcula preço efetivo: desconto progressivo (se marmita) + acréscimos
                const semDesconto = isNoDiscount(categoriaNome);
                const podeTerDesconto = ehMarmita && !semDesconto;
                const precoCheio = podeTerDesconto
                  ? precoCheioMarmita(selectedWeight) || currentPrice
                  : currentPrice;
                const precoComFaixa = podeTerDesconto
                  ? precoMarmitaPorFaixa(selectedWeight, count, precoCheio)
                  : currentPrice;
                const adicional =
                  (consumo === "pronta" ? ADICIONAL_PRONTA : 0) +
                  (garfoEFaca ? ADICIONAL_GARFO_FACA : 0);
                const precoFinal = precoComFaixa + adicional;
                const temDesconto = precoFinal < precoCheio + adicional || adicional > 0 || precoComFaixa < precoCheio;
                const precoCheioTotal = precoCheio + adicional;

                return (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground">Valor</span>
                      {precoComFaixa < precoCheio ? (
                        <>
                          <span className="text-sm font-bold text-muted-foreground line-through">
                            {formatBRL(precoCheioTotal)}
                          </span>
                          <span className="text-3xl font-black text-[#086e45]">
                            {formatBRL(precoFinal)}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-primary">
                          {formatBRL(precoFinal)}
                        </span>
                      )}
                    </div>
                    {selectedWeight && (
                      <Badge variant="secondary" className="font-bold">
                        {selectedWeight}
                      </Badge>
                    )}
                  </div>
                );
              })()}

              <Button
                onClick={handleAddToCart}
                className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]"
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
