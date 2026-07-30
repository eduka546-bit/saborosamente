import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatBRL, type Product } from "@/lib/products";

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { add } = useCart();

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

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold leading-snug">{product.nome}</h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            {product.peso}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{product.descricao}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ingredientes: </span>
          {product.ingredientes.join(", ")}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xl font-bold text-primary">{formatBRL(product.preco)}</span>
          <button
            type="button"
            onClick={() => {
              add(product.id);
              toast.success("Adicionado ao carrinho", { description: product.nome });
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}