import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/orders.functions";
import { useServerFn } from "@tanstack/react-start";

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
  metodoEntrega: z.enum(["entrega", "retirada"]),
  horarioEntrega: z.string().min(1, "Selecione um horário"),
  cep: z.string().trim().optional(),
  endereco: z.string().trim().max(160).optional(),
  complemento: z.string().trim().max(80).optional(),
  cidade: z.string().trim().max(80).optional(),
  pagamento: z.enum(["pix", "cartao", "dinheiro"]),
  observacoes: z.string().trim().max(300).optional(),
}).refine((data) => {
  if (data.metodoEntrega === "entrega") {
    return !!data.cidade && !!data.endereco;
  }
  return true;
}, {
  message: "Endereço é obrigatório para entrega",
  path: ["endereco"],
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
    discount,
    shipping, 
    total, 
    clear, 
    selectedCity, 
    setSelectedCity,
    selectedBairro,
    setSelectedBairro,
    taxas
  } = useCart();

  const createOrderFn = useServerFn(createOrder);

  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { 
      pagamento: "pix",
      metodoEntrega: "entrega",
      horarioEntrega: "",
      cidade: selectedCity 
    },
  });

  const currentMetodo = watch("metodoEntrega");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsCheckingAuth(true);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      navigate({ to: "/auth", search: { redirect: "/checkout" } });
      return;
    }

    setSession(currentSession);
    setIsCheckingAuth(false);


    // Fetch Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (profile) {
      setValue("nome", profile.nome || "");
      setValue("email", session.user.email || "");
      setValue("telefone", profile.telefone || "");
    }

    // Fetch Addresses
    const { data: addresses } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", session.user.id);
    
    if (addresses && addresses.length > 0) {
      setSavedAddresses(addresses);
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      applyAddress(defaultAddr);
    }
  };

  const applyAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setSelectedCity(addr.cidade);
    setSelectedBairro(addr.bairro);
    setValue("cidade", addr.cidade);
    setValue("endereco", `${addr.rua}, ${addr.numero}`);
    setValue("complemento", addr.complemento || "");
  };

  // Envio simulado: substituir por persistência real quando o backend existir.
  const onSubmit = async (data: CheckoutForm) => {
    try {
      // 1. Atualizar Perfil se estiver logado
      if (session?.user?.id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome: data.nome,
            telefone: data.telefone
          })
          .eq("id", session.user.id);
        
        if (profileError) console.error("Erro ao atualizar perfil:", profileError);

        // 2. Salvar endereço automaticamente se for novo e método for entrega
        if (data.metodoEntrega === "entrega" && !selectedAddressId) {
          const { error: addrError } = await supabase
            .from("user_addresses")
            .insert({
              user_id: session.user.id,
              label: "Endereço do Pedido",
              cidade: data.cidade,
              bairro: selectedBairro,
              rua: data.endereco?.split(",")[0].trim() || data.endereco,
              numero: data.endereco?.split(",")[1]?.trim() || "",
              complemento: data.complemento,
              is_default: savedAddresses.length === 0
            });
          
          if (addrError) console.error("Erro ao salvar endereço automático:", addrError);
        }
      }

      const orderData = {
        ...data,
        bairro: selectedBairro,
        valorTotal: total,
        taxaEntrega: shipping,
        desconto: discount,
        items: lines.map(line => ({
          productId: line.productId,
          quantity: line.quantity,
          weight: line.weight,
          price: line.subtotal / line.quantity // Preço unitário
        }))
      };

      const result = await createOrderFn({ data: orderData });
      
      setOrderId(result.id);
      clear();
      toast.success("Pedido registrado!", { description: `Número do pedido: ${result.id.slice(0, 8)}` });
    } catch (error: any) {

      console.error("[checkout] falha ao registrar pedido", error);
      toast.error("Não foi possível registrar o pedido.", {
        description: error.message || "Tente novamente mais tarde."
      });
    }
  };

  if (orderId) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-extrabold">Pedido recebido!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Pedido número <strong className="text-foreground">#{orderId.slice(0, 8)}</strong>. Em breve entraremos em
          contato para confirmar a entrega. Você pode acompanhar o status no seu perfil.
        </p>
        <Link
          to="/"
          hash="cardapio"
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
          onClick={() => navigate({ to: "/" })}
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
        >
          Ver catálogo
        </button>
      </section>
    );
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold">Finalize seu pedido</h1>
        <p className="mt-4 text-muted-foreground">
          Para concluir sua compra, você precisa entrar na sua conta ou fazer um cadastro rápido. Isso nos ajuda a salvar seu endereço e histórico de pedidos.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/auth"
            search={{ redirect: "/checkout" }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105"
          >
            Fazer login / Cadastro rápido
          </Link>
          <Link
            to="/"
            hash="cardapio"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-8 py-3 text-sm font-bold transition-colors hover:bg-muted"
          >
            Continuar comprando
          </Link>
        </div>
      </section>
    );
  }

  return (

    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold">Checkout</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Preencha os dados de entrega para finalizar seu pedido.
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
              Opções de Recebimento
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={cn(
                "cursor-pointer rounded-2xl border border-border p-4 transition-all hover:border-primary/50",
                currentMetodo === "entrega" && "border-primary bg-primary/5 ring-1 ring-primary"
              )}>
                <input type="radio" value="entrega" className="sr-only" {...register("metodoEntrega")} />
                <span className="block text-sm font-bold">Entrega em domicílio</span>
                <span className="mt-1 block text-xs text-muted-foreground">Receba no seu endereço</span>
              </label>
              <label className={cn(
                "cursor-pointer rounded-2xl border border-border p-4 transition-all hover:border-primary/50",
                currentMetodo === "retirada" && "border-primary bg-primary/5 ring-1 ring-primary"
              )}>
                <input type="radio" value="retirada" className="sr-only" {...register("metodoEntrega")} />
                <span className="block text-sm font-bold">Retirar na loja</span>
                <span className="mt-1 block text-xs text-muted-foreground">São Bento do Sul - Sem custo</span>
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="horarioEntrega" className="text-sm font-medium">
                {currentMetodo === "entrega" ? "Horário preferencial de entrega" : "Horário de retirada"}
              </label>
              <select id="horarioEntrega" className={fieldClass} {...register("horarioEntrega")}>
                <option value="">Selecione um horário...</option>
                <option value="09:00 - 10:00">09:00 às 10:00</option>
                <option value="10:00 - 11:00">10:00 às 11:00</option>
                <option value="11:00 - 12:00">11:00 às 12:00</option>
                <option value="14:00 - 15:00">14:00 às 15:00</option>
                <option value="15:00 - 16:00">15:00 às 16:00</option>
                <option value="16:00 - 17:00">16:00 às 17:00</option>
                <option value="17:00 - 18:00">17:00 às 18:00</option>
              </select>
              {errors.horarioEntrega && <p className="mt-1 text-xs text-destructive">{errors.horarioEntrega.message}</p>}
            </div>
          </fieldset>

          {currentMetodo === "entrega" && (
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Endereço de Entrega
              </legend>

              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Seus endereços salvos</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => applyAddress(addr)}
                        className={cn(
                          "flex flex-col items-start rounded-2xl border p-4 text-left transition-all",
                          selectedAddressId === addr.id 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            {addr.label}
                          </span>
                          {selectedAddressId === addr.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="mt-1 text-sm font-medium line-clamp-1">
                          {addr.rua}, {addr.numero}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {addr.bairro}, {addr.cidade}
                        </p>
                      </button>
                    ))}
                    <Link 
                      to="/perfil"
                      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-4 text-center hover:bg-muted/50 transition-colors"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-xs font-medium text-muted-foreground">Novo endereço</span>
                    </Link>
                  </div>
                </div>
              )}

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
          )}

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
            {isSubmitting ? "Registrando pedido..." : `Vamos para o checkout agora • ${formatBRL(total)}`}
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
