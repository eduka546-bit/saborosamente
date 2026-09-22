import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";
import { formatBRL } from "@/lib/products";

const PRICE_BANDS = [{ min: 5 }, { min: 10 }, { min: 20 }];

export function DiscountProgressWidget({ className }: { className?: string }) {
  const { count, discount } = useCart();

  const nextLevel = PRICE_BANDS.find((r) => count < r.min);

  const currentLevel = [...PRICE_BANDS]
    .sort((a, b) => b.min - a.min)
    .find((r) => count >= r.min);

  const progress = nextLevel ? (count / nextLevel.min) * 100 : 100;

  return (
    <div className={cn("rounded-2xl bg-primary/5 p-4 border border-primary/10", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag size={14} />
          {discount > 0
            ? `Você já economiza ${formatBRL(discount)}`
            : currentLevel
              ? `Faixa de ${currentLevel.min}+ ativa`
              : "Preço melhora conforme a quantidade"}
        </h3>
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          {count} {count === 1 ? "item" : "itens"}
        </span>
      </div>

      {nextLevel ? (
        <div className="space-y-2">
          <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-primary/70 uppercase text-center">
            Faltam {nextLevel.min - count} {nextLevel.min - count === 1 ? "unidade" : "unidades"} para liberar a faixa de {nextLevel.min}+
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-primary">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-black uppercase">Melhor faixa de preço atingida!</span>
        </div>
      )}
    </div>
  );
}
