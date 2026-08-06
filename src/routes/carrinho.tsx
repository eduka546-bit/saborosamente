import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { FREE_SHIPPING_FROM, useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho | Saborosamente" },
      {
        name: "description",
        content: "Revise as marmitas congeladas escolhidas, ajuste quantidades e finalize seu pedido.",
      },
      { property: "og:title", content: "Carrinho | Saborosamente" },
      { property: "og:description", content: "Revise seu pedido de marmitas congeladas." },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const {
    lines,
    subtotal,
    shipping,
    total,
    count,
    selectedCity,
    setSelectedCity,
    setQuantity,
    remove,
    clear,
  } = useCart();


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
            to="/catalogo"
            className="mt-6 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="space-y-4">
            {lines.map(({ product, quantity, weight, subtotal: lineTotal }) => (
              <li
                key={product.id}
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
                    {weight || product.peso} • {formatBRL(product.preco)} cada
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-border">
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${product.nome}`}
                        onClick={() => setQuantity(product.id, quantity - 1, weight)}
                        className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                      >
                        <Minus className="size-4" aria-hidden="true" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${product.nome}`}
                        onClick={() => setQuantity(product.id, quantity + 1, weight)}
                        className="grid size-8 place-items-center rounded-full hover:bg-secondary"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(product.id, weight)}
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

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Cidade para entrega
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione a cidade...</option>
                <option value="São Bento do Sul">São Bento do Sul</option>
                <option value="Rio Negrinho">Rio Negrinho</option>
                <option value="Campo Alegre">Campo Alegre</option>
                <option value="Corupá">Corupá</option>
                <option value="Piên">Piên</option>
                <option value="Rio Negro">Rio Negro</option>
                <option value="Mafra">Mafra</option>
              </select>
            </div>

            <dl className="mt-5 space-y-3 text-sm">

              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatBRL(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entrega</dt>
                <dd className="font-medium">
                  {shipping === 0 ? "Grátis" : formatBRL(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-bold text-primary">{formatBRL(total)}</dd>
              </div>
            </dl>
            {selectedCity.toLowerCase().includes("são bento do sul") &&
              shipping !== 0 &&
              (subtotal < 70 && count < 5) && (
                <p className="mt-4 rounded-2xl bg-secondary p-3 text-xs text-secondary-foreground">
                  Dica: Pedidos acima de R$ 70 ou 5 itens baixam o frete para R$ 5,00 em SBS!
                </p>
              )}

            {!selectedCity.toLowerCase().includes("são bento do sul") &&
              selectedCity !== "" &&
              (subtotal < 70 && count < 5) && (
                <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  Pedido mínimo de R$ 70,00 ou 5 unidades para esta cidade.
                </div>
              )}

            <Link
              to="/checkout"
              disabled={selectedCity !== "" && !selectedCity.toLowerCase().includes("são bento do sul") && subtotal < 70 && count < 5}
              className={cn(
                "mt-6 flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-dark",
                selectedCity !== "" && !selectedCity.toLowerCase().includes("são bento do sul") && subtotal < 70 && count < 5 && "opacity-50 pointer-events-none"
              )}
            >
              Finalizar pedido
            </Link>

          </aside>
        </div>
      )}
    </section>
  );
}