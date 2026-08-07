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
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag size={14} />
          Seu Carrinho
        </h3>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          {count} {count === 1 ? 'item' : 'itens'}
        </span>
      </div>
    </div>
  );
}
