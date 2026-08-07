import { Plus, Info, X, ShoppingCart } from "lucide-react";
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

  const currentPrice = selectedWeight === "300g" && product.preco_300g 
    ? product.preco_300g 
    : selectedWeight === "400g" && product.preco_400g
      ? product.preco_400g
      : product.preco;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    add(product.id, 1, selectedWeight);
    toast.success("Adicionado ao carrinho", { 
      description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}` 
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <article className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
          <div className="relative aspect-4/3 overflow-hidden bg-muted">
            <img
              src={product.imagem}
              alt={`Marmita de ${product.nome}`}
              loading="lazy"
              width={800}
              height={800}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
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

      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="flex flex-col md:flex-row">
          <div className="relative aspect-square w-full md:w-1/2">
            <img
              src={product.imagem}
              alt={product.nome}
              className="size-full object-cover"
            />
            <Badge className="absolute left-4 top-4 bg-sun text-sun-foreground hover:bg-sun">
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
                  <p className="text-xs mt-1">
                    {Math.floor(Math.random() * 100) + 150} KCAL | {Math.floor(Math.random() * 15) + 15}g PROT
                  </p>
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
}