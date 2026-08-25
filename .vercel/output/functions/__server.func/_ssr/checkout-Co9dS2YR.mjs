import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as MessageCircle, Kt as ChevronDown, Rt as CircleCheck, gt as Gift, i as X, ot as LogIn, rt as MapPin, u as UserPlus } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as useSearch, g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BVZilnxn.mjs";
import { i as useCart, r as formatBRL } from "./cart-BqYHNYf3.mjs";
import { i as enabledOrDefault, n as defaultMealFlags, r as defaultPaymentMethods, t as defaultCardFlags } from "./payment-options-bcTVjPID.mjs";
import { a as usarCashback, i as getSaldo, n as creditarCashback, r as getCashbackConfig, t as calcularCashbackUtilizavel } from "./cashback-BUSwvZGQ.mjs";
import { a as stringType, i as objectType, n as enumType, o as ZodIssueCode, r as numberType, t as arrayType } from "../_libs/zod.mjs";
import { n as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkout-Co9dS2YR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var orderItemSchema = objectType({
	productId: stringType(),
	quantity: numberType(),
	weight: stringType().optional(),
	price: numberType()
});
var createOrderSchema = objectType({
	nome: stringType(),
	email: stringType(),
	telefone: stringType(),
	metodoEntrega: enumType(["entrega", "retirada"]),
	horarioEntrega: stringType(),
	cidade: stringType().optional(),
	bairro: stringType().optional(),
	endereco: stringType().optional(),
	complemento: stringType().optional(),
	cep: stringType().optional(),
	pagamento: stringType(),
	observacoes: stringType().optional(),
	valorTotal: numberType(),
	taxaEntrega: numberType(),
	userId: stringType().uuid().optional(),
	desconto: numberType(),
	cupom: stringType().optional(),
	items: arrayType(orderItemSchema),
	troco: stringType().optional(),
	tipoCartao: stringType().optional()
});
var createOrder = createServerFn({ method: "POST" }).validator((data) => createOrderSchema.parse(data)).handler(createSsrRpc("7f92d135aa3763ddd5bf6d4d9f84832b6b591cbaa35dcc4048b4b1beed8e7bf3"));
var checkoutSchema = objectType({
	nome: stringType().trim().min(3, "Informe seu nome completo").max(80),
	email: stringType().trim().email("E-mail inválido").max(120),
	telefone: stringType().trim().min(10, "Telefone com DDD").max(20),
	cep: stringType().trim().optional(),
	endereco: stringType().trim().min(5, "Informe rua e número").max(160),
	complemento: stringType().trim().max(80).optional(),
	cidade: stringType().trim().min(2, "Informe a cidade").max(80),
	pagamento: enumType([
		"pix",
		"cartao",
		"alimentacao",
		"mercadopago",
		"dinheiro"
	]),
	troco: stringType().trim().optional(),
	observacoes: stringType().trim().max(300).optional()
}).superRefine((data, ctx) => {
	if (data.pagamento === "dinheiro" && data.troco && isNaN(Number(data.troco))) ctx.addIssue({
		code: ZodIssueCode.custom,
		message: "Informe um valor numérico para o troco",
		path: ["troco"]
	});
});
var PAYMENT_VALUE_MAP = {
	PIX: "pix",
	Cartão: "cartao",
	Alimentação: "alimentacao",
	"Mercado Pago": "mercadopago",
	Dinheiro: "dinheiro"
};
var fieldClass = "mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring";
function Checkout() {
	const { lines, subtotal, shipping, total, discount, clear, selectedCity, setSelectedCity, selectedBairro, setSelectedBairro, taxas } = useCart();
	const navigate = useNavigate();
	const search = useSearch({ from: "/checkout" });
	const createOrderFn = useServerFn(createOrder);
	const [orderId, setOrderId] = (0, import_react.useState)(null);
	const [feedbackNota, setFeedbackNota] = (0, import_react.useState)(0);
	const [feedbackComentario, setFeedbackComentario] = (0, import_react.useState)("");
	const [feedbackEnviado, setFeedbackEnviado] = (0, import_react.useState)(false);
	const [selectedPayment, setSelectedPayment] = (0, import_react.useState)("pix");
	const [selectedFlag, setSelectedFlag] = (0, import_react.useState)("");
	const [session, setSession] = (0, import_react.useState)(null);
	const [addresses, setAddresses] = (0, import_react.useState)([]);
	const [selectedAddressId, setSelectedAddressId] = (0, import_react.useState)("");
	const [showAuthModal, setShowAuthModal] = (0, import_react.useState)(false);
	const [authMode, setAuthMode] = (0, import_react.useState)("login");
	const [authEmail, setAuthEmail] = (0, import_react.useState)("");
	const [authPassword, setAuthPassword] = (0, import_react.useState)("");
	const [authNome, setAuthNome] = (0, import_react.useState)("");
	const [authTelefone, setAuthTelefone] = (0, import_react.useState)("");
	const [authLoading, setAuthLoading] = (0, import_react.useState)(false);
	const handleAuth = async (e) => {
		e.preventDefault();
		setAuthLoading(true);
		try {
			if (authMode === "login") {
				const { data, error } = await supabase.auth.signInWithPassword({
					email: authEmail,
					password: authPassword
				});
				if (error) throw error;
				setSession(data.session);
				if (data.session?.user) {
					setValue("email", data.session.user.email ?? "");
					const { data: profile } = await supabase.from("profiles").select("nome, telefone").eq("id", data.session.user.id).single();
					if (profile?.nome) setValue("nome", profile.nome);
					if (profile?.telefone) setValue("telefone", profile.telefone);
				}
				toast.success("Login realizado! Agora finalize seu pedido.");
				setShowAuthModal(false);
			} else {
				const { data, error } = await supabase.auth.signUp({
					email: authEmail,
					password: authPassword,
					options: { data: {
						nome: authNome,
						telefone: authTelefone
					} }
				});
				if (error) throw error;
				if (data.session) {
					setSession(data.session);
					setValue("email", authEmail);
					setValue("nome", authNome);
					setValue("telefone", authTelefone);
					await supabase.from("profiles").upsert({
						id: data.session.user.id,
						nome: authNome,
						telefone: authTelefone,
						email: authEmail
					});
				}
				toast.success("Conta criada! Agora finalize seu pedido.");
				setShowAuthModal(false);
			}
		} catch (err) {
			toast.error(err.message);
		} finally {
			setAuthLoading(false);
		}
	};
	const [cashbackSaldo, setCashbackSaldo] = (0, import_react.useState)(0);
	const [cashbackConfig, setCashbackConfig] = (0, import_react.useState)(null);
	const [cashbackAtivado, setCashbackAtivado] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!session?.user) return;
		getCashbackConfig().then((cfg) => setCashbackConfig(cfg));
		getSaldo(session.user.id).then((s) => setCashbackSaldo(s));
	}, [session]);
	const [couponInput, setCouponInput] = (0, import_react.useState)(search.cupom ?? "");
	const [appliedCoupon, setAppliedCoupon] = (0, import_react.useState)(null);
	const [couponError, setCouponError] = (0, import_react.useState)("");
	const [couponLoading, setCouponLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (search.cupom) applyCoupon(search.cupom);
	}, []);
	async function applyCoupon(code) {
		const c = (code || couponInput).trim().toUpperCase();
		if (!c) return;
		setCouponLoading(true);
		setCouponError("");
		try {
			const { data, error } = await supabase.from("cupons").select("codigo, tipo, valor, ativo, validade, regra, uso, max_uso, apenas_primeira_compra").eq("codigo", c).eq("ativo", true).maybeSingle();
			if (error || !data) {
				setCouponError("Cupom inválido ou expirado.");
				setAppliedCoupon(null);
				return;
			}
			if (data.validade && new Date(data.validade) < /* @__PURE__ */ new Date()) {
				setCouponError("Este cupom expirou.");
				setAppliedCoupon(null);
				return;
			}
			if (data.max_uso !== null && data.max_uso !== void 0 && data.uso >= data.max_uso) {
				setCouponError("Este cupom já atingiu o limite de usos.");
				setAppliedCoupon(null);
				return;
			}
			if (data.apenas_primeira_compra) {
				const { data: { session: s } } = await supabase.auth.getSession();
				if (s?.user) {
					const { count } = await supabase.from("pedidos").select("id", {
						count: "exact",
						head: true
					}).eq("user_id", s.user.id).neq("status", "Cancelado");
					if ((count ?? 0) > 0) {
						setCouponError("Este cupom é exclusivo para a primeira compra.");
						setAppliedCoupon(null);
						return;
					}
				}
			}
			setAppliedCoupon({
				codigo: data.codigo,
				tipo: data.tipo,
				valor: data.valor
			});
			setCouponInput(data.codigo);
			setCouponError("");
		} catch {
			setCouponError("Erro ao validar cupom. Tente novamente.");
		} finally {
			setCouponLoading(false);
		}
	}
	const couponDiscount = appliedCoupon ? appliedCoupon.tipo === "Percentual" ? subtotal * (appliedCoupon.valor / 100) : appliedCoupon.tipo === "Entrega Grátis" ? shipping : appliedCoupon.valor : 0;
	const cashbackMaxDesc = cashbackConfig ? calcularCashbackUtilizavel(cashbackSaldo, total - couponDiscount, cashbackConfig) : 0;
	const cashbackDesconto = cashbackAtivado ? cashbackMaxDesc : 0;
	const finalTotal = Math.max(0, total - couponDiscount - cashbackDesconto);
	const { data: siteSettings } = useQuery({
		queryKey: ["site-settings"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("*").maybeSingle();
			return data;
		}
	});
	const paymentMethods = enabledOrDefault(siteSettings?.payment_methods, defaultPaymentMethods);
	const cardFlags = enabledOrDefault(siteSettings?.card_flags, defaultCardFlags);
	const mealFlags = enabledOrDefault(siteSettings?.meal_flags, defaultMealFlags);
	const PAYMENT_OPTIONS = paymentMethods.map((m) => ({
		value: PAYMENT_VALUE_MAP[m.label ?? ""] ?? "pix",
		label: m.label ?? "",
		sublabel: m.hint ?? m.sublabel ?? "",
		icon: m.icon ?? ""
	}));
	const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
		resolver: u(checkoutSchema),
		defaultValues: {
			pagamento: "pix",
			cidade: selectedCity
		}
	});
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(async ({ data: { session: s } }) => {
			if (!s) return;
			setSession(s);
			setValue("email", s.user.email ?? "", { shouldValidate: false });
			const { data: profile } = await supabase.from("profiles").select("nome, telefone").eq("id", s.user.id).single();
			if (profile) {
				if (profile.nome) setValue("nome", profile.nome, { shouldValidate: false });
				if (profile.telefone) setValue("telefone", profile.telefone, { shouldValidate: false });
			}
			const { data: addrs } = await supabase.from("user_addresses").select("*").eq("user_id", s.user.id).order("is_default", { ascending: false });
			if (addrs && addrs.length > 0) {
				setAddresses(addrs);
				const defaultAddr = addrs.find((a) => a.is_default) ?? addrs[0];
				applyAddress(defaultAddr);
				setSelectedAddressId(defaultAddr.id);
			}
		});
	}, []);
	function applyAddress(addr) {
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
	function handleAddressSelect(id) {
		setSelectedAddressId(id);
		if (!id) return;
		const addr = addresses.find((a) => a.id === id);
		if (addr) applyAddress(addr);
	}
	function handlePaymentSelect(value) {
		setSelectedPayment(value);
		setSelectedFlag("");
		setValue("pagamento", value, { shouldValidate: true });
	}
	const onSubmit = async (data) => {
		if (!session) {
			setShowAuthModal(true);
			return;
		}
		try {
			const order = await createOrderFn({ data: {
				nome: data.nome,
				email: data.email,
				telefone: data.telefone,
				metodoEntrega: selectedBairro ? "entrega" : "retirada",
				horarioEntrega: "",
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
				tipoCartao: selectedFlag || void 0,
				userId: session?.user?.id,
				items: lines.map((l) => ({
					productId: l.product.id,
					quantity: l.quantity,
					weight: l.weight,
					price: l.subtotal / l.quantity
				}))
			} });
			setOrderId(order.id);
			clear();
			try {
				let qrCodeUrl = null;
				if (values.pagamento === "pix") try {
					qrCodeUrl = (await (await fetch(`https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/generate-pix-qr`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg"
						},
						body: JSON.stringify({
							pix_dict: "chave-pix@saborosamente",
							valor: finalTotal,
							descricao: `Pedido #${order.id.slice(0, 8).toUpperCase()}`,
							pedido_id: order.id
						})
					})).json()).qr_code_url;
				} catch (e) {
					console.warn("Erro ao gerar QR Code PIX:", e);
				}
				fetch(`https://lxcgbrovdmpjatywweiv.supabase.co/functions/v1/whatsapp-notify`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg"
					},
					body: JSON.stringify({
						pedido_id: order.id,
						status_novo: values.pagamento === "pix" ? "pagamento_confirmado" : "novo_pedido",
						qr_code_pix: qrCodeUrl,
						valor_total: finalTotal
					})
				});
			} catch (_) {}
			if (session?.user?.id) {
				await creditarCashback(session.user.id, order.id, finalTotal);
				if (cashbackDesconto > 0) await usarCashback(session.user.id, order.id, cashbackDesconto);
			}
			toast.success("Pedido registrado!", { description: `Protocolo #${order.id.slice(0, 8).toUpperCase()}` });
		} catch (error) {
			console.error("[checkout] falha ao registrar pedido", error);
			toast.error("Não foi possível registrar o pedido: " + (error?.message ?? "Tente novamente."));
		}
	};
	if (orderId) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-xl px-4 py-24 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
				className: "mx-auto size-14 text-primary",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 text-3xl font-extrabold",
				children: "Pedido recebido!"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: [
					"Protocolo",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
						className: "text-foreground",
						children: ["#", orderId.slice(0, 8).toUpperCase()]
					}),
					". Em breve entraremos em contato para confirmar."
				]
			}),
			!feedbackEnviado && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 bg-white border rounded-2xl p-6 text-left shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-bold text-center mb-1",
						children: "Como foi sua experiência?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground text-center mb-4",
						children: "Sua opinião nos ajuda a melhorar!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center gap-2 mb-4",
						children: [
							1,
							2,
							3,
							4,
							5
						].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFeedbackNota(n),
							className: `text-2xl transition-transform hover:scale-125 ${n <= feedbackNota ? "text-yellow-400" : "text-gray-300"}`,
							children: "★"
						}, n))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						placeholder: "Deixe um comentário (opcional)...",
						value: feedbackComentario,
						onChange: (e) => setFeedbackComentario(e.target.value),
						className: "w-full border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: async () => {
								try {
									await supabase.from("avaliacoes").insert([{
										pedido_id: orderId,
										user_id: session?.user?.id || null,
										nota: feedbackNota,
										comentario: feedbackComentario || null
									}]);
									setFeedbackEnviado(true);
									toast.success("Obrigado pelo feedback!");
								} catch (e) {
									setFeedbackEnviado(true);
								}
							},
							disabled: feedbackNota === 0,
							className: "flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed",
							children: "Enviar Feedback"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFeedbackEnviado(true),
							className: "px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground",
							children: "Pular"
						})]
					})
				]
			}),
			feedbackEnviado && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-green-600 font-medium",
				children: "Obrigado pelo seu feedback!"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground",
				children: "Continuar comprando"
			})
		]
	});
	if (lines.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-xl px-4 py-24 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-extrabold",
				children: "Checkout"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: "Você ainda não escolheu nenhuma marmita."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => navigate({ to: "/" }),
				className: "mt-8 inline-flex rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground",
				children: "Ver catálogo"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-6xl px-4 py-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-extrabold",
				children: "Checkout"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: "Preencha os dados de entrega e escolha a forma de pagamento."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit(onSubmit),
					noValidate: true,
					className: "space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "text-sm font-semibold uppercase tracking-widest text-muted-foreground",
									children: "Seus dados"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "nome",
										className: "text-sm font-medium",
										children: "Nome completo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "nome",
										className: fieldClass,
										...register("nome")
									}),
									errors.nome && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-destructive",
										children: errors.nome.message
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "email",
											className: "text-sm font-medium",
											children: "E-mail"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "email",
											type: "email",
											className: fieldClass,
											...register("email")
										}),
										errors.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-destructive",
											children: errors.email.message
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "telefone",
											className: "text-sm font-medium",
											children: "Telefone / WhatsApp"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "telefone",
											className: fieldClass,
											...register("telefone")
										}),
										errors.telefone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-destructive",
											children: errors.telefone.message
										})
									] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "text-sm font-semibold uppercase tracking-widest text-muted-foreground",
									children: "Entrega"
								}),
								addresses.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm font-medium flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
										size: 14,
										className: "text-primary"
									}), "Meus endereços salvos"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mt-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: cn(fieldClass, "pr-8 mt-0"),
										value: selectedAddressId,
										onChange: (e) => handleAddressSelect(e.target.value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Selecione um endereço salvo..."
										}), addresses.map((addr) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: addr.id,
											children: [
												addr.label ? `${addr.label} — ` : "",
												addr.rua,
												", ",
												addr.numero,
												" — ",
												addr.bairro,
												", ",
												addr.cidade,
												addr.is_default ? " ★" : ""
											]
										}, addr.id))]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
										size: 14,
										className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
									})]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "cidade",
										className: "text-sm font-medium",
										children: "Cidade"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										id: "cidade",
										className: fieldClass,
										...register("cidade"),
										onChange: (e) => {
											setValue("cidade", e.target.value);
											setSelectedCity(e.target.value);
											setSelectedBairro("");
											setSelectedAddressId("");
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Selecione..."
										}), [...new Set(taxas.map((t) => t.cidade))].sort().map((city) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: city,
											children: city
										}, city))]
									}),
									errors.cidade && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-destructive",
										children: errors.cidade.message
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "bairro",
										className: "text-sm font-medium",
										children: "Bairro"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										id: "bairro",
										className: cn(fieldClass, !selectedCity && "opacity-50"),
										disabled: !selectedCity,
										value: selectedBairro,
										onChange: (e) => {
											setSelectedBairro(e.target.value);
											setSelectedAddressId("");
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Selecione..."
										}), taxas.filter((t) => t.cidade === selectedCity).sort((a, b) => a.bairro.localeCompare(b.bairro)).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: t.bairro,
											children: t.bairro
										}, t.id))]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "cep",
										className: "text-sm font-medium",
										children: "CEP (opcional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "cep",
										placeholder: "00000-000",
										className: fieldClass,
										...register("cep")
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "endereco",
										className: "text-sm font-medium",
										children: "Endereço e número"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "endereco",
										className: fieldClass,
										...register("endereco")
									}),
									errors.endereco && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-destructive",
										children: errors.endereco.message
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									htmlFor: "complemento",
									className: "text-sm font-medium",
									children: "Complemento (opcional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "complemento",
									className: fieldClass,
									...register("complemento")
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "text-sm font-semibold uppercase tracking-widest text-muted-foreground",
									children: "Pagamento"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "hidden",
									...register("pagamento")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-3 sm:grid-cols-5",
									children: PAYMENT_OPTIONS.map((opt) => {
										const isSelected = selectedPayment === opt.value;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => handlePaymentSelect(opt.value),
											"aria-pressed": isSelected,
											className: cn("flex flex-col items-center gap-1 rounded-2xl border p-4 text-center transition-colors", isSelected ? "border-primary bg-secondary font-semibold" : "border-border hover:border-primary"),
											children: [
												opt.icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: opt.icon,
													alt: opt.label,
													className: "size-7 object-contain",
													"aria-hidden": "true"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-2xl",
													"aria-hidden": "true",
													children: "💳"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-semibold leading-tight",
													children: opt.label
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs text-muted-foreground",
													children: opt.sublabel
												})
											]
										}, opt.value);
									})
								}),
								(selectedPayment === "pix" || selectedPayment === "mercadopago") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
										className: "mt-0.5 size-5 shrink-0 text-green-600",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Após confirmar o pedido, enviaremos o",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: selectedPayment === "pix" ? "código PIX" : "link de pagamento" }),
										" ",
										"via ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "WhatsApp" }),
										". Mantenha o aplicativo aberto para receber. 📲"
									] })]
								}),
								selectedPayment === "cartao" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-border bg-muted/40 p-4 space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold",
											children: "💳 Selecione a bandeira do cartão"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-wrap gap-2",
											children: cardFlags.map((flag) => {
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => setSelectedFlag(flag.name ?? ""),
													className: cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all", selectedFlag === flag.name ? "border-primary bg-primary/10 font-semibold shadow-sm" : "border-border bg-background hover:border-primary"),
													children: [flag.logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: flag.logo,
														alt: flag.name,
														className: "h-5 w-8 object-contain"
													}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs",
														children: flag.name
													})]
												}, flag.name);
											})
										}),
										!selectedFlag && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Selecione a bandeira para continuar"
										})
									]
								}),
								selectedPayment === "alimentacao" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-border bg-muted/40 p-4 space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold",
											children: "🍴 Selecione o cartão de benefício"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-wrap gap-2",
											children: mealFlags.map((flag) => {
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => setSelectedFlag(flag.name ?? ""),
													className: cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all", selectedFlag === flag.name ? "border-primary bg-primary/10 font-semibold shadow-sm" : "border-border bg-background hover:border-primary"),
													children: [flag.logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: flag.logo,
														alt: flag.name,
														className: "h-5 w-8 object-contain"
													}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs",
														children: flag.name
													})]
												}, flag.name);
											})
										}),
										!selectedFlag && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: "Selecione o cartão para continuar"
										})
									]
								}),
								selectedPayment === "dinheiro" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-border bg-muted/40 p-4 space-y-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold",
											children: "💵 Troco"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											htmlFor: "troco",
											className: "text-sm text-muted-foreground",
											children: "Precisa de troco? Informe o valor que vai pagar (opcional)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "troco",
											type: "number",
											min: "0",
											step: "0.01",
											placeholder: "Ex: 50,00",
											className: fieldClass,
											...register("troco")
										}),
										errors.troco && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-destructive",
											children: errors.troco.message
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-sm font-medium",
								children: "Cupom de desconto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1.5 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: couponInput,
									onChange: (e) => {
										setCouponInput(e.target.value.toUpperCase());
										setCouponError("");
										setAppliedCoupon(null);
									},
									onKeyDown: (e) => e.key === "Enter" && (e.preventDefault(), applyCoupon(couponInput)),
									placeholder: "Digite seu cupom",
									className: cn(fieldClass, "flex-1 mt-0 uppercase tracking-widest font-bold", appliedCoupon ? "border-green-400 bg-green-50" : ""),
									disabled: !!appliedCoupon
								}), appliedCoupon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setAppliedCoupon(null);
										setCouponInput("");
									},
									className: "rounded-2xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors",
									children: "Remover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => applyCoupon(couponInput),
									disabled: couponLoading || !couponInput.trim(),
									className: "rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-brand-dark transition-colors disabled:opacity-50",
									children: couponLoading ? "..." : "Aplicar"
								})]
							}),
							couponError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-destructive",
								children: couponError
							}),
							appliedCoupon && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-green-600 font-semibold",
								children: [
									"✓ Cupom ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: appliedCoupon.codigo }),
									" aplicado —",
									" ",
									appliedCoupon.tipo === "Percentual" ? `${appliedCoupon.valor}% de desconto` : appliedCoupon.tipo === "Entrega Grátis" ? "frete grátis" : `R$ ${appliedCoupon.valor.toFixed(2)} de desconto`
								]
							})
						] }),
						session && cashbackSaldo > 0 && cashbackConfig?.ativo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("rounded-2xl border p-4 space-y-2 transition-all", cashbackAtivado ? "border-yellow-400 bg-yellow-50" : "border-border bg-muted/30"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, {
											size: 15,
											className: "text-yellow-600"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-semibold",
											children: [
												"Cashback disponível:",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-yellow-700",
													children: formatBRL(cashbackSaldo)
												})
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setCashbackAtivado(!cashbackAtivado),
										className: cn("text-xs font-bold px-3 py-1.5 rounded-full transition-all", cashbackAtivado ? "bg-yellow-500 text-white" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"),
										children: cashbackAtivado ? "✓ Usando" : "Usar"
									})]
								}),
								cashbackAtivado && cashbackDesconto > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-yellow-700",
									children: [
										"Desconto de ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatBRL(cashbackDesconto) }),
										" aplicado."
									]
								}),
								cashbackSaldo < (cashbackConfig?.minimo_uso ?? 5) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: ["Saldo mínimo para usar: ", formatBRL(cashbackConfig?.minimo_uso ?? 5)]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "observacoes",
							className: "text-sm font-medium",
							children: "Observações (opcional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							id: "observacoes",
							rows: 3,
							className: fieldClass,
							...register("observacoes")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: isSubmitting,
							className: "w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-dark disabled:opacity-60",
							children: isSubmitting ? "Registrando pedido..." : session ? `Confirmar pedido • ${formatBRL(finalTotal)}` : `Entrar para confirmar • ${formatBRL(finalTotal)}`
						}),
						!session && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-center text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowAuthModal(true),
									className: "text-primary font-semibold hover:underline",
									children: "Fazer login ou criar conta"
								}),
								" ",
								"para finalizar o pedido e acompanhar suas entregas."
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "h-fit rounded-3xl border border-border bg-card p-6 shadow-soft",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: "Seu pedido"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-3 text-sm",
							children: lines.map(({ product, quantity, subtotal: lineTotal }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										quantity,
										"× ",
										product.nome
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: formatBRL(lineTotal)
								})]
							}, product.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-5 space-y-2 border-t border-border pt-4 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "Subtotal"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatBRL(subtotal) })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-muted-foreground",
										children: "Entrega"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: appliedCoupon?.tipo === "Entrega Grátis" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-green-600 font-semibold",
										children: "Grátis"
									}) : shipping === 0 ? "Grátis" : formatBRL(shipping) })]
								}),
								couponDiscount > 0 && appliedCoupon?.tipo !== "Entrega Grátis" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-green-600",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
										className: "font-semibold flex items-center gap-1",
										children: ["🎟️ Cupom ", appliedCoupon?.codigo]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["− ", formatBRL(couponDiscount)] })]
								}),
								cashbackDesconto > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-yellow-600",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
										className: "font-semibold flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { size: 12 }), " Cashback"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["− ", formatBRL(cashbackDesconto)] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between border-t border-border pt-2 text-base",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "font-semibold",
										children: "Total"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "font-bold text-primary",
										children: formatBRL(finalTotal)
									})]
								})
							]
						})
					]
				})]
			}),
			showAuthModal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[9999] flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
					onClick: () => setShowAuthModal(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-primary px-6 py-5 text-white",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowAuthModal(false),
								className: "absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-black",
								children: authMode === "login" ? "Entre na sua conta" : "Crie sua conta"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-white/75 mt-0.5",
								children: authMode === "login" ? "Seu carrinho foi salvo. Faça login para finalizar." : "Crie uma conta para acompanhar seus pedidos."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleAuth,
						className: "p-6 space-y-4",
						children: [
							authMode === "register" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Nome completo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: authNome,
								onChange: (e) => setAuthNome(e.target.value),
								required: true,
								placeholder: "Seu nome",
								className: "w-full rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Telefone / WhatsApp"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: authTelefone,
								onChange: (e) => setAuthTelefone(e.target.value),
								placeholder: "(47) 99999-9999",
								className: "w-full rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
							})] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "E-mail"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								value: authEmail,
								onChange: (e) => setAuthEmail(e.target.value),
								required: true,
								placeholder: "seu@email.com",
								className: "w-full rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-bold uppercase text-gray-400 mb-1 block",
								children: "Senha"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								value: authPassword,
								onChange: (e) => setAuthPassword(e.target.value),
								required: true,
								placeholder: "••••••••",
								className: "w-full rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: authLoading,
								className: "w-full rounded-full bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2",
								children: authLoading ? "Aguarde..." : authMode === "login" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { size: 16 }), " Entrar e finalizar pedido"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { size: 16 }), " Criar conta e finalizar"] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAuthMode(authMode === "login" ? "register" : "login"),
								className: "w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1",
								children: authMode === "login" ? "Não tem conta? Criar agora" : "Já tenho conta. Fazer login"
							})
						]
					})]
				})]
			})
		]
	});
}
//#endregion
export { Checkout as component };
