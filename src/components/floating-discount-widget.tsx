import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";
import { formatBRL } from "@/lib/products";

export function FloatingDiscountWidget({ onClick }: { onClick?: () => void }) {
  const { count, discount } = useCart();
  const next = [5, 10, 20].find((minimum) => count < minimum);
  const message = count === 0 ? "Desconto em 5+" : next ? `Faltam ${next - count} para ${next}+` : "Melhor faixa ativa";
  return (
      <button type="button" onClick={onClick} aria-label={`Abrir carrinho. ${message}`} className="fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/95 py-2 pl-3 pr-2 text-primary shadow-md backdrop-blur">
        <span className="flex flex-col text-left text-xs font-medium leading-snug">
          <span>{message}</span>
          {discount > 0 && <span className="text-[12px]">Economia {formatBRL(discount)}</span>}
        </span>
        <span className="relative grid size-9 place-items-center rounded-full bg-primary text-white">
          <ShoppingBag size={18} />
          {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#78922f] px-1 text-xs text-white">{count}</span>}
        </span>
      </button>
  );
}
