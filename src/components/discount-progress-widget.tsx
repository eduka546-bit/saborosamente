import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";

export function DiscountProgressWidget({ className }: { className?: string }) {
  const { count } = useCart();

  const tiers = [
    { minItems: 5, discount: 3 },
    { minItems: 10, discount: 5 },
    { minItems: 20, discount: 7 }
  ];
  
  const nextTier = tiers.find(t => count < t.minItems);
  const currentTier = [...tiers].reverse().find(t => count >= t.minItems);

  if (!nextTier && !currentTier) return null;

  return (
    <div className={cn("rounded-2xl bg-primary/5 p-4 border border-primary/10", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Desconto Progressivo
        </h3>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          {count} {count === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {nextTier ? (
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
            <span className="text-muted-foreground">
              Faltam <span className="text-primary">{nextTier.minItems - count}</span> {nextTier.minItems - count === 1 ? 'marmita' : 'marmitas'}
            </span>
            <span className="text-primary-dark">Para {nextTier.discount}% OFF</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white border border-primary/10 p-[1px]">
            {(() => {
                const prevGoal = tiers.find((t, i) => tiers[i+1]?.minItems === nextTier.minItems)?.minItems || 0;
                const range = nextTier.minItems - prevGoal;
                const progress = ((count - prevGoal) / range) * 100;
                return (
                    <div 
                        className="h-full bg-primary transition-all duration-700 ease-out rounded-full shadow-sm"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                );
            })()}
          </div>
        </div>
      ) : (
        <div className="flex justify-between text-[9px] font-bold uppercase text-primary-dark">
          <span>Parabéns! Desconto máximo!</span>
          <span>7% OFF</span>
        </div>
      )}
    </div>
  );
}
