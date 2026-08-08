import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/orders.functions";
import { useServerFn } from "@tanstack/react-start";
import { Ticket } from "lucide-react";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://saborosamente.lovable.app/checkout" }],
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
  bairro: z.string().trim().max(80).optional(),
  pagamento: z.enum(["pix", "cartao", "dinheiro", "alimentacao", "mercadopago"]),
  troco: z.string().optional(),
  tipoCartao: z.string().optional(),
  observacoes: z.string().trim().max(300).optional(),
  cupom: z.string().trim().optional(),
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

const pagamentos: { value: CheckoutForm["pagamento"]; label: string; hint: string; icon?: string }[] = [
  { value: "pix", label: "PIX", hint: "Na entrega", icon: "https://logospng.org/download/pix/logo-pix-icone-512.png" },
  { value: "cartao", label: "Cartão", hint: "Crédito/Débito", icon: "https://cdn-icons-png.flaticon.com/512/6963/6963703.png" },
  { value: "alimentacao", label: "Alimentação", hint: "Refeição/VR", icon: "https://cdn-icons-png.flaticon.com/512/2737/2737034.png" },
  { value: "mercadopago", label: "Mercado Pago", hint: "Link", icon: "https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png" },
  { value: "dinheiro", label: "Dinheiro", hint: "Na entrega", icon: "https://cdn-icons-png.flaticon.com/512/2489/2489756.png" },
];

