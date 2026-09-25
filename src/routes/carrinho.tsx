import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Minus, Plus, Trash2 } from "lucide-react";
import { FREE_SHIPPING_FROM, useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";
import { regraEntregaCidade } from "@/lib/entrega-config";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPublicProducts } from "@/lib/products.functions";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useMemo } from "react";

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
    links: [{ rel: "canonical", href: "https://www.saborosamente.com/carrinho" }],
  }),
  component: Carrinho,
});

function estoqueDaLinha(product: any, weight?: string) {
  const raw =
    weight === "200g"
      ? product?.estoque_200g
      : weight === "300g"
        ? product?.estoque_300g
        : weight === "400g"
          ? product?.estoque_400g
          : product?.estoque ?? product?.estoque_200g;
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : null;
}

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
    add,
  } = useCart();

  const { data: cashbackConfig } = useQuery({
    queryKey: ["cashback-cart-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("cashback_ativo,cashback_percentual,parametros_loja")
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["public-products-cart-recommendations"],
    queryFn: () => getPublicProducts(),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (!lines.length) return;
    trackEvent("cart_view", {
      valor: total,
      metadata: { itens: count, linhas: lines.length },
    });
  }, []);

  const cartCategories = useMemo(
    () => new Set(lines.map((line) => line.product?.categorias?.nome || line.product?.categoria).filter(Boolean)),
    [lines],
  );
  const cartProductIds = useMemo(() => new Set(lines.map((line) => line.product?.id).filter(Boolean)), [lines]);
  const suggestions = useMemo(
    () =>
      (catalog as any[])
        .filter((product) => {
          if (!product?.id || cartProductIds.has(product.id)) return false;
          if (product.ativo === false || product.visivel_online === false) return false;
          const category = product.categorias?.nome || product.categoria;
          return cartCategories.size === 0 || cartCategories.has(category) || product.destaque;
        })
        .slice(0, 2),
    [catalog, cartCategories, cartProductIds],
  );

  const cashbackPercent = Number(cashbackConfig?.cashback_percentual ?? 1);
  const acrescimos = (cashbackConfig as any)?.parametros_loja?.acrescimos;
  const adicionalPronta = Number(acrescimos?.pronta ?? 1);
  const adicionalGarfo = Number(acrescimos?.garfoEFaca ?? 1);
  const cashbackBase = Math.max(0, subtotal - discount);
  const cashbackEstimado =
    cashbackConfig?.cashback_ativo === false ? 0 : cashbackBase * (cashbackPercent / 100);

  const regraCidade = regraEntregaCidade(selectedCity);
  const minimoRegional = regraCidade.minUnidades ?? 0;
  const pedidoRegionalInvalido =
    selectedCity !== "" &&
    !selectedCity.toLowerCase().includes("são bento do sul") &&
    minimoRegional > 0 &&
    count < minimoRegional;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-32 pt-14 lg:pb-14">
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
            {lines.map(({ product, productId, quantity, weight, opcoes, custom, subtotal: lineTotal }) => {
              const stock = custom ? null : estoqueDaLinha(product, weight);
              const reachedStock = stock !== null && quantity >= stock;
              return (
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
                      {opcoes.consumo === "pronta"
                        ? `Pronta para consumo +${formatBRL(adicionalPronta)}`
                        : "Congelada"}
                      {opcoes.consumo === "pronta" && opcoes.garfoEFaca
                        ? ` • Garfo e faca +${formatBRL(adicionalGarfo)}`
                        : ""}
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
                        disabled={reachedStock}
                        title={reachedStock ? "Quantidade máxima disponível atingida" : undefined}
                        className={cn(
                          "grid size-8 place-items-center rounded-full",
                          reachedStock ? "cursor-not-allowed opacity-35" : "hover:bg-secondary",
                        )}
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
              );
            })}
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
              {cashbackEstimado > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-[#f4f8ee] px-3 py-2 text-[#315440]">
                  <dt className="flex items-center gap-1.5 font-semibold">
                    <Gift className="size-4 text-[#78922f]" />
                    Cashback estimado
                  </dt>
                  <dd className="font-black text-[#086e45]">
                    +{formatBRL(cashbackEstimado)}
                  </dd>
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
              {count > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <dt>Média por unidade</dt>
                  <dd className="font-bold text-[#315440]">
                    {formatBRL(Math.max(0, subtotal - discount) / count)}
                  </dd>
                </div>
              )}
            </dl>

            {cashbackEstimado > 0 && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Ao concluir e receber este pedido, você pode ganhar cerca de{" "}
                <strong className="text-[#086e45]">{formatBRL(cashbackEstimado)}</strong> em cashback.
                O valor final considera as regras vigentes e não inclui a taxa de entrega.
              </p>
            )}

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

            {suggestions.length > 0 && (
              <div className="mt-6 rounded-2xl border border-[#dce7d5] bg-[#f7faf4] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#315440]">
                  Complete seu pedido
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sugestões rápidas com base no que você já escolheu.
                </p>
                <div className="mt-3 space-y-2">
                  {suggestions.map((product: any) => {
                    const weight = product.preco_300g ? "300g" : product.preco_400g ? "400g" : product.peso || "";
                    const price =
                      weight === "300g" && product.preco_300g
                        ? Number(product.preco_300g)
                        : weight === "400g" && product.preco_400g
                          ? Number(product.preco_400g)
                          : Number(product.preco || 0);
                    return (
                      <div key={product.id} className="flex items-center gap-3 rounded-xl bg-white p-2.5">
                        <img
                          src={product.imagem_url}
                          alt={product.nome}
                          className="size-12 shrink-0 rounded-lg object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-bold">{product.nome}</p>
                          <p className="mt-0.5 text-xs font-black text-primary">{formatBRL(price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            add(product.id, 1, weight);
                            trackEvent("cart_recommendation_add", {
                              produtoId: product.id,
                              valor: price,
                              metadata: { gramatura: weight },
                            });
                          }}
                          className="rounded-full bg-primary px-3 py-2 text-[10px] font-black text-primary-foreground"
                        >
                          Adicionar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_rgba(0,0,0,.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total do pedido
              </p>
              <p className="text-xl font-black text-[#086e45]">{formatBRL(total)}</p>
            </div>
            <Link
              to="/checkout"
              search={{ cupom: undefined }}
              disabled={pedidoRegionalInvalido}
              className={cn(
                "inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-black text-primary-foreground shadow-md",
                pedidoRegionalInvalido && "pointer-events-none opacity-50",
              )}
            >
              Finalizar pedido
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
