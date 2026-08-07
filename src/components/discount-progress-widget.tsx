import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";

export function DiscountProgressWidget({ className }: { className?: string }) {
  const { count } = useCart();

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
