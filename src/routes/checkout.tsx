import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle, MapPin, ChevronDown } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  defaultPaymentMethods,
  defaultCardFlags,
  defaultMealFlags,
  enabledOrDefault,
} from "@/lib/payment-options";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Saborosamente" },
      {
        name: "description",
        content:
          "Informe os dados de entrega e a forma de pagamento para concluir seu pedido de marmitas.",
      },
      { property: "og:title", content: "Checkout | Saborosamente" },
      {
        property: "og:description",
        content: "Finalize seu pedido de marmitas congeladas.",
      },
    ],
  }),
  component: Checkout,
});

const checkoutSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe seu nome completo").max(80),
    email: z.string().trim().email("E-mail inválido").max(120),
    telefone: z.string().trim().min(10, "Telefone com DDD").max(20),
    cep: z.string().trim().optional(),
    endereco: z.string().trim().min(5, "Informe rua e número").max(160),
    complemento: z.string().trim().max(80).optional(),
    cidade: z.string().trim().min(2, "Informe a cidade").max(80),
    pagamento: z.enum(["pix", "cartao", "alimentacao", "mercadopago", "dinheiro"]),
    troco: z.string().trim().optional(),
    observacoes: z.string().trim().max(300).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pagamento === "dinheiro" && data.troco && isNaN(Number(data.troco))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe um valor numérico para o troco",
        path: ["troco"],
      });
    }
  });

type CheckoutForm = z.infer<typeof checkoutSchema>;
type PaymentValue = CheckoutForm["pagamento"];

// mapeamento entre a chave interna e o label exibido ao admin
const PAYMENT_VALUE_MAP: Record<string, PaymentValue> = {
  PIX: "pix",
  Cartão: "cartao",
  Alimentação: "alimentacao",
  "Mercado Pago": "mercadopago",
  Dinheiro: "dinheiro",
};

const fieldClass =
  "mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring";

