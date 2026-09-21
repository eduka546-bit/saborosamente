import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { FREE_SHIPPING_FROM, useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";
import { regraEntregaCidade } from "@/lib/entrega-config";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho | Saborosamente" },
      {
        name: "description",
        content:
          "Revise as marmitas congeladas escolhidas, ajuste quantidades e finalize seu pedido.",
      },
      { property: "og:title", content: "Carrinho | Saborosamente" },
      { property: "og:description", content: "Revise seu pedido de marmitas congeladas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://saborosamente.vercel.app/carrinho" }],
  }),
  component: Carrinho,
});

function Carrinho() {
  const {
    lines,
    subtotal,
    discount,
    shipping,
    total,
    count,
    selectedCity,
    setSelectedCity,
    selectedBairro,
    setSelectedBairro,
    taxas,

    setQuantity,
    remove,
    clear,
  } = useCart();

  const regraCidade = regraEntregaCidade(selectedCity);
  const minimoRegional = regraCidade.minUnidades ?? 0;
  const pedidoRegionalInvalido =
    selectedCity !== "" &&
    !selectedCity.toLowerCase().includes("são bento do sul") &&
    minimoRegional > 0 &&
    count < minimoRegional;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold">Seu carrinho</h1>

      {lines.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold">Seu carrinho está vazio</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha suas marmitas favoritas e volte aqui para finalizar.
          </p>
          <Link
            to="/"
            hash="cardapio"
            className="mt-6 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="space-y-4">
            {lines.map(({ product, productId, quantity, weight, opcoes, custom, subtotal: lineTotal }) => (
              <li
                key={`${productId}|${weight ?? ""}|${opcoes?.consumo ?? ""}|${opcoes?.garfoEFaca ? "gf" : ""}`}
                className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center"
              >
                <img
                  src={product.imagem}
                  alt={product.nome}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="size-24 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-sm font-semibold">{product.nome}</h2>
                  <p className="text-xs text-muted-foreground">
                    {weight || product.peso} • {formatBRL(lineTotal / Math.max(1, quantity))} cada
                  </p>
                  {opcoes && (
                    <p className="mt-0.5 text-[11px] font-medium text-primary">
                      {opcoes.consumo === "pronta" ? "Pronta para consumo" : "Congelada"}
                      {opcoes.consumo === "pronta" && opcoes.garfoEFaca ? " • com garfo e faca" : ""}
                    </p>
                  )}
                  {custom && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {custom.itens.filter((i) => i.gramatura > 0).map((i) => i.nome).join(", ")}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-border">
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${product.nome}`}
                        onClick={() => setQuantity(productId, quantity - 1, weight, opcoes)}
                        className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                      >
                        <Minus className="size-4" aria-hidden="true" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${product.nome}`}
                        onClick={() => setQuantity(productId, quantity + 1, weight, opcoes)}
                        className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(productId, weight, opcoes)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" /> Remover
                    </button>
                  </div>
                </div>
                <span className="text-base font-bold text-primary">{formatBRL(lineTotal)}</span>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={clear}
                className="text-xs font-medium text-muted-foreground hover:text-destructive"
              >
                Limpar carrinho
              </button>
            </li>
          </ul>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold">Resumo do pedido</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Cidade
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedBairro(""); // Reset bairro ao mudar cidade
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {[...new Set(taxas.map((t) => t.cidade))].sort().map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Bairro
                </label>
                <select
                  value={selectedBairro}
                  onChange={(e) => setSelectedBairro(e.target.value)}
                  disabled={!selectedCity}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  {taxas
                    .filter((t) => t.cidade === selectedCity)
                    .sort((a, b) => a.bairro.localeCompare(b.bairro))
                    .map((t) => (
                      <option key={t.id} value={t.bairro}>
                        {t.bairro}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatBRL(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-dark">
                  <dt className="text-primary font-semibold">Desconto Progressivo</dt>
                  <dd className="font-bold">-{formatBRL(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entrega</dt>
                <dd className="font-medium">{shipping === 0 ? "Grátis" : formatBRL(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-bold text-primary">{formatBRL(total)}</dd>
              </div>
            </dl>

            {/* Barra de Progresso Frete SBS */}
            {selectedCity.toLowerCase().includes("são bento do sul") && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
                  <span className="text-muted-foreground">Progresso Frete Reduzido (R$ 5,00)</span>
                  <span className="text-primary">
                    {Math.min(100, Math.max((subtotal / 70) * 100, (count / 5) * 100)).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max((subtotal / 70) * 100, (count / 5) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Em São Bento do Sul, 5 ou mais unidades reduzem o frete para R$ 5,00.
                </p>
              </div>
            )}

            {selectedCity.toLowerCase().includes("são bento do sul") &&
              shipping !== 0 &&
              subtotal < 70 &&
              count < 5 && (
                <p className="mt-4 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
                  Dica: com 5 ou mais unidades, o frete em São Bento do Sul cai para R$ 5,00!
                </p>
              )}

            {pedidoRegionalInvalido && (
              <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                Pedido mínimo de {minimoRegional} unidades para esta cidade.
              </div>
            )}

            <Link
              to="/checkout"
              search={{ cupom: undefined }}
              disabled={pedidoRegionalInvalido}
              className={cn(
                "mt-6 flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-dark",
                pedidoRegionalInvalido && "opacity-50 pointer-events-none",
              )}
            >
              Finalizar pedido
            </Link>

            {/* Widget de Desconto Progressivo */}
            <div className="mt-8 rounded-3xl bg-primary/5 p-6 border-2 border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  Desconto Progressivo
                </h3>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {count} {count === 1 ? "item" : "itens"}
                </span>
              </div>

              {(() => {
                const tiers = [5, 10, 20];
                const nextTier = tiers.find((minItems) => count < minItems);
                const currentTier = [...tiers].reverse().find((minItems) => count >= minItems);

                if (!nextTier && currentTier) {
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-primary-dark uppercase">
                          Melhor faixa de preço atingida!
                        </span>
                        <span className="text-primary">20+ UNID.</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-primary shadow-inner" />
                    </div>
                  );
                }

                if (nextTier) {
                  const itemsNeeded = nextTier - count;
                  const previousTier =
                    [...tiers].reverse().find((minItems) => minItems < nextTier) ?? 0;
                  const range = nextTier - previousTier;
                  const currentInRange = count - previousTier;
                  const progress = (currentInRange / range) * 100;

                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                        <span className="text-muted-foreground">
                          Faltam <span className="text-primary">{itemsNeeded}</span>{" "}
                          {itemsNeeded === 1 ? "marmita" : "marmitas"}
                        </span>
                        <span className="text-primary-dark">
                          Para liberar a faixa de {nextTier}+
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white border border-primary/20 p-[2px]">
                        <div
                          className="h-full bg-primary transition-all duration-700 ease-out rounded-full shadow-sm"
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </div>
                      {currentTier && (
                        <p className="text-[10px] text-center font-bold text-primary italic">
                          * Preço da faixa de {currentTier}+ unidades já aplicado.
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mt-6 grid grid-cols-3 gap-2">
                {[5, 10, 20].map((q) => (
                  <div
                    key={q}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-2xl border transition-all",
                      count >= q
                        ? "bg-primary text-white border-primary shadow-md scale-105 z-10"
                        : "bg-white text-muted-foreground border-border opacity-70",
                    )}
                  >
                    <span className="text-[10px] font-black">{q}+ UNID.</span>
                    <span className="text-xs font-black">PREÇO ESPECIAL</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