const cartaoFlags = [
  { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
  { name: "Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
  { name: "Hiper", logo: "https://logodownload.org/wp-content/uploads/2015/05/hiper-logo.png" },
  { name: "Elo", logo: "https://upload.wikimedia.org/wikipedia/commons/0/03/Logo_Elo_cortado.png" },
  { name: "Hipercard", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Hipercard_logo.svg" },
  { name: "Diners Club", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg" },
  { name: "American Express", logo: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" }
];

const alimentacaoFlags = [
  { name: "VR", logo: "https://vrsolucao.com.br/wp-content/uploads/2021/05/logo-vr.png" },
  { name: "Ticket", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Ticket_Logotipo.svg/1200px-Ticket_Logotipo.svg.png" },
  { name: "Alelo", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Alelo_logo.svg" },
  { name: "Pluxee", logo: "https://logodownload.org/wp-content/uploads/2023/11/pluxee-logo.png" },
  { name: "Sodexo", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Sodexo_logo.svg/1200px-Sodexo_logo.svg.png" },
  { name: "Caju", logo: "https://media.licdn.com/dms/image/C4D0BAQG5k6Uv8xXkWA/company-logo_200_200/0/1630571932371?e=2147483647&v=beta&t=4m1O9nE7qI_pT_k5i_0i_0Y_0o_0o_0o_0" },
  { name: "Flash", logo: "https://vagas.com.br/logos-empresas/81254/original.png" }
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

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const configuredPagamentos = useMemo(() => {
    if (siteSettings?.payment_methods && Array.isArray(siteSettings.payment_methods)) {
      return siteSettings.payment_methods.filter((p: any) => p.enabled);
    }
    return pagamentos;
  }, [siteSettings]);

  const configuredCartaoFlags = useMemo(() => {
    if (siteSettings?.card_flags && Array.isArray(siteSettings.card_flags)) {
      return siteSettings.card_flags.filter((f: any) => f.enabled);
    }
    return cartaoFlags;
  }, [siteSettings]);

  const configuredAlimentacaoFlags = useMemo(() => {
    if (siteSettings?.meal_flags && Array.isArray(siteSettings.meal_flags)) {
      return siteSettings.meal_flags.filter((f: any) => f.enabled);
    }
    return alimentacaoFlags;
  }, [siteSettings]);

  const createOrderFn = useServerFn(createOrder);

  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isFetchingCEP, setIsFetchingCEP] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { 
      pagamento: "pix",
      metodoEntrega: "entrega",
      horarioEntrega: "",
      cidade: selectedCity 
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentMetodo = watch("metodoEntrega");
  const currentPagamento = watch("pagamento");
  const currentTipoCartao = watch("tipoCartao");

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleCEP = async (cep: string) => {
    try {
      setIsFetchingCEP(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error("Não foi possível consultar o CEP");
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      // Preencher campos
      setValue("endereco", data.logradouro || "", { shouldDirty: true, shouldValidate: true });
      setValue("bairro", data.bairro || "", { shouldDirty: true, shouldValidate: true });
      setValue("cidade", data.localidade || "", { shouldDirty: true, shouldValidate: true });
      
      // Atualizar estados do carrinho para cálculo de frete
      setSelectedCity(data.localidade);
      setSelectedBairro(data.bairro);
      
      toast.success("Endereço preenchido via CEP!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Não foi possível buscar o CEP. Tente novamente.");
    } finally {
      setIsFetchingCEP(false);
    }
  };

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
      .eq("id", currentSession.user.id)
      .single();
    
    if (profile) {
      setValue("nome", profile.nome || "");
      setValue("email", currentSession.user.email || currentSession.user.user_metadata?.email || "");
      setValue("telefone", profile.telefone || "");
    }

    // Fetch Addresses
    const { data: addresses } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", currentSession.user.id);
    
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
    if (addr.cep) {
      const digits = String(addr.cep).replace(/\D/g, "");
      const masked = digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : String(addr.cep);
      setValue("cep", masked, { shouldDirty: true, shouldValidate: true });
    }
    setValue("cidade", addr.cidade);
    setValue("bairro", addr.bairro);
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
              bairro: data.bairro || selectedBairro,
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
        bairro: data.bairro || selectedBairro,
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
                "relative cursor-pointer rounded-2xl border border-border p-4 transition-all hover:border-primary/50",
                currentMetodo === "entrega" ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
              )}>
                <input 
                  type="radio" 
                  value="entrega" 
                  className="sr-only" 
                  {...register("metodoEntrega")}
                  onChange={(e) => {
                    setValue("metodoEntrega", "entrega", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                  }}
                />
                <span className="block text-sm font-bold pointer-events-none">Entrega em domicílio</span>
                <span className="mt-1 block text-xs text-muted-foreground pointer-events-none">Receba no seu endereço</span>
              </label>
              <label className={cn(
                "relative cursor-pointer rounded-2xl border border-border p-4 transition-all hover:border-primary/50",
                currentMetodo === "retirada" ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
              )}>
                <input 
                  type="radio" 
                  value="retirada" 
                  className="sr-only" 
                  {...register("metodoEntrega")}
                  onChange={(e) => {
                    setValue("metodoEntrega", "retirada", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                  }}
                />
                <span className="block text-sm font-bold pointer-events-none">Retirar na loja</span>
                <span className="mt-1 block text-xs text-muted-foreground pointer-events-none">São Bento do Sul - Sem custo</span>
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
                    {...register("bairro")}
                    onChange={(e) => {
                      setSelectedBairro(e.target.value);
                      setValue("bairro", e.target.value);
                    }}
                  >
                    <option value="">Selecione...</option>
                    {taxas
                      .filter(t => t.cidade === selectedCity)
                      .sort((a, b) => a.bairro.localeCompare(b.bairro))
                      .map(t => (
                        <option key={t.id} value={t.bairro}>{t.bairro}</option>
                      ))}
                  </select>
                  {errors.bairro && <p className="mt-1 text-xs text-destructive">{errors.bairro.message}</p>}
                </div>
                <div className="relative">
                  <label htmlFor="cep" className="text-sm font-medium">
                    CEP
                  </label>
                  <div className="relative">
                    <input 
                      id="cep" 
                      placeholder="00000-000" 
                      className={cn(fieldClass, isFetchingCEP && "pr-10")} 
                      {...register("cep", {
                        onChange: (event) => {
                          const cep = event.target.value.replace(/\D/g, "");
                          if (cep.length === 8) void handleCEP(cep);
                        },
                      })} 
                    />
                    {isFetchingCEP && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    )}
                  </div>
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
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {configuredPagamentos.map((p: any) => {
                const isSelected = currentPagamento === p.value;
                return (
                  <div
                    key={p.value}
                    onClick={() => {
                      setValue("pagamento", p.value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                      if (p.value === "alimentacao") {
                        setValue("tipoCartao", "Alimentação/Refeição", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                      }
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center cursor-pointer rounded-2xl border p-4 text-center transition-all hover:border-primary/50",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-border bg-card"
                    )}
                  >
                    <input 
                      type="radio" 
                      value={p.value} 
                      checked={isSelected}
                      readOnly
                      className="sr-only" 
                    />
                    {p.icon && (
                      <img src={p.icon} alt="" className="mb-2 size-6 object-contain pointer-events-none" />
                    )}
                    <span className="block text-sm font-bold pointer-events-none">{p.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground pointer-events-none">{p.hint}</span>
                  </div>
                );
              })}
            </div>

            {currentPagamento === "dinheiro" && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                <label htmlFor="troco" className="text-sm font-medium">
                  Precisa de troco para quanto?
                </label>
                <input
                  id="troco"
                  placeholder="Ex: R$ 50,00"
                  className={fieldClass}
                  {...register("troco")}
                />
              </div>
            )}

            {currentPagamento === "cartao" && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium">Selecione o tipo de cartão</label>
                <div className="flex flex-wrap gap-2">
                  {["Crédito", "Débito"].map((tipo) => (
                    <label
                      key={tipo}
                      className={cn(
                        "relative cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                        currentTipoCartao === tipo ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <input 
                        type="radio" 
                        value={tipo} 
                        className="sr-only" 
                        {...register("tipoCartao")}
                        onChange={(e) => {
                          setValue("tipoCartao", e.target.value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        }}
                      />
                      {tipo}
                    </label>
                  ))}
                </div>
                <div className="mt-2 rounded-2xl bg-muted/30 p-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                    💳 Bandeiras aceitas
                  </span>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    {configuredCartaoFlags.map((flag: any) => (
                      <div key={flag.name} className="flex flex-col items-center gap-1.5">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm border border-border/50">
                          <img src={flag.logo} alt={flag.name} className="size-full object-contain" />
                        </div>
                        <span className="text-[10px] text-center font-medium leading-tight">{flag.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentPagamento === "alimentacao" && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                    🍴 Cartões aceitos
                  </span>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    {configuredAlimentacaoFlags.map((flag: any) => (
                      <div key={flag.name} className="flex flex-col items-center gap-1.5">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm border border-border/50">
                          <img src={flag.logo} alt={flag.name} className="size-full object-contain" />
                        </div>
                        <span className="text-[10px] text-center font-medium leading-tight">{flag.name}</span>
                      </div>
                    ))}
                  </div>
                  <input type="hidden" value="Alimentação/Refeição" {...register("tipoCartao")} />
                </div>
              </div>
            )}
            {currentPagamento === "mercadopago" && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
                  <p className="text-sm font-medium text-primary">
                    Pagamento via Mercado Pago
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Após finalizar o pedido, você receberá o link de pagamento do Mercado Pago pelo WhatsApp ou E-mail para concluir sua compra.
                  </p>
                </div>
              </div>
            )}
          </fieldset>

          <div>
            <label htmlFor="observacoes" className="text-sm font-medium">
              Observações (opcional)
            </label>
            <textarea id="observacoes" rows={3} className={fieldClass} {...register("observacoes")} />
          </div>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Cupom de Desconto
            </legend>
            <div className="relative">
              <Ticket className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                id="cupom" 
                placeholder="Tem um cupom?" 
                className={cn(fieldClass, "pl-10 uppercase")} 
                {...register("cupom")} 
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {isSubmitting ? "Registrando pedido..." : `Finalizar compra • ${formatBRL(total)}`}
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
