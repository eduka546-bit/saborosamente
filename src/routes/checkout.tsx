import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  MessageCircle,
  MapPin,
  ChevronDown,
  Gift,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { normalizarEntregaConfig, gerarDatasEntrega } from "@/lib/entrega-config";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/orders.functions";
import {
  getCashbackConfig,
  getSaldo,
  usarCashback,
  calcularCashbackUtilizavel,
} from "@/lib/cashback";
import {
  defaultPaymentMethods,
  defaultCardFlags,
  defaultMealFlags,
  enabledOrDefault,
} from "@/lib/payment-options";
import { checkoutSchema, type CheckoutForm } from "@/lib/checkout-validation";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    cupom: typeof search.cupom === "string" ? search.cupom : undefined,
  }),
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
    discount,
    clear,
    selectedCity,
    setSelectedCity,
    selectedBairro,
    setSelectedBairro,
    taxas,
  } = useCart();

  const navigate = useNavigate();
  const search = useSearch({ from: "/checkout" });
  const createOrderFn = useServerFn(createOrder);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [feedbackNota, setFeedbackNota] = useState(0);
  const [feedbackComentario, setFeedbackComentario] = useState("");
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentValue>("pix");
  const [selectedFlag, setSelectedFlag] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // ── data e horário de entrega (entrega programada) ─────────────────────────
  const [dataEntrega, setDataEntrega] = useState<string>("");
  const [horarioEntrega, setHorarioEntrega] = useState<string>("");

  // ── cashback ──────────────────────────────────────────────────────────────
  const [cashbackSaldo, setCashbackSaldo] = useState(0);
  const [cashbackConfig, setCashbackConfig] = useState<any>(null);
  const [cashbackAtivado, setCashbackAtivado] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    getCashbackConfig().then((cfg) => setCashbackConfig(cfg));
    getSaldo(session.user.id).then((s) => setCashbackSaldo(s));
  }, [session]);

  // ── cupom de desconto ─────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState(search.cupom ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    codigo: string;
    tipo: string;
    valor: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // aplica cupom que vier da URL automaticamente
  useEffect(() => {
    if (search.cupom) {
      applyCoupon(search.cupom);
    }
  }, []);

  async function applyCoupon(code: string) {
    const c = (code || couponInput).trim().toUpperCase();
    if (!c) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const { data, error } = await supabase
        .from("cupons")
        .select("codigo, tipo, valor, ativo, validade, regra, uso, max_uso, apenas_primeira_compra")
        .eq("codigo", c)
        .eq("ativo", true)
        .maybeSingle();

      if (error || !data) {
        setCouponError("Cupom inválido ou expirado.");
        setAppliedCoupon(null);
        return;
      }
      if (data.validade && new Date(data.validade) < new Date()) {
        setCouponError("Este cupom expirou.");
        setAppliedCoupon(null);
        return;
      }
      // verifica limite de usos
      if (data.max_uso !== null && data.max_uso !== undefined && data.uso >= data.max_uso) {
        setCouponError("Este cupom já atingiu o limite de usos.");
        setAppliedCoupon(null);
        return;
      }
      // verifica restrição de primeira compra
      if (data.apenas_primeira_compra) {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        if (s?.user) {
          // usuário logado — verifica pedidos pelo user_id
          const { count } = await supabase
            .from("pedidos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", s.user.id)
            .neq("status", "Cancelado");
          if ((count ?? 0) > 0) {
            setCouponError("Este cupom é exclusivo para a primeira compra.");
            setAppliedCoupon(null);
            return;
          }
        }
        // visitante não logado — não bloqueia, mas o servidor pode checar e-mail/telefone no onSubmit
      }

      setAppliedCoupon({ codigo: data.codigo, tipo: data.tipo, valor: data.valor });
      setCouponInput(data.codigo);
      setCouponError("");
    } catch {
      setCouponError("Erro ao validar cupom. Tente novamente.");
    } finally {
      setCouponLoading(false);
    }
  }

  // calcula desconto do cupom
  const couponDiscount = appliedCoupon
    ? appliedCoupon.tipo === "Percentual"
      ? subtotal * (appliedCoupon.valor / 100)
      : appliedCoupon.tipo === "Entrega Grátis"
        ? shipping
        : appliedCoupon.valor
    : 0;

  // calcula desconto do cashback e total final
  // Máximo de cashback utilizável, calculado por função pura testada (cashback.ts):
  // respeita saldo, teto percentual do pedido e saldo mínimo de uso.
  const cashbackMaxDesc = cashbackConfig
    ? calcularCashbackUtilizavel(cashbackSaldo, total - couponDiscount, cashbackConfig)
    : 0;
  const cashbackDesconto = cashbackAtivado ? cashbackMaxDesc : 0;
  const finalTotal = Math.max(0, total - couponDiscount - cashbackDesconto);

  // ── buscar configurações de pagamento do banco ────────────────────────────
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    },
  });

  // ── Datas e horários de entrega — configuráveis na aba Parâmetros do admin ──
  const entregaCfg = normalizarEntregaConfig((siteSettings as any)?.parametros_loja?.entrega);
  const datasEntrega = gerarDatasEntrega(entregaCfg);
  const HORARIOS_ENTREGA = entregaCfg.horarios;

  // Há marmita personalizada no carrinho? (para o aviso de prazo)
  const temMarmitaPersonalizada = lines.some((l) => l.custom);

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
    setSelectedFlag(""); // limpa bandeira ao trocar método
    setValue("pagamento", value, { shouldValidate: true });
  }

  const onSubmit = async (data: CheckoutForm) => {
    // Exige login antes de finalizar — leva para a página de login/registro,
    // que volta ao checkout depois de autenticar.
    if (!session) {
      navigate({ to: "/auth", search: { redirect: "/checkout" } as any });
      return;
    }

    // Entrega programada: exige data e horário escolhidos
    if (!dataEntrega) {
      toast.error("Escolha a data de entrega.");
      return;
    }
    if (!horarioEntrega) {
      toast.error("Escolha o horário de entrega.");
      return;
    }

    // Marmita personalizada: mínimo de unidades por combinação.
    const MIN_PERSONALIZADA = 3;
    if (lines.some((l) => l.custom && l.quantity < MIN_PERSONALIZADA)) {
      toast.error(
        `Cada marmita personalizada precisa de no mínimo ${MIN_PERSONALIZADA} unidades.`,
      );
      return;
    }

    try {
      // A validação do cupom (validade, limite de usos, primeira compra) e o
      // incremento de uso agora são feitos no servidor, dentro de createOrder —
      // de forma confiável e à prova de manipulação pelo cliente.

      // cria o pedido real no banco
      const order = await createOrderFn({
        data: {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          metodoEntrega: selectedBairro ? "entrega" : "retirada",
          horarioEntrega: `${dataEntrega} • ${horarioEntrega}`,
          cidade: data.cidade,
          bairro: selectedBairro,
          endereco: data.endereco,
          complemento: data.complemento,
          cep: data.cep,
          pagamento: data.pagamento,
          observacoes: data.observacoes,
          valorTotal: finalTotal,
          taxaEntrega: shipping,
          desconto: discount + couponDiscount,
          cupom: appliedCoupon?.codigo,
          troco: data.troco,
          tipoCartao: selectedFlag || undefined,
          userId: session?.user?.id,
          items: lines.map((l) => ({
            productId: l.custom ? null : l.product.id,
            quantity: l.quantity,
            weight: l.weight,
            price: l.subtotal / l.quantity,
            opcoes: l.opcoes,
            custom: l.custom
              ? {
                  label: l.custom.label,
                  tamanhoSigla: l.custom.tamanhoSigla,
                  pesoTotal: l.custom.pesoTotal,
                  itens: l.custom.itens,
                }
              : undefined,
          })),
        },
      });

      setOrderId(order.id);
      clear();

      // Notifica cliente via WhatsApp — confirmação do pedido
      try {
        // Se pagamento é PIX, gera QR code primeiro
        let qrCodeUrl = null;
        if (data.pagamento === "pix") {
          try {
            const pixRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pix-qr`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                  pix_dict: "chave-pix@saborosamente", // TODO: Carregar do admin settings
                  valor: finalTotal,
                  descricao: `Pedido #${order.id.slice(0, 8).toUpperCase()}`,
                  pedido_id: order.id,
                }),
              },
            );
            const pixData = await pixRes.json();
            qrCodeUrl = pixData.qr_code_url;
          } catch (e) {
            console.warn("Erro ao gerar QR Code PIX:", e);
          }
        }

        // Envia notificação via WhatsApp com QR code se PIX
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            pedido_id: order.id,
            status_novo: data.pagamento === "pix" ? "pagamento_confirmado" : "novo_pedido",
            qr_code_pix: qrCodeUrl,
            valor_total: finalTotal,
          }),
        });
      } catch (_) {
        /* falha ao notificar não deve bloquear a finalização do pedido */
      }

      // Cashback: o CRÉDITO só acontece quando o pedido é finalizado (status
      // "entregue"), feito no painel admin — pedidos não finalizados não geram
      // cashback. Aqui apenas debitamos o cashback que o cliente optou por usar.
      if (session?.user?.id && cashbackDesconto > 0) {
        await usarCashback(session.user.id, order.id, cashbackDesconto);
      }

      toast.success("Pedido registrado!", {
        description: `Protocolo #${order.id.slice(0, 8).toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("[checkout] falha ao registrar pedido", error);
      toast.error("Não foi possível registrar o pedido: " + (error?.message ?? "Tente novamente."));
    }
  };

  // ── tela de confirmação ──────────────────────────────────────────────────────
  if (orderId) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-extrabold">Pedido recebido!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Protocolo{" "}
          <strong className="text-foreground">#{orderId.slice(0, 8).toUpperCase()}</strong>. Em
          breve entraremos em contato para confirmar.
        </p>

        {/* Acompanhar pedido pelo WhatsApp */}
        {(() => {
          const protocolo = orderId.slice(0, 8).toUpperCase();
          const whatsapp =
            (siteSettings as any)?.contato_whatsapp ||
            (siteSettings as any)?.footer_whatsapp ||
            "5547991607757";
          const msg = `Olá! Quero acompanhar meu pedido nº #${protocolo}`;
          const waUrl = `https://wa.me/${String(whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
          return (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Acompanhar pedido no WhatsApp
            </a>
          );
        })()}

        {/* Modal de Feedback */}
        {!feedbackEnviado && (
          <div className="mt-8 bg-white border rounded-2xl p-6 text-left shadow-sm">
            <h3 className="text-lg font-bold text-center mb-1">Como foi sua experiência?</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Sua opinião nos ajuda a melhorar!
            </p>

            {/* Estrelas de nota */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFeedbackNota(n)}
                  className={`text-2xl transition-transform hover:scale-125 ${
                    n <= feedbackNota ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comentário */}
            <textarea
              placeholder="Deixe um comentário (opcional)..."
              value={feedbackComentario}
              onChange={(e) => setFeedbackComentario(e.target.value)}
              className="w-full border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.from("avaliacoes").insert([
                      {
                        pedido_id: orderId,
                        user_id: session?.user?.id || null,
                        nota: feedbackNota,
                        comentario: feedbackComentario || null,
                      },
                    ]);
                    setFeedbackEnviado(true);
                    toast.success("Obrigado pelo feedback!");
                  } catch (e) {
                    setFeedbackEnviado(true);
                  }
                }}
                disabled={feedbackNota === 0}
                className="flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Feedback
              </button>
              <button
                type="button"
                onClick={() => setFeedbackEnviado(true)}
                className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Pular
              </button>
            </div>
          </div>
        )}

        {feedbackEnviado && (
          <p className="mt-4 text-sm text-green-600 font-medium">Obrigado pelo seu feedback!</p>
        )}

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
                {[...new Set(taxas.map((t) => t.cidade))].sort().map((city) => (
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

            {/* Aviso de prazo — marmitas personalizadas */}
            {temMarmitaPersonalizada && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <span className="text-base leading-none">⏳</span>
                <span>
                  Seu pedido tem <strong>marmita(s) personalizada(s)</strong>. Você escolhe a data
                  normalmente, mas esses itens precisam de cerca de <strong>1 semana</strong> de
                  preparo e serão entregues na semana seguinte. Os demais itens saem na data/horário
                  escolhidos.
                </span>
              </div>
            )}

            {/* ── Data e horário de entrega (entrega programada) ────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dataEntrega" className="text-sm font-medium">
                  Data de entrega
                </label>
                <select
                  id="dataEntrega"
                  className={fieldClass}
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                >
                  <option value="">Selecione uma data</option>
                  {datasEntrega.map((d) => (
                    <option key={d.valor} value={d.valor}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="horarioEntrega" className="text-sm font-medium">
                  Horário
                </label>
                <select
                  id="horarioEntrega"
                  className={fieldClass}
                  value={horarioEntrega}
                  onChange={(e) => setHorarioEntrega(e.target.value)}
                >
                  <option value="">Selecione um horário</option>
                  {HORARIOS_ENTREGA.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
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
                      <span className="text-2xl" aria-hidden="true">
                        💳
                      </span>
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
                <MessageCircle
                  className="mt-0.5 size-5 shrink-0 text-green-600"
                  aria-hidden="true"
                />
                <p>
                  Após confirmar o pedido, enviaremos o{" "}
                  <strong>{selectedPayment === "pix" ? "código PIX" : "link de pagamento"}</strong>{" "}
                  via <strong>WhatsApp</strong>. Mantenha o aplicativo aberto para receber. 📲
                </p>
              </div>
            )}

            {selectedPayment === "cartao" && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-semibold">💳 Selecione a bandeira do cartão</p>
                <div className="flex flex-wrap gap-2">
                  {cardFlags.map((flag) => {
                    const isSelected = selectedFlag === flag.name;
                    return (
                      <button
                        key={flag.name}
                        type="button"
                        onClick={() => setSelectedFlag(flag.name ?? "")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 font-semibold shadow-sm"
                            : "border-border bg-background hover:border-primary",
                        )}
                      >
                        {flag.logo ? (
                          <img src={flag.logo} alt={flag.name} className="h-5 w-8 object-contain" />
                        ) : null}
                        <span className="text-xs">{flag.name}</span>
                      </button>
                    );
                  })}
                </div>
                {!selectedFlag && (
                  <p className="text-xs text-muted-foreground">
                    Selecione a bandeira para continuar
                  </p>
                )}
              </div>
            )}

            {selectedPayment === "alimentacao" && (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <p className="text-sm font-semibold">🍴 Selecione o cartão de benefício</p>
                <div className="flex flex-wrap gap-2">
                  {mealFlags.map((flag) => {
                    const isSelected = selectedFlag === flag.name;
                    return (
                      <button
                        key={flag.name}
                        type="button"
                        onClick={() => setSelectedFlag(flag.name ?? "")}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 font-semibold shadow-sm"
                            : "border-border bg-background hover:border-primary",
                        )}
                      >
                        {flag.logo ? (
                          <img src={flag.logo} alt={flag.name} className="h-5 w-8 object-contain" />
                        ) : null}
                        <span className="text-xs">{flag.name}</span>
                      </button>
                    );
                  })}
                </div>
                {!selectedFlag && (
                  <p className="text-xs text-muted-foreground">Selecione o cartão para continuar</p>
                )}
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

          {/* ── cupom de desconto ─────────────────────────────────────── */}
          <div>
            <label className="text-sm font-medium">Cupom de desconto</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setCouponError("");
                  setAppliedCoupon(null);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), applyCoupon(couponInput))
                }
                placeholder="Digite seu cupom"
                className={cn(
                  fieldClass,
                  "flex-1 mt-0 uppercase tracking-widest font-bold",
                  appliedCoupon ? "border-green-400 bg-green-50" : "",
                )}
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput("");
                  }}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors"
                >
                  Remover
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => applyCoupon(couponInput)}
                  disabled={couponLoading || !couponInput.trim()}
                  className="rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {couponLoading ? "..." : "Aplicar"}
                </button>
              )}
            </div>
            {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
            {appliedCoupon && (
              <p className="mt-1 text-xs text-green-600 font-semibold">
                ✓ Cupom <strong>{appliedCoupon.codigo}</strong> aplicado —{" "}
                {appliedCoupon.tipo === "Percentual"
                  ? `${appliedCoupon.valor}% de desconto`
                  : appliedCoupon.tipo === "Entrega Grátis"
                    ? "frete grátis"
                    : `R$ ${appliedCoupon.valor.toFixed(2)} de desconto`}
              </p>
            )}
          </div>

          {/* ── cashback ───────────────────────────────────────────────── */}
          {session && cashbackSaldo > 0 && cashbackConfig?.ativo && (
            <div
              className={cn(
                "rounded-2xl border p-4 space-y-2 transition-all",
                cashbackAtivado ? "border-yellow-400 bg-yellow-50" : "border-border bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift size={15} className="text-yellow-600" />
                  <span className="text-sm font-semibold">
                    Cashback disponível:{" "}
                    <strong className="text-yellow-700">{formatBRL(cashbackSaldo)}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCashbackAtivado(!cashbackAtivado)}
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded-full transition-all",
                    cashbackAtivado
                      ? "bg-yellow-500 text-white"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                  )}
                >
                  {cashbackAtivado ? "✓ Usando" : "Usar"}
                </button>
              </div>
              {cashbackAtivado && cashbackDesconto > 0 && (
                <p className="text-xs text-yellow-700">
                  Desconto de <strong>{formatBRL(cashbackDesconto)}</strong> aplicado.
                </p>
              )}
              {cashbackSaldo < (cashbackConfig?.minimo_uso ?? 5) && (
                <p className="text-xs text-muted-foreground">
                  Saldo mínimo para usar: {formatBRL(cashbackConfig?.minimo_uso ?? 5)}
                </p>
              )}
            </div>
          )}

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
              : session
                ? `Confirmar pedido • ${formatBRL(finalTotal)}`
                : `Entrar para confirmar • ${formatBRL(finalTotal)}`}
          </button>

          {!session && (
            <p className="text-center text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => navigate({ to: "/auth", search: { redirect: "/checkout" } as any })}
                className="text-primary font-semibold hover:underline"
              >
                Fazer login ou criar conta
              </button>{" "}
              para finalizar o pedido e acompanhar suas entregas.
            </p>
          )}
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
              <dd>
                {appliedCoupon?.tipo === "Entrega Grátis" ? (
                  <span className="text-green-600 font-semibold">Grátis</span>
                ) : shipping === 0 ? (
                  "Grátis"
                ) : (
                  formatBRL(shipping)
                )}
              </dd>
            </div>
            {couponDiscount > 0 && appliedCoupon?.tipo !== "Entrega Grátis" && (
              <div className="flex justify-between text-green-600">
                <dt className="font-semibold flex items-center gap-1">
                  🎟️ Cupom {appliedCoupon?.codigo}
                </dt>
                <dd>− {formatBRL(couponDiscount)}</dd>
              </div>
            )}
            {cashbackDesconto > 0 && (
              <div className="flex justify-between text-yellow-600">
                <dt className="font-semibold flex items-center gap-1">
                  <Gift size={12} /> Cashback
                </dt>
                <dd>− {formatBRL(cashbackDesconto)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold text-primary">{formatBRL(finalTotal)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
