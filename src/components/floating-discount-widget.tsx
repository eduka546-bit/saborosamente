import { RULES, useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";

export function FloatingDiscountWidget({ onClick }: { onClick?: () => void }) {
  const { count } = useCart();
  const next = RULES.PROGRESSIVE_DISCOUNT.find((tier) => count < tier.min);
  const current = [...RULES.PROGRESSIVE_DISCOUNT].reverse().find((tier) => count >= tier.min);
  const percentage = Math.round((next?.discount ?? current?.discount ?? 0) * 100);
  const title = `Desconto de ${percentage}%`;
  const detail = next ? `na compra de +${next.min - count}un` : "Faixa máxima ativa";
  const message = `${title} ${detail}`;
  return (
      <button type="button" onClick={onClick} aria-label={`Abrir carrinho. ${message}`} className="fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/95 py-2 pl-3 pr-2 text-primary shadow-md backdrop-blur">
        <span className="flex flex-col text-left text-sm font-normal leading-snug">
          <span>Desconto de <strong className="font-semibold">{percentage}%</strong></span>
          <span>{next ? <>na compra de <strong className="font-semibold">+{next.min - count}un</strong></> : detail}</span>
        </span>
        <span className="relative grid size-9 place-items-center rounded-full bg-primary text-white">
          <ShoppingBag size={18} />
          {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#78922f] px-1 text-xs text-white">{count}</span>}
        </span>
      </button>
  );
}
