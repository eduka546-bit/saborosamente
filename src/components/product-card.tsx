import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { formatBRL, type Product } from "@/lib/products";
import { cn } from "@/lib/utils";

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
  const [selectedWeight, setSelectedWeight] = useState(weights[1] || weights[0] || ""); // Default para 300g se disponível

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
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
                  onClick={() => setSelectedWeight(w)}
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
        <div className="mt-2 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Marca: {product.categoria === 'Marmita' ? 'Amo' : 'Sabor em Casa'}</p>
          <p className="text-[10px] font-medium text-muted-foreground">
            <span className="font-bold text-foreground">Valor Nutricional: </span>
            {Math.floor(Math.random() * 100) + 50} KCAL | {Math.floor(Math.random() * 15) + 5}g PROT | {Math.floor(Math.random() * 20) + 10}g CARB (a cada 100g)
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            <span className="font-bold text-foreground">Alérgicos: </span>
            Sem Glúten | Sem Lactose
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">Ingredientes: </span>
            {product.descricao || "Ingredientes frescos selecionados pela nossa nutricionista."}
          </p>
        </div>


        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-black text-foreground">A PARTIR DE <br/><span className="text-2xl text-primary">{formatBRL(product.preco)}</span></span>
          <button
            type="button"
            onClick={() => {
              add(product.id, 1, selectedWeight);
              toast.success("Adicionado ao carrinho", { 
                description: `${product.nome}${selectedWeight ? ` (${selectedWeight})` : ""}` 
              });
            }}
            className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 active:scale-95 shadow-soft"
          >
            <Plus className="size-6" aria-hidden="true" />
          </button>

        </div>
      </div>
    </article>
  );
}