// ─── componente principal ─────────────────────────────────────────────────────

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
    taxas,
  } = useCart();

  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentValue>("pix");
  const [session, setSession] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // ── buscar configurações de pagamento do banco ────────────────────────────
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    },
  });

  const paymentMethods = enabledOrDefault(siteSettings?.payment_methods, defaultPaymentMethods);
  const cardFlags = enabledOrDefault(siteSettings?.card_flags, defaultCardFlags);
  const mealFlags = enabledOrDefault(siteSettings?.meal_flags, defaultMealFlags);

  // transforma os métodos do banco em opções com o value correto
  const PAYMENT_OPTIONS = paymentMethods.map((m) => ({
    value: (PAYMENT_VALUE_MAP[m.label ?? ""] ?? "pix") as PaymentValue,
    label: m.label ?? "",
    sublabel: (m as any).hint ?? (m as any).sublabel ?? "",
    icon: m.icon ?? "",
  }));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      pagamento: "pix",
      cidade: selectedCity,
    },
  });

  // ── buscar sessão e dados do usuário ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) return;
      setSession(s);

      // preenche email imediatamente do auth
      setValue("email", s.user.email ?? "", { shouldValidate: false });

      // busca perfil (nome, telefone)
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, telefone")
        .eq("id", s.user.id)
        .single();

      if (profile) {
        if (profile.nome) setValue("nome", profile.nome, { shouldValidate: false });
        if (profile.telefone) setValue("telefone", profile.telefone, { shouldValidate: false });
      }

      // busca endereços salvos
      const { data: addrs } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", s.user.id)
        .order("is_default", { ascending: false });

      if (addrs && addrs.length > 0) {
        setAddresses(addrs);
        // pré-seleciona o endereço padrão
        const defaultAddr = addrs.find((a) => a.is_default) ?? addrs[0];
        applyAddress(defaultAddr);
        setSelectedAddressId(defaultAddr.id);
      }
    });
  }, []);

  function applyAddress(addr: any) {
    if (addr.cidade) {
      setValue("cidade", addr.cidade, { shouldValidate: false });
      setSelectedCity(addr.cidade);
    }
    if (addr.bairro) setSelectedBairro(addr.bairro);
    const rua = [addr.rua, addr.numero].filter(Boolean).join(", ");
    if (rua) setValue("endereco", rua, { shouldValidate: false });
    setValue("complemento", addr.complemento ?? "", { shouldValidate: false });
    setValue("cep", addr.cep ?? "", { shouldValidate: false });
  }

  function handleAddressSelect(id: string) {
    setSelectedAddressId(id);
    if (!id) return;
    const addr = addresses.find((a) => a.id === id);
    if (addr) applyAddress(addr);
  }

  function handlePaymentSelect(value: PaymentValue) {
    setSelectedPayment(value);
    setValue("pagamento", value, { shouldValidate: true });
  }

  const onSubmit = async (data: CheckoutForm) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const id = `SB-${Date.now().toString().slice(-6)}`;
      console.info("[checkout] pedido simulado", {
        id,
        cliente: data.nome,
        itens: lines.length,
      });
      setOrderId(id);
      clear();
      toast.success("Pedido registrado!", { description: `Protocolo ${id}` });
    } catch (error) {
      console.error("[checkout] falha ao registrar pedido", error);
      toast.error("Não foi possível registrar o pedido. Tente novamente.");
    }
  };

  // ── tela de confirmação ──────────────────────────────────────────────────────
  if (orderId) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-extrabold">Pedido recebido!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Protocolo <strong className="text-foreground">{orderId}</strong>. Em breve entraremos em
          contato para confirmar a entrega.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
        >
          Continuar comprando
        </Link>
      </section>
    );
  }

  // ── carrinho vazio ───────────────────────────────────────────────────────────
  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Checkout</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Você ainda não escolheu nenhuma marmita.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
        >
          Ver catálogo
        </button>
      </section>
    );
  }

  // ── formulário principal ─────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold">Checkout</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Preencha os dados de entrega e escolha a forma de pagamento.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft"
        >
          {/* ── dados pessoais ─────────────────────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Seus dados
            </legend>
            <div>
              <label htmlFor="nome" className="text-sm font-medium">
                Nome completo
              </label>
              <input id="nome" className={fieldClass} {...register("nome")} />
              {errors.nome && (
                <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className={fieldClass}
                  {...register("email")}
                />
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

          {/* ── entrega ────────────────────────────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Entrega
            </legend>

            {/* seletor de endereços salvos — só aparece quando logado */}
            {addresses.length > 0 && (
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" />
                  Meus endereços salvos
                </label>
                <div className="relative mt-1.5">
                  <select
                    className={cn(fieldClass, "pr-8 mt-0")}
                    value={selectedAddressId}
                    onChange={(e) => handleAddressSelect(e.target.value)}
                  >
                    <option value="">Selecione um endereço salvo...</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label ? `${addr.label} — ` : ""}
                        {addr.rua}, {addr.numero} — {addr.bairro}, {addr.cidade}
                        {addr.is_default ? " ★" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="cidade" className="text-sm font-medium">
                Cidade
              </label>
              <select
                id="cidade"
                className={fieldClass}
                {...register("cidade")}
                onChange={(e) => {
                  setValue("cidade", e.target.value);
                  setSelectedCity(e.target.value);
                  setSelectedBairro("");
                  setSelectedAddressId("");
                }}
              >
                <option value="">Selecione...</option>
                {[...new Set(taxas.map((t) => t.cidade))]
                  .sort()
                  .map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </select>
              {errors.cidade && (
                <p className="mt-1 text-xs text-destructive">{errors.cidade.message}</p>
              )}
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
                  onChange={(e) => {
                    setSelectedBairro(e.target.value);
                    setSelectedAddressId("");
                  }}
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
              <div>
                <label htmlFor="cep" className="text-sm font-medium">
                  CEP (opcional)
                </label>
                <input
                  id="cep"
                  placeholder="00000-000"
                  className={fieldClass}
                  {...register("cep")}
                />
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

          {/* ── pagamento ──────────────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Pagamento
            </legend>

            <input type="hidden" {...register("pagamento")} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {PAYMENT_OPTIONS.map((opt) => {
                const isSelected = selectedPayment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePaymentSelect(opt.value)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl border p-4 text-center transition-colors",
                      isSelected
                        ? "border-primary bg-secondary font-semibold"
                        : "border-border hover:border-primary",
                    )}
                  >
                    {/* logo do banco ou emoji fallback */}
                    {opt.icon ? (
                      <img
                        src={opt.icon}
                        alt={opt.label}
                        className="size-7 object-contain"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="text-2xl" aria-hidden="true">💳</span>
                    )}
                    <span className="text-sm font-semibold leading-tight">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
                  </button>
                );
              })}
            </div>

            {/* ── conteúdo condicional por método ─────────────────────────── */}

            {(selectedPayment === "pix" || selectedPayment === "mercadopago") && (
              <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
                <p>
                  Após confirmar o pedido, enviaremos o{" "}
                  <strong>
                    {selectedPayment === "pix" ? "código PIX" : "link de pagamento"}
                  </strong>{" "}
                  via <strong>WhatsApp</strong>. Mantenha o aplicativo aberto para receber. 📲
                </p>
              </div>
            )}

            {selectedPayment === "cartao" && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-semibold">💳 Bandeiras aceitas</p>
                <ul className="flex flex-wrap gap-2 items-center">
                  {cardFlags.map((flag) => (
                    <li key={flag.name} className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                      {flag.logo ? (
                        <img src={flag.logo} alt={flag.name} className="h-4 object-contain" />
                      ) : (
                        <span className="text-xs">{flag.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPayment === "alimentacao" && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-semibold">🍴 Cartões aceitos</p>
                <ul className="flex flex-wrap gap-2 items-center">
                  {mealFlags.map((flag) => (
                    <li key={flag.name} className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                      {flag.logo ? (
                        <img src={flag.logo} alt={flag.name} className="h-4 object-contain" />
                      ) : (
                        <span className="text-xs">{flag.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPayment === "dinheiro" && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-semibold">💵 Troco</p>
                <label htmlFor="troco" className="text-sm text-muted-foreground">
                  Precisa de troco? Informe o valor que vai pagar (opcional)
                </label>
                <input
                  id="troco"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 50,00"
                  className={fieldClass}
                  {...register("troco")}
                />
                {errors.troco && (
                  <p className="mt-1 text-xs text-destructive">{errors.troco.message}</p>
                )}
              </div>
            )}
          </fieldset>

          {/* ── observações ────────────────────────────────────────────────── */}
          <div>
            <label htmlFor="observacoes" className="text-sm font-medium">
              Observações (opcional)
            </label>
            <textarea
              id="observacoes"
              rows={3}
              className={fieldClass}
              {...register("observacoes")}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {isSubmitting
              ? "Registrando pedido..."
              : `Confirmar pedido • ${formatBRL(total)}`}
          </button>
        </form>

        {/* ── resumo do pedido ──────────────────────────────────────────────── */}
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
