import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { COMBO_RULES } from "@/lib/combo-rules";

const PRICE_BANDS = [...COMBO_RULES].sort((a, b) => a.min - b.min);

export function DiscountProgressWidget({ className }: { className?: string }) {
  const { count, discount } = useCart();

  const nextLevel = PRICE_BANDS.find((r) => count < r.min);
  const currentLevel = [...PRICE_BANDS].reverse().find((r) => count >= r.min);

  return (
    <div className={cn("rounded-2xl border border-primary/10 bg-primary/5 p-3", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-normal text-primary">
            <ShoppingBag size={15} />
            Desconto progressivo
          </h3>
          <p className="mt-1 text-xs font-medium leading-snug text-[#587064] sm:text-sm">
            {discount > 0
              ? `Você já economiza ${formatBRL(discount)} neste pedido.`
              : "Quanto mais itens, melhor a faixa de preço das marmitas."}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white sm:text-sm">
          {count} {count === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Visual anterior: trilha de progresso, círculos e tons claros de verde. */}
      <div className="relative mb-2">
        <div className="absolute left-[16.66%] right-[16.66%] top-3 h-1 rounded-full bg-primary/10" />
        <div
          className="absolute left-[16.66%] top-3 h-1 rounded-full bg-primary transition-all duration-500"
          style={{ width: `calc(66.68% * ${Math.min(count, 20) / 20})` }}
        />
        <div className="relative grid grid-cols-3 gap-2">
          {PRICE_BANDS.map((band) => {
            const active = count >= band.min;
            return (
              <div key={band.min} className="flex min-w-0 flex-col items-center text-center">
                <div className={cn(
                  "z-10 grid size-7 place-items-center rounded-full border-2 text-xs font-semibold",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-[#cfe0c4] bg-white text-[#6a7c70]",
                )}>
                  {band.min}
                </div>
                <span className={cn(
                  "mt-1 whitespace-nowrap text-xs font-extrabold sm:text-sm",
                  active ? "text-primary" : "text-[#6a7c70]",
                )}>
                  {band.badge}
                </span>
                <span className={cn(
                  "whitespace-nowrap text-[10px] font-medium sm:text-xs",
                  active ? "text-primary" : "text-[#78922f]",
                )}>
                  {band.min}+ ITENS
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="mt-2 text-center text-[11px] font-medium leading-snug text-[#527164] sm:text-sm">
        {nextLevel ? (
          <>Faltam <strong className="font-bold text-primary">{nextLevel.min - count} {nextLevel.min - count === 1 ? "marmita" : "marmitas"}</strong> para <strong className="font-bold text-primary">{nextLevel.badge}</strong></>
        ) : (
          <strong className="text-primary">Parabéns! Você desbloqueou o maior desconto: {currentLevel?.badge}.</strong>
        )}
      </p>
    </div>
  );
}
