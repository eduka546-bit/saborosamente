import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { ShoppingBag, Tag } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { COMBO_RULES } from "@/lib/combo-rules";

const PRICE_BANDS = [...COMBO_RULES].sort((a, b) => a.min - b.min);

export function DiscountProgressWidget({ className }: { className?: string }) {
  const { count, discount } = useCart();

  const nextLevel = PRICE_BANDS.find((r) => count < r.min);
  const currentLevel = [...PRICE_BANDS].reverse().find((r) => count >= r.min);

  return (
    <div className={cn("rounded-2xl border border-[#086e45] bg-[#086e45] px-3 py-3 text-white sm:px-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-normal text-white">
            <ShoppingBag size={15} />
            Desconto progressivo
          </h3>
          <p className="mt-1 text-xs font-medium leading-snug text-white/85 sm:text-sm">
            {discount > 0
              ? `Você já economiza ${formatBRL(discount)} neste pedido.`
              : "Quanto mais itens, melhor a faixa de preço das marmitas."}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white sm:text-sm">
          {count} {count === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Mesmo visual das três faixas do cabeçalho de Monte seu Combo. */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {PRICE_BANDS.map((band) => {
          const active = count >= band.min;
          return (
            <div key={band.min} className={cn(
              "flex min-w-0 flex-col items-center justify-center rounded-2xl border px-1 py-2 text-center leading-tight transition-colors",
              active
                ? "border-[#b7e7d1] bg-[#d4f0df] text-[#075636]"
                : "border-white/80 bg-white text-[#526457]",
            )}>
              <span className="flex items-center justify-center gap-1 whitespace-nowrap text-[11px] font-extrabold sm:text-sm">
                <Tag size={12} className="shrink-0" />
                {band.badge}
              </span>
              <span className="mt-1 whitespace-nowrap text-[10px] font-medium sm:text-xs">
                {band.min}+ ITENS
              </span>
            </div>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-2 text-center text-[11px] font-medium leading-snug text-white/90 sm:text-sm">
        {nextLevel ? (
          <>Faltam <strong className="font-bold text-white">{nextLevel.min - count} {nextLevel.min - count === 1 ? "marmita" : "marmitas"}</strong> para {nextLevel.badge}</>
        ) : (
          <strong className="text-white">Parabéns! Você desbloqueou o maior desconto: {currentLevel?.badge}.</strong>
        )}
      </p>
    </div>
  );
}
