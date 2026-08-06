import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Saborosamente" },
      {
        name: "description",
        content: "Informe os dados de entrega e a forma de pagamento para concluir seu pedido de marmitas.",
      },
      { property: "og:title", content: "Checkout | Saborosamente" },
      { property: "og:description", content: "Finalize seu pedido de marmitas congeladas." },
    ],
  }),
  component: Checkout,
});

/** Validação de entrada — roda antes de qualquer envio (hoje simulado). */
const checkoutSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo").max(80),
  email: z.string().trim().email("E-mail inválido").max(120),
  telefone: z.string().trim().min(10, "Telefone com DDD").max(20),
  cep: z.string().trim().optional(),

  endereco: z.string().trim().min(5, "Informe rua e número").max(160),
  complemento: z.string().trim().max(80).optional(),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  pagamento: z.enum(["pix", "cartao", "dinheiro"]),
  observacoes: z.string().trim().max(300).optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const pagamentos: { value: CheckoutForm["pagamento"]; label: string; hint: string }[] = [
  { value: "pix", label: "PIX", hint: "5% de desconto na confirmação" },
  { value: "cartao", label: "Cartão", hint: "Até 3x sem juros" },
  { value: "dinheiro", label: "Dinheiro", hint: "Pagamento na entrega" },
];

const fieldClass =
  "mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring";

function Checkout() {
  const { 
    lines, 
    subtotal, 
    shipping, 
    total, 
    clear, 
    selectedCity, 
    setSelectedCity,
    selectedBairro,
    setSelectedBairro,
    taxas
  } = useCart();

  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { 
      pagamento: "pix",
      cidade: selectedCity 
    },
  });


  // Envio simulado: substituir por persistência real quando o backend existir.
  const onSubmit = async (data: CheckoutForm) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const id = `SB-${Date.now().toString().slice(-6)}`;
      console.info("[checkout] pedido simulado", { id, cliente: data.nome, itens: lines.length });
      setOrderId(id);
      clear();
      toast.success("Pedido registrado!", { description: `Protocolo ${id}` });
    } catch (error) {
      console.error("[checkout] falha ao registrar pedido", error);
      toast.error("Não foi possível registrar o pedido. Tente novamente.");
    }
  };

  if (orderId) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-extrabold">Pedido recebido!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Protocolo <strong className="text-foreground">{orderId}</strong>. Em breve entraremos em
          contato para confirmar a entrega. (Pagamento simulado nesta versão.)
        </p>
        <Link
          to="/catalogo"
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
        >
          Continuar comprando
        </Link>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Checkout</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Você ainda não escolheu nenhuma marmita.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/catalogo" })}
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
        >
          Ver catálogo
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold">Checkout</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Preencha os dados de entrega. O pagamento é simulado nesta primeira versão.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft"
        >
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Seus dados
            </legend>
            <div>
              <label htmlFor="nome" className="text-sm font-medium">
                Nome completo
              </label>
              <input id="nome" className={fieldClass} {...register("nome")} />
              {errors.nome && <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <input id="email" type="email" className={fieldClass} {...register("email")} />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="telefone" className="text-sm font-medium">
                  Telefone / WhatsApp
                </label>
                <input id="telefone" className={fieldClass} {...register("telefone")} />
                {errors.telefone && (
                  <p className="mt-1 text-xs text-destructive">{errors.telefone.message}</p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Entrega
            </legend>
            <div className="grid gap-4 sm:grid-cols-1">

              <div className="space-y-4">
                <div>
                  <label htmlFor="cidade" className="text-sm font-medium">
                    Cidade
                  </label>
                  <select
                    id="cidade"
                    className={fieldClass}
                    {...register("cidade")}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedBairro("");
                    }}
                  >
                    <option value="">Selecione...</option>
                    {[...new Set(taxas.map(t => t.cidade))].sort().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.cidade && (
                    <p className="mt-1 text-xs text-destructive">{errors.cidade.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bairro" className="text-sm font-medium">
                  Bairro
                </label>
                <select
                  id="bairro"
                  className={cn(fieldClass, !selectedCity && "opacity-50")}
                  disabled={!selectedCity}
                  value={selectedBairro}
                  onChange={(e) => setSelectedBairro(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {taxas
                    .filter(t => t.cidade === selectedCity)
                    .sort((a, b) => a.bairro.localeCompare(b.bairro))
                    .map(t => (
                      <option key={t.id} value={t.bairro}>{t.bairro}</option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="cep" className="text-sm font-medium">
                  CEP (opcional)
                </label>
                <input id="cep" placeholder="00000-000" className={fieldClass} {...register("cep")} />
                {errors.cep && <p className="mt-1 text-xs text-destructive">{errors.cep.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="endereco" className="text-sm font-medium">
                Endereço e número
              </label>
              <input id="endereco" className={fieldClass} {...register("endereco")} />
              {errors.endereco && (
                <p className="mt-1 text-xs text-destructive">{errors.endereco.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="complemento" className="text-sm font-medium">
                Complemento (opcional)
              </label>
              <input id="complemento" className={fieldClass} {...register("complemento")} />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Pagamento
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {pagamentos.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    "cursor-pointer rounded-2xl border border-border p-4 transition-colors hover:border-primary",
                    "has-checked:border-primary has-checked:bg-secondary",
                  )}
                >
                  <input
                    type="radio"
                    value={p.value}
                    className="sr-only"
                    {...register("pagamento")}
                  />
                  <span className="block text-sm font-semibold">{p.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{p.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="observacoes" className="text-sm font-medium">
              Observações (opcional)
            </label>
            <textarea id="observacoes" rows={3} className={fieldClass} {...register("observacoes")} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {isSubmitting ? "Registrando pedido..." : `Confirmar pedido • ${formatBRL(total)}`}
          </button>
        </form>

        <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">Seu pedido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map(({ product, quantity, subtotal: lineTotal }) => (
              <li key={product.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {quantity}× {product.nome}
                </span>
                <span className="font-medium">{formatBRL(lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Entrega</dt>
              <dd>{shipping === 0 ? "Grátis" : formatBRL(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold text-primary">{formatBRL(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}