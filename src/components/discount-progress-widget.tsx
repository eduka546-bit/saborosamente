import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";
import { formatBRL } from "@/lib/products";
import { COMBO_RULES } from "@/lib/combo-rules";

const PRICE_BANDS = COMBO_RULES;

export function DiscountProgressWidget({ className }: { className?: string }) {
  const { count, discount } = useCart();

  const nextLevel = PRICE_BANDS.find((r) => count < r.min);

  const currentLevel = [...PRICE_BANDS]
    .sort((a, b) => b.min - a.min)
    .find((r) => count >= r.min);

  const progress = nextLevel ? (count / nextLevel.min) * 100 : 100;

  return (
    <div className={cn("rounded-2xl border border-primary/10 bg-primary/5 p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-normal text-primary">
            <ShoppingBag size={15} />
            Desconto progressivo
          </h3>
          <p className="mt-1 text-sm font-medium text-[#587064]">
            {discount > 0
              ? `Você já economiza ${formatBRL(discount)} neste pedido.`
              : "Quanto mais itens, melhor a faixa de preço das marmitas."}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-sm font-semibold text-white">
          {count} {count === 1 ? "item" : "itens"}
        </span>
      </div>

      <div className="relative mb-2">
        <div className="absolute left-5 right-5 top-3 h-1 rounded-full bg-primary/10" />
        <div
          className="absolute left-5 top-3 h-1 rounded-full bg-primary transition-all duration-500"
          style={{ width: `calc((100% - 2.5rem) * ${Math.min(count, 20) / 20})` }}
        />
        <div className="relative grid grid-cols-3 gap-2">
          {PRICE_BANDS.map((band) => {
            const active = count >= band.min;
            return (
              <div key={band.min} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "z-10 grid size-7 place-items-center rounded-full border-2 text-sm font-semibold",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-[#cfe0c4] bg-white text-[#6a7c70]",
                  )}
                >
                  {band.min}
                </div>
                <span className={cn("mt-1 text-sm font-semibold", active ? "text-primary" : "text-[#6a7c70]")}>
                  {band.min}+ un
                </span>
                <span className={cn("text-xs font-bold", active ? "text-primary" : "text-[#78922f]")}>
                  {band.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {nextLevel ? (
        <p className="text-center text-sm font-semibold text-[#527164]">
          Faltam <strong className="text-primary">{nextLevel.min - count}</strong>{" "}
          {nextLevel.min - count === 1 ? "unidade" : "unidades"} para a faixa {nextLevel.min}+.
        </p>
      ) : (
        <p className="text-center text-sm font-semibold text-primary">
          ✓ Melhor faixa de preço atingida
        </p>
      )}
    </div>
  );
}
