import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { ChevronRight, ShoppingBag } from "lucide-react";

export function FloatingDiscountWidget({ onClick }: { onClick?: () => void }) {
  const { count } = useCart();

  if (count === 0) {
    return (
      <div 
        onClick={onClick}
        className="fixed right-4 bottom-24 z-50 flex items-center justify-center bg-primary text-white size-14 rounded-full shadow-2xl border-4 border-white cursor-pointer hover:scale-110 transition-transform animate-in fade-in slide-in-from-bottom-4 duration-500 group"
      >
        <ShoppingBag size={24} className="group-hover:animate-bounce" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="fixed right-4 bottom-24 z-50 flex flex-col items-end gap-2 group animate-in fade-in slide-in-from-right-4 duration-500 cursor-pointer"
    >
      <div className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl border border-primary/20 p-3 pr-4 transition-transform group-hover:-translate-x-2">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shrink-0">
          <ShoppingBag size={20} strokeWidth={3} />
        </div>
        
        <div className="flex flex-col min-w-[120px]">
          <span className="text-[10px] font-black text-primary uppercase leading-none mb-1">
            Seu Pedido
          </span>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-black text-primary-dark">{count} {count === 1 ? 'item' : 'itens'}</span>
            <ChevronRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
      
      {/* Floating indicator for mobile or simple view */}
      <div className="md:hidden bg-primary text-white size-14 rounded-full flex items-center justify-center shadow-xl border-4 border-white relative">
        <ShoppingBag size={20} />
        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-black size-5 rounded-full flex items-center justify-center border-2 border-white">
          {count}
        </span>
      </div>
    </div>
  );
}
