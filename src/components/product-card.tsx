import { Plus, Info, X, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { formatBRL, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { add } = useCart();
  const weights = product.peso?.includes("-") 
    ? product.peso.split("-").map(w => w.trim()) 
    : product.peso?.includes(",") 
      ? product.peso.split(",").map(w => w.trim())
      : product.peso ? [product.peso] : [];
  const [selectedWeight, setSelectedWeight] = useState(weights.includes("300g") ? "300g" : (weights[0] || ""));

  const isSopa = product.categoria?.toLowerCase().includes("sopa");
  const currentPrice = isSopa ? 18.00 : (selectedWeight === "300g" && product.preco_300g 
    ? product.preco_300g 
    : selectedWeight === "400g" && product.preco_400g
      ? product.preco_400g
      : product.preco);

  const currentNutritional = selectedWeight === "300g" && product.tabela_nutricional_300g
    ? product.tabela_nutricional_300g
    : selectedWeight === "400g" && product.tabela_nutricional_400g
      ? product.tabela_nutricional_400g
      : product.tabela_nutricional;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    add(product.id, 1, selectedWeight);
    toast.success("Adicionado", { 
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}`,
      className: "max-w-[280px] text-xs font-medium",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <article className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
          <div className="relative aspect-4/3 overflow-hidden bg-muted group/thumb">
            <img
              src={product.imagem}
              alt={`Marmita de ${product.nome}`}
              loading="lazy"
              width={800}
              height={800}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            <span className="absolute left-3 top-3 rounded-full bg-sun px-3 py-1 text-xs font-semibold text-sun-foreground">
              {product.categoria}
            </span>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-white/90 p-3 text-primary shadow-lg">
                <Info className="size-6" />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-5">
            <div>
              <h3 className="text-lg font-bold leading-tight text-primary-dark">{product.nome}</h3>

              {weights.length > 1 ? (
                <div className="mt-2 flex gap-2">
                  {weights.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWeight(w);
                      }}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        selectedWeight === w
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  {product.peso}
                </p>
              )}
            </div>
            
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-foreground">
                  {selectedWeight ? `PREÇO (${selectedWeight})` : "A PARTIR DE"}
                </span>
                <span className="text-2xl font-black text-primary">
                  {formatBRL(currentPrice)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 active:scale-95 shadow-soft"
              >
                <Plus className="size-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
      </DialogTrigger>

      <DialogContent className="max-h-[95vh] w-[95vw] overflow-y-auto p-0 sm:max-w-4xl lg:max-w-5xl">
        <div className="flex flex-col md:flex-row min-h-full">
          <div className="relative aspect-square w-full md:aspect-auto md:w-1/2 min-h-[300px] md:min-h-[500px] bg-muted overflow-hidden">
            {product.imagens && product.imagens.length > 0 ? (
              <div className="relative size-full group/carousel">
                <ProductCarousel images={[product.imagem, ...product.imagens]} />
              </div>
            ) : (
              <img
                src={product.imagem}
                alt={product.nome}
                className="size-full object-cover"
              />
            )}
            <Badge className="absolute left-4 top-4 bg-sun text-sun-foreground hover:bg-sun z-10">
              {product.categoria}
            </Badge>
          </div>
          
          <div className="flex flex-1 flex-col p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-primary-dark">
                {product.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="mb-6 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Marca:</span>
                <Badge variant="outline" className="text-primary border-primary/20">
                  {product.categoria === ('Marmita' as any) ? 'Amo' : 'Sabor em Casa'}
                </Badge>
              </div>

              <div>
                <h4 className="mb-1 font-bold text-foreground">Descrição / Ingredientes:</h4>
                <p className="leading-relaxed">
                  {product.descricao || "Ingredientes frescos e selecionados, preparados com o tempero especial da casa para garantir sabor e saúde na sua mesa."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/50 p-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Valor Nutricional</h4>
                  <div className="text-xs mt-1 flex flex-wrap gap-x-2 text-muted-foreground">
                    {currentNutritional?.kcal ? (
                      <>
                        <span className="font-bold text-primary">{currentNutritional.kcal} KCAL</span>
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
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Restrições</h4>
                  <p className="text-xs mt-1">Sem Glúten | Sem Lactose</p>
                </div>
              </div>

              {weights.length > 1 && (
                <div>
                  <h4 className="mb-2 font-bold text-foreground">Escolha o tamanho:</h4>
                  <div className="flex gap-2">
                    {weights.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWeight(w)}
                        className={cn(
                          "flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all",
                          selectedWeight === w
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground">Valor</span>
                  <span className="text-3xl font-black text-primary">
                    {formatBRL(currentPrice)}
                  </span>
                </div>
                {selectedWeight && (
                  <Badge variant="secondary" className="font-bold">
                    {selectedWeight}
                  </Badge>
                )}
              </div>
              
              <Button 
                onClick={() => handleAddToCart()} 
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