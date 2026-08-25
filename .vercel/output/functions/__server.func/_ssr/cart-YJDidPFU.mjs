import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as ShoppingBag, At as Copy, Jt as Check, S as Tag, i as X, in as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BVZilnxn.mjs";
import { n as getPublicProducts } from "./products.functions-CPJ8Fofb.mjs";
import { n as calcularDescontoProgressivo, r as calcularFrete } from "./combo-rules-DW0a8AzE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cart-YJDidPFU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var getTaxas = createServerFn({ method: "GET" }).handler(createSsrRpc("d3b616e51af2c7d22b44d4ae98dc1b1c3625d438d7f21a23c2cf19e2721b3a31"));
function getSessionId() {
	const key = "saborosamente.session_id";
	let id = typeof window !== "undefined" ? localStorage.getItem(key) : null;
	if (!id) {
		id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
		if (typeof window !== "undefined") localStorage.setItem(key, id);
	}
	return id;
}
function generateAbandonCoupon() {
	const key = "saborosamente.abandon_coupon";
	const existing = typeof window !== "undefined" ? localStorage.getItem(key) : null;
	if (existing) return existing;
	const coupon = `VOLTA${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
	if (typeof window !== "undefined") localStorage.setItem(key, coupon);
	return coupon;
}
function useAbandonedCart({ lines, total, onExitIntent }) {
	const sessionId = (0, import_react.useRef)(getSessionId());
	const dbIdRef = (0, import_react.useRef)(null);
	const couponRef = (0, import_react.useRef)(null);
	const exitFiredRef = (0, import_react.useRef)(false);
	const saveTimeoutRef = (0, import_react.useRef)(null);
	const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
	const hasCart = lines.length > 0 && !isAdmin;
	const saveToDb = (0, import_react.useCallback)(async (origem = "timeout") => {
		if (!hasCart) return;
		try {
			const { data: { session } } = await supabase.auth.getSession();
			const user = session?.user ?? null;
			const itens = lines.map((l) => ({
				productId: l.productId,
				quantity: l.quantity,
				weight: l.weight,
				nome: l.product?.nome ?? l.productId,
				preco: l.product?.preco ?? 0,
				subtotal: l.subtotal ?? 0,
				imagem: l.product?.imagem_url ?? ""
			}));
			const payload = {
				session_id: sessionId.current,
				user_id: user?.id ?? null,
				email: user?.email ?? null,
				itens,
				valor_total: total,
				status: "abandonado",
				origem,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			};
			if (dbIdRef.current) await supabase.from("carrinhos_abandonados").update(payload).eq("id", dbIdRef.current);
			else {
				const { data } = await supabase.from("carrinhos_abandonados").insert(payload).select("id").single();
				if (data?.id) dbIdRef.current = data.id;
			}
		} catch (err) {
			console.warn("[AbandonedCart] erro ao salvar:", err);
		}
	}, [
		lines,
		total,
		hasCart
	]);
	const markConverted = (0, import_react.useCallback)(async () => {
		if (!dbIdRef.current) return;
		try {
			await supabase.from("carrinhos_abandonados").update({
				status: "convertido",
				convertido_em: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", dbIdRef.current);
			dbIdRef.current = null;
			exitFiredRef.current = false;
			if (typeof window !== "undefined") localStorage.removeItem("saborosamente.abandon_coupon");
		} catch {}
	}, []);
	const saveCoupon = (0, import_react.useCallback)(async (cupom, discountPercent = 5) => {
		try {
			await supabase.from("cupons").insert({
				codigo: cupom,
				tipo: "Percentual",
				valor: discountPercent,
				regra: "Cupom de carrinho abandonado — uso único",
				ativo: true,
				uso: 0,
				max_uso: 1
			});
		} catch {}
		if (!dbIdRef.current) return;
		try {
			await supabase.from("carrinhos_abandonados").update({
				cupom_oferta: cupom,
				origem: "exit_intent"
			}).eq("id", dbIdRef.current);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hasCart) return;
		if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
		saveTimeoutRef.current = setTimeout(() => {
			saveToDb("timeout");
		}, 180 * 1e3);
		return () => {
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
		};
	}, [
		lines,
		total,
		hasCart,
		saveToDb
	]);
	(0, import_react.useEffect)(() => {
		if (!hasCart) return;
		const handleMouseLeave = async (e) => {
			if (e.clientY > 5) return;
			if (exitFiredRef.current) return;
			exitFiredRef.current = true;
			const coupon = generateAbandonCoupon();
			couponRef.current = coupon;
			let discountPercent = 5;
			try {
				const { data } = await supabase.from("site_settings").select("exit_intent_discount").maybeSingle();
				if (data?.exit_intent_discount) discountPercent = Number(data.exit_intent_discount);
			} catch {}
			await saveToDb("exit_intent");
			await saveCoupon(coupon, discountPercent);
			onExitIntent(coupon, discountPercent);
		};
		document.addEventListener("mouseleave", handleMouseLeave);
		return () => document.removeEventListener("mouseleave", handleMouseLeave);
	}, [
		hasCart,
		saveToDb,
		saveCoupon,
		onExitIntent
	]);
	(0, import_react.useEffect)(() => {
		if (!hasCart) return;
		const handleUnload = () => {
			const payload = JSON.stringify({
				session_id: sessionId.current,
				itens: lines.map((l) => ({
					productId: l.productId,
					quantity: l.quantity
				})),
				valor_total: total,
				status: "abandonado",
				origem: "timeout",
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			});
			navigator.sendBeacon?.("/api/abandoned-cart", payload);
		};
		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [
		hasCart,
		lines,
		total
	]);
	return { markConverted };
}
function formatBRL(value) {
	return value.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL"
	});
}
function ExitIntentModal({ isOpen, onClose, coupon, cartTotal, cartCount, discountPercent, onApplyCoupon }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [visible, setVisible] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (isOpen) {
			const t = setTimeout(() => setVisible(true), 30);
			return () => clearTimeout(t);
		} else setVisible(false);
	}, [isOpen]);
	const handleCopy = () => {
		navigator.clipboard.writeText(coupon).catch(() => {});
		setCopied(true);
		setTimeout(() => setCopied(false), 2e3);
	};
	const handleApply = () => {
		onApplyCoupon(coupon);
		onClose();
		navigate({
			to: "/checkout",
			search: { cupom: coupon }
		});
	};
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-300", visible ? "opacity-100" : "opacity-0"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-all duration-300", visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#086e45] px-6 pt-8 pb-6 text-white text-center relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors",
						"aria-label": "Fechar",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
							size: 32,
							className: "text-white"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-black leading-tight mb-1",
						children: "Espera! Não vá embora."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-white/80 leading-relaxed",
						children: [
							"Você tem",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
								className: "text-white",
								children: [
									cartCount,
									" ",
									cartCount === 1 ? "item" : "itens"
								]
							}),
							" ",
							"(",
							formatBRL(cartTotal),
							") esperando no seu carrinho."
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white px-6 py-6 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl bg-[#086e45]/5 border border-[#086e45]/10 p-4 text-center space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase tracking-widest text-[#086e45]/60",
								children: "Oferta exclusiva para você"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-lg font-black text-gray-900",
								children: [discountPercent, "% de desconto na sua compra"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-gray-500",
								children: "Use o cupom abaixo antes de finalizar o pedido"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 flex items-center gap-3 rounded-xl border-2 border-dashed border-[#086e45]/40 bg-[#086e45]/5 px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
								size: 16,
								className: "text-[#086e45] shrink-0"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-black text-lg tracking-widest text-[#086e45]",
								children: coupon
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleCopy,
							className: cn("h-12 w-12 rounded-xl flex items-center justify-center transition-all shrink-0", copied ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"),
							title: "Copiar cupom",
							children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 18 })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleApply,
						className: "w-full flex items-center justify-center gap-2 rounded-2xl bg-[#086e45] px-6 py-4 text-sm font-bold text-white hover:bg-[#065a38] transition-colors",
						children: ["Aplicar desconto e finalizar", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 16 })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1",
						children: "Não, obrigado. Vou sair sem o desconto."
					})
				]
			})]
		})]
	});
}
var cachedProducts = [];
var STORAGE_KEY = "saborosamente.cart.v1";
var FREE_SHIPPING_FROM = 999999;
var SHIPPING_FEE = 14.9;
var RULES = {
	MIN_ORDER_AMOUNT: 70,
	MIN_ORDER_QUANTITY: 5,
	SBS_DISCOUNTED_SHIPPING: 5,
	PROGRESSIVE_DISCOUNT: [
		{
			min: 5,
			discount: .03
		},
		{
			min: 10,
			discount: .05
		},
		{
			min: 20,
			discount: .07
		}
	]
};
var CartContext = (0, import_react.createContext)(null);
function readStorage() {
	try {
		const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((l) => typeof l === "object" && l !== null && typeof l.productId === "string" && typeof l.quantity === "number").filter((l) => l.quantity > 0);
	} catch {
		return [];
	}
}
function CartProvider({ children }) {
	const [lines, setLines] = (0, import_react.useState)([]);
	const [selectedCity, setSelectedCity] = (0, import_react.useState)("");
	const [selectedBairro, setSelectedBairro] = (0, import_react.useState)("");
	const [exitIntentCoupon, setExitIntentCoupon] = (0, import_react.useState)(null);
	const [exitModalOpen, setExitModalOpen] = (0, import_react.useState)(false);
	const [exitDiscountPercent, setExitDiscountPercent] = (0, import_react.useState)(5);
	(0, import_react.useEffect)(() => {
		const stored = readStorage();
		if (stored.length > 0) setLines(stored);
	}, []);
	const MOCK_TAXAS = (0, import_react.useMemo)(() => {
		const dataMap = {
			"São Bento do Sul": [
				{
					neighborhood: "Centro",
					rate: 8.9
				},
				{
					neighborhood: "Progresso",
					rate: 8.9
				},
				{
					neighborhood: "25 de Julho",
					rate: 10.5
				},
				{
					neighborhood: "Alpino",
					rate: 17
				},
				{
					neighborhood: "Boehmerwald",
					rate: 10.5
				},
				{
					neighborhood: "Brasília",
					rate: 12
				},
				{
					neighborhood: "Centenário",
					rate: 10.5
				},
				{
					neighborhood: "Colonial",
					rate: 10.5
				},
				{
					neighborhood: "Cruzeiro",
					rate: 10.5
				},
				{
					neighborhood: "Industrial Sudoeste",
					rate: 11
				},
				{
					neighborhood: "Loteamento Itália",
					rate: 9.5
				},
				{
					neighborhood: "Mato Preto",
					rate: 12
				},
				{
					neighborhood: "Oxford",
					rate: 11
				},
				{
					neighborhood: "Parque Mariani",
					rate: 9.5
				},
				{
					neighborhood: "Residencial Santa Fé",
					rate: 12.5
				},
				{
					neighborhood: "Rio Negro",
					rate: 10
				},
				{
					neighborhood: "Schramm",
					rate: 9
				},
				{
					neighborhood: "Serra Alta",
					rate: 13
				},
				{
					neighborhood: "Dona Francisca",
					rate: 15
				},
				{
					neighborhood: "Bela Aliança",
					rate: 10
				},
				{
					neighborhood: "Campo do Meio",
					rate: 10
				},
				{
					neighborhood: "Castelo Branco",
					rate: 10
				},
				{
					neighborhood: "Estrada das Neves",
					rate: 10
				},
				{
					neighborhood: "Estrada dos Bugres",
					rate: 10
				},
				{
					neighborhood: "Lençol",
					rate: 10
				},
				{
					neighborhood: "Rio Natal",
					rate: 10
				},
				{
					neighborhood: "Rio Represo",
					rate: 10
				},
				{
					neighborhood: "Rio Vermelho Estação",
					rate: 10
				},
				{
					neighborhood: "Rio Vermelho Povoado",
					rate: 10
				},
				{
					neighborhood: "Sertãozinho",
					rate: 10
				}
			],
			"Rio Negrinho": [
				"Ceramarte",
				"Alegre",
				"Bairro Preto",
				"Barro Preto",
				"Bela Vista",
				"Campo Lençol",
				"Centro",
				"Colônia Olsen",
				"Cruzeiro",
				"Industrial Norte",
				"Industrial Sul",
				"Jardim Hantschel",
				"Pinheirinho",
				"Quitandinha",
				"Rio Casa de Pedra",
				"Rio Preto",
				"Rio dos Bugres",
				"Serro Azul",
				"São Pedro",
				"São Rafael",
				"Vila Nova",
				"Vista Alegre",
				"Volta Grande"
			],
			"Campo Alegre": [
				"Avenquinha",
				"Bateias de Baixo",
				"Bateias de Cima",
				"Belo Horizonte",
				"Cascata",
				"Cascatas",
				"Centro",
				"Corredeiras",
				"Fragosos",
				"Lajeado",
				"Mato Limpo",
				"Pinhais",
				"Povoado de Fragosos",
				"Ribeirão do Meio",
				"Rio Represo",
				"Rio do Bugre",
				"Saltinho",
				"Santo Antônio",
				"São Miguel",
				"Vila Novo Mundo"
			],
			Corupá: [
				"Ano Bom",
				"Bomplandt",
				"Caminho Pequeno",
				"Centro",
				"Faxinal",
				"Itapocu",
				"Izabel",
				"João Tozini",
				"Pedra de Amolar",
				"Poço D'Anta",
				"Putinga",
				"Rio Correa",
				"Rio Feio",
				"Rio Novo",
				"Rio Paulo",
				"Rio da Veada",
				"Seminário",
				"XV de Novembro"
			],
			Mafra: [
				"Augusta Vitória",
				"Autódromo",
				"Avencal São Sebastião",
				"Avencal de Cima",
				"Avencal do Meio",
				"Bairro do Autódromo",
				"Bela Vista do Sul",
				"Bituvinha",
				"Butiá dos Tabordas",
				"Campina Konkel",
				"Campo da Lança",
				"Caçador",
				"Centro I - Baixada",
				"Centro II - Alto de Mafra",
				"Centro III Monte Alegre",
				"Espigão do Bugre",
				"Faxinal",
				"Fazenda Potreiro",
				"General Brito",
				"Imbuial",
				"Jardim América",
				"Jardim Novo Horizonte",
				"Jardim do Moinho",
				"Maurício Caillet",
				"Nossa Senhora Aparecida",
				"Passo",
				"Restinga",
				"Rio Preto",
				"Rio da Areia",
				"Rio da Areia de Baixo",
				"Rio da Areia de Cima",
				"Rio do Cedro",
				"Saltinho do Canivete",
				"São Lourenço",
				"Vila Argentina",
				"Vila Buenos Aires",
				"Vila Clementina",
				"Vila Edson Luis",
				"Vila Ferroviária",
				"Vila Formosa",
				"Vila Industrial",
				"Vila Ivete",
				"Vila Nova",
				"Vila Ruthes",
				"Vila Solidariedade",
				"Vila Velha",
				"Vila das Flores",
				"Vilinha",
				"Vista Alegre"
			],
			Piên: [
				"Aterrado Alto",
				"Avencal",
				"Boa Vista",
				"Cachoeirinha",
				"Campina dos Crespins",
				"Campina dos Maia",
				"Campo Novo",
				"Centro",
				"Cerro Verde",
				"Gramados",
				"Lageado",
				"Letreiro",
				"Mosquito",
				"Palmito",
				"Palmito de Cima",
				"Picacinho",
				"Pocinho",
				"Poço Frio",
				"Poço Frio dos Moreiras",
				"Quicé",
				"Trigolândia",
				"Vermelhinho"
			],
			"Rio Negro": [
				"Bairro Alto",
				"Bairro do Seminário",
				"Bom Jesus",
				"Bom Jesus do Rio Negro",
				"Campina dos Andrades",
				"Campo do Gado",
				"Centro",
				"Estação Nova",
				"Fazendinha",
				"Jardim Zelinda",
				"Lageado dos Vieiras",
				"Maitaca",
				"Passa Três",
				"Passo do Valo",
				"Retiro",
				"Roseira",
				"Seminário",
				"Sítio dos Rauen",
				"Tijuco Preto",
				"Vila Militar",
				"Vila Paraná",
				"Vila Paraíso",
				"Volta Grande"
			]
		};
		const flat = [];
		let id = 1e3;
		Object.entries(dataMap).forEach(([city, neighborhoods]) => {
			neighborhoods.forEach((n) => {
				const name = typeof n === "string" ? n : n.neighborhood;
				const rate = typeof n === "string" ? 10 : n.rate;
				flat.push({
					id: id++,
					bairro: name,
					taxa: rate,
					cidade: city,
					ativo: true
				});
			});
		});
		return flat;
	}, []);
	const { data: serverTaxas } = useQuery({
		queryKey: ["taxas"],
		queryFn: () => getTaxas()
	});
	const taxas = serverTaxas || MOCK_TAXAS;
	const { data: serverProducts = [] } = useQuery({
		queryKey: ["public-products-cart"],
		queryFn: () => getPublicProducts(),
		staleTime: 1e3 * 60 * 5
	});
	(0, import_react.useEffect)(() => {
		if (serverProducts.length > 0) {
			cachedProducts = serverProducts.map((p) => ({
				...p,
				categoria: p.categorias?.nome || "Marmita",
				imagem: p.imagem_url
			}));
			setLines((prev) => [...prev]);
		}
	}, [serverProducts]);
	(0, import_react.useEffect)(() => {
		try {
			if (typeof window !== "undefined") {
				const stored = readStorage();
				if (!(lines.length === 0 && stored.length > 0)) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
			}
		} catch {}
	}, [lines]);
	(0, import_react.useCallback)((id) => {
		return cachedProducts.find((p) => p.id === id);
	}, []);
	const add = (0, import_react.useCallback)((productId, quantity = 1, weight) => {
		setLines((prev) => {
			if (prev.find((l) => l.productId === productId && l.weight === weight)) return prev.map((l) => l.productId === productId && l.weight === weight ? {
				...l,
				quantity: l.quantity + quantity
			} : l);
			return [...prev, {
				productId,
				quantity,
				weight
			}];
		});
	}, []);
	const setQuantity = (0, import_react.useCallback)((productId, quantity, weight) => {
		setLines((prev) => quantity <= 0 ? prev.filter((l) => !(l.productId === productId && l.weight === weight)) : prev.map((l) => l.productId === productId && l.weight === weight ? {
			...l,
			quantity
		} : l));
	}, []);
	const remove = (0, import_react.useCallback)((productId, weight) => {
		setLines((prev) => prev.filter((l) => !(l.productId === productId && l.weight === weight)));
	}, []);
	const clear = (0, import_react.useCallback)(() => setLines([]), []);
	const detailedForHook = (0, import_react.useMemo)(() => lines.flatMap((line) => {
		const product = cachedProducts.find((p) => p.id === line.productId);
		if (!product) return [];
		const price = line.weight === "300g" && product.preco_300g ? product.preco_300g : line.weight === "400g" && product.preco_400g ? product.preco_400g : product.preco;
		return [{
			...line,
			product,
			subtotal: price * line.quantity
		}];
	}), [lines]);
	const { markConverted } = useAbandonedCart({
		lines: detailedForHook,
		total: (0, import_react.useMemo)(() => detailedForHook.reduce((s, l) => s + l.subtotal, 0), [detailedForHook]),
		onExitIntent: (coupon, discountPercent) => {
			setExitIntentCoupon(coupon);
			setExitDiscountPercent(discountPercent);
			setExitModalOpen(true);
		}
	});
	const value = (0, import_react.useMemo)(() => {
		const detailed = lines.flatMap((line) => {
			const product = cachedProducts.find((p) => p.id === line.productId);
			if (!product) return [];
			const price = product.categoria?.toLowerCase().includes("sopa") ? 18 : line.weight === "300g" && product.preco_300g ? product.preco_300g : line.weight === "400g" && product.preco_400g ? product.preco_400g : product.preco;
			return [{
				...line,
				product,
				subtotal: price * line.quantity
			}];
		});
		const subtotal = detailed.reduce((acc, l) => acc + l.subtotal, 0);
		const count = detailed.reduce((acc, l) => acc + l.quantity, 0);
		let taxaBase = SHIPPING_FEE;
		if (selectedBairro) {
			const taxaItem = taxas.find((t) => t.bairro === selectedBairro && t.cidade === selectedCity);
			if (taxaItem) taxaBase = taxaItem.taxa;
		}
		const shipping = calcularFrete({
			subtotal,
			totalUnidades: count,
			taxaBase,
			cidade: selectedCity,
			freteGratisAPartirDe: FREE_SHIPPING_FROM,
			minQuantidadeSBS: RULES.MIN_ORDER_QUANTITY,
			fretePromoSBS: RULES.SBS_DISCOUNTED_SHIPPING
		});
		const discount = calcularDescontoProgressivo(detailed.map((l) => ({
			categoria: l.product.categoria ?? "",
			subtotal: l.subtotal,
			quantidade: l.quantity
		})));
		return {
			lines: detailed,
			count,
			subtotal,
			discount,
			shipping,
			total: subtotal - discount + shipping,
			selectedCity,
			selectedBairro,
			taxas,
			setSelectedCity,
			setSelectedBairro,
			add,
			setQuantity,
			remove,
			clear
		};
	}, [
		lines,
		serverProducts,
		selectedCity,
		selectedBairro,
		add,
		setQuantity,
		remove,
		clear
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartContext.Provider, {
		value: {
			...value,
			exitIntentCoupon,
			markConverted
		},
		children
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExitIntentModal, {
		isOpen: exitModalOpen,
		onClose: () => setExitModalOpen(false),
		coupon: exitIntentCoupon ?? "",
		cartTotal: value.total,
		cartCount: value.count,
		discountPercent: exitDiscountPercent,
		onApplyCoupon: (coupon) => {
			setExitIntentCoupon(coupon);
			setExitModalOpen(false);
		}
	})] });
}
function useCart() {
	const ctx = (0, import_react.useContext)(CartContext);
	if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
	return ctx;
}
//#endregion
export { useCart as i, RULES as n, formatBRL as r, CartProvider as t };
