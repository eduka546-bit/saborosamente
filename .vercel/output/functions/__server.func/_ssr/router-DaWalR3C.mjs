import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime, d as DialogContent, f as DialogDescription, g as DialogTrigger, h as DialogTitle, l as Dialog, m as DialogPortal, p as DialogOverlay, u as DialogClose } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { A as ShoppingBag, E as Sparkles, H as Plus, Kt as ChevronDown, Lt as CircleDollarSign, N as Settings, Nt as ClipboardList, Q as MessageSquare, Wt as ChevronRight, Z as Minus, Zt as ChartColumn, at as LogOut, c as Users, et as Menu, gt as Gift, h as TrendingUp, i as X, j as ShieldCheck, jt as Clock, k as ShoppingCart, l as User, lt as Leaf, o as Utensils, rt as MapPin, st as Lock, x as Ticket } from "../_libs/lucide-react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { c as HeadContent, d as Outlet, f as lazyRouteComponent, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as DialogTitle$1, c as DropdownMenuItem, i as DialogHeader, l as DropdownMenuSeparator, n as DialogContent$1, o as DropdownMenu, s as DropdownMenuContent, t as Dialog$1, u as DropdownMenuTrigger } from "./dropdown-menu-BcaY44CS.mjs";
import { t as Route$61 } from "./auth-U_Md0jE_.mjs";
import { i as useCart, n as RULES, r as formatBRL, t as CartProvider } from "./cart-B26u01-I.mjs";
import { i as enabledOrDefault, n as defaultMealFlags, r as defaultPaymentMethods, t as defaultCardFlags } from "./payment-options-bcTVjPID.mjs";
import { a as stringType, i as objectType, n as enumType, o as ZodIssueCode } from "../_libs/zod.mjs";
import { t as Route$62 } from "./pedido-D3ThksIl.mjs";
import { t as Route$63 } from "./perfil-BwjAprQU.mjs";
import { t as Route$64 } from "./produto._id-COVETLmU.mjs";
import { t as DiscountProgressWidget } from "./discount-progress-widget-D4-Hcs0q.mjs";
import { a as Viewport, i as ScrollAreaThumb, n as Root, r as ScrollAreaScrollbar, t as Corner } from "../_libs/radix-ui__react-scroll-area.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DaWalR3C.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-DoAY69YF.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	window.__lovableReportRuntimeError?.({
		message,
		stack: error instanceof Error ? error.stack : void 0,
		filename: window.location.pathname
	});
}
var ScrollArea = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root, {
	ref,
	className: cn("relative overflow-hidden", className),
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewport, {
			className: "h-full w-full rounded-[inherit]",
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollBar, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Corner, {})
	]
}));
ScrollArea.displayName = Root.displayName;
var ScrollBar = import_react.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollAreaScrollbar, {
	ref,
	orientation,
	className: cn("flex touch-none select-none transition-colors", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
}));
ScrollBar.displayName = ScrollAreaScrollbar.displayName;
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetClose = DialogClose;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
function CartSheet({ children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const { lines, subtotal, discount, shipping, total, setQuantity, remove, clear } = useCart();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
			asChild: true,
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			className: "w-full sm:max-w-md flex flex-col p-0 gap-0 rounded-l-[2rem] border-l-0 shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, {
					className: "p-6 border-b bg-white rounded-tl-[2rem]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-between",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetTitle, {
							className: "text-xl font-black text-primary flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { size: 20 }), "Seu Carrinho"]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50",
					children: lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "h-full flex flex-col items-center justify-center text-center space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { size: 40 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-gray-500 font-medium",
								children: "Seu carrinho está vazio"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetClose, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "rounded-full",
									children: "Continuar comprando"
								})
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-4",
							children: lines.map(({ product, quantity, weight, subtotal: lineTotal }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: product.imagem,
										alt: product.nome,
										className: "size-16 rounded-xl object-cover shrink-0"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-xs font-bold text-primary-dark truncate",
												children: product.nome
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-gray-400 font-bold uppercase mt-0.5",
												children: weight || product.peso
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-2 flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 p-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: () => setQuantity(product.id, quantity - 1, weight),
															className: "size-6 rounded-full hover:bg-white flex items-center justify-center transition-colors",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3" })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-bold min-w-[12px] text-center",
															children: quantity
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: () => setQuantity(product.id, quantity + 1, weight),
															className: "size-6 rounded-full hover:bg-white flex items-center justify-center transition-colors",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3" })
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs font-black text-primary",
													children: formatBRL(lineTotal)
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => remove(product.id, weight),
										className: "text-gray-300 hover:text-red-500 transition-colors self-start",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
									})
								]
							}, `${product.id}-${weight}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscountProgressWidget, { className: "bg-white" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: clear,
							className: "text-[10px] font-bold text-gray-400 uppercase hover:text-red-500 transition-colors text-center w-full",
							children: "Limpar carrinho"
						})
					] })
				}),
				lines.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetFooter, {
					className: "p-6 bg-white border-t border-gray-100 flex-col sm:flex-col gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 w-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-xs font-bold text-gray-400 uppercase",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatBRL(subtotal) })]
							}),
							discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-xs font-bold text-primary uppercase",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Desconto Progressivo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["-", formatBRL(discount)] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-lg font-black text-primary-dark border-t border-gray-50 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatBRL(subtotal - discount) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[9px] text-gray-400 font-medium italic text-center",
								children: "* Entrega calculada no checkout"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => setOpen(false),
						asChild: true,
						className: "w-full h-14 rounded-2xl text-base font-black uppercase shadow-lg shadow-primary/20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/checkout",
							children: "Finalizar compra"
						})
					})]
				})
			]
		})]
	});
}
var links = [
	{
		to: "/",
		hash: "cardapio",
		label: "Cardápio",
		icon: Menu,
		type: "link"
	},
	{
		to: "#",
		label: "Áreas de entrega",
		icon: MapPin,
		type: "modal"
	},
	{
		to: "/perfil",
		label: "Cashback",
		icon: Sparkles,
		type: "link"
	},
	{
		to: "/indicar",
		label: "Indique e Ganhe",
		icon: Gift,
		type: "link"
	},
	{
		to: "/fale-conosco",
		label: "Fale conosco",
		icon: MessageSquare,
		type: "link"
	}
];
function SiteHeader() {
	const { count } = useCart();
	useQueryClient();
	const [openDeliveryModal, setOpenDeliveryModal] = (0, import_react.useState)(false);
	const [user, setUser] = (0, import_react.useState)(null);
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(false);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
		supabase.auth.getSession().then(({ data: { session } }) => {
			const u = session?.user ?? null;
			setUser(u);
			if (u) checkAdminStatus(u.id);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			const u = session?.user ?? null;
			setUser(u);
			if (u) checkAdminStatus(u.id);
			else setIsAdmin(false);
		});
		return () => subscription.unsubscribe();
	}, []);
	const checkAdminStatus = async (userId) => {
		const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
		setIsAdmin(!!data);
	};
	const handleSignOut = async () => {
		await supabase.auth.signOut();
		if (typeof window !== "undefined") window.location.href = "/";
	};
	const { data: areas, isLoading } = useQuery({
		queryKey: ["delivery-areas"],
		queryFn: async () => {
			const { data, error } = await supabase.from("delivery_rates").select("*").order("cidade", { ascending: true }).order("bairro", { ascending: true });
			if (!error && data && data.length > 0) return data.map((d) => ({
				...d,
				neighborhood: d.bairro,
				city: d.cidade,
				rate: d.valor
			}));
			return [
				{
					id: 1,
					neighborhood: "Centro",
					rate: 8.9,
					city: "São Bento do Sul"
				},
				{
					id: 2,
					neighborhood: "Progresso",
					rate: 8.9,
					city: "São Bento do Sul"
				},
				{
					id: 3,
					neighborhood: "25 de Julho",
					rate: 10.5,
					city: "São Bento do Sul"
				},
				{
					id: 4,
					neighborhood: "Alpino",
					rate: 17,
					city: "São Bento do Sul"
				},
				{
					id: 5,
					neighborhood: "Boehmerwald",
					rate: 10.5,
					city: "São Bento do Sul"
				},
				{
					id: 6,
					neighborhood: "Brasília",
					rate: 12,
					city: "São Bento do Sul"
				},
				{
					id: 7,
					neighborhood: "Centenário",
					rate: 10.5,
					city: "São Bento do Sul"
				},
				{
					id: 8,
					neighborhood: "Colonial",
					rate: 10.5,
					city: "São Bento do Sul"
				},
				{
					id: 9,
					neighborhood: "Cruzeiro",
					rate: 10.5,
					city: "São Bento do Sul"
				},
				{
					id: 10,
					neighborhood: "Industrial Sudoeste",
					rate: 11,
					city: "São Bento do Sul"
				},
				{
					id: 11,
					neighborhood: "Loteamento Itália",
					rate: 9.5,
					city: "São Bento do Sul"
				},
				{
					id: 12,
					neighborhood: "Mato Preto",
					rate: 12,
					city: "São Bento do Sul"
				},
				{
					id: 13,
					neighborhood: "Oxford",
					rate: 11,
					city: "São Bento do Sul"
				},
				{
					id: 14,
					neighborhood: "Parque Mariani",
					rate: 9.5,
					city: "São Bento do Sul"
				},
				{
					id: 15,
					neighborhood: "Residencial Santa Fé",
					rate: 12.5,
					city: "São Bento do Sul"
				},
				{
					id: 16,
					neighborhood: "Rio Negro",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 17,
					neighborhood: "Schramm",
					rate: 9,
					city: "São Bento do Sul"
				},
				{
					id: 18,
					neighborhood: "Serra Alta",
					rate: 13,
					city: "São Bento do Sul"
				},
				{
					id: 19,
					neighborhood: "Dona Francisca",
					rate: 15,
					city: "São Bento do Sul"
				},
				{
					id: 20,
					neighborhood: "Bela Aliança",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 21,
					neighborhood: "Campo do Meio",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 22,
					neighborhood: "Castelo Branco",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 23,
					neighborhood: "Estrada das Neves",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 24,
					neighborhood: "Estrada dos Bugres",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 25,
					neighborhood: "Lençol",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 26,
					neighborhood: "Rio Natal",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 27,
					neighborhood: "Rio Represo",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 28,
					neighborhood: "Rio Vermelho Estação",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 29,
					neighborhood: "Rio Vermelho Povoado",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 30,
					neighborhood: "Sertãozinho",
					rate: 10,
					city: "São Bento do Sul"
				},
				{
					id: 31,
					neighborhood: "Serra Alta I",
					rate: 13,
					city: "São Bento do Sul"
				},
				{
					id: 32,
					neighborhood: "Serra Alta II",
					rate: 13,
					city: "São Bento do Sul"
				},
				{
					id: 33,
					neighborhood: "Rio Vermelho",
					rate: 12,
					city: "São Bento do Sul"
				},
				{
					id: 34,
					neighborhood: "Oxford I",
					rate: 11,
					city: "São Bento do Sul"
				},
				{
					id: 35,
					neighborhood: "Oxford II",
					rate: 11,
					city: "São Bento do Sul"
				},
				...[
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
				].map((n, i) => ({
					id: 40 + i,
					neighborhood: n,
					rate: 10,
					city: "Rio Negrinho"
				})),
				...[
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
				].map((n, i) => ({
					id: 70 + i,
					neighborhood: n,
					rate: 10,
					city: "Campo Alegre"
				})),
				...[
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
				].map((n, i) => ({
					id: 100 + i,
					neighborhood: n,
					rate: 10,
					city: "Corupá"
				})),
				...[
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
				].map((n, i) => ({
					id: 120 + i,
					neighborhood: n,
					rate: 10,
					city: "Piên"
				})),
				...[
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
				].map((n, i) => ({
					id: 150 + i,
					neighborhood: n,
					rate: 10,
					city: "Rio Negro"
				})),
				...[
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
				].map((n, i) => ({
					id: 180 + i,
					neighborhood: n,
					rate: 10,
					city: "Mafra"
				}))
			];
		},
		staleTime: 1e3 * 60 * 60
	});
	const { data: settings, isPending: isSettingsPending } = useQuery({
		queryKey: ["site-settings"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("*").maybeSingle();
			return data;
		},
		staleTime: 1e3 * 60
	});
	const navBg = settings?.nav_bg_color || "#ffffff";
	const navText = settings?.nav_text_color || "#086e45";
	const announceBg = settings?.announcement_bg_color || "#086e45";
	const announceText = settings?.announcement_text_color || "#ffffff";
	/**
	* Imagens do banner: sempre priorizamos o que foi enviado pelo painel admin.
	* Enquanto a consulta ainda não respondeu, NÃO renderizamos a imagem padrão —
	* isso evitava o "flash" da capa original antes da capa atualizada aparecer.
	*/
	const heroDesktopSrc = settings?.hero_image_url;
	settings?.hero_image_url;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "relative z-[40] transition-all duration-300 pointer-events-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					backgroundColor: announceBg,
					color: announceText
				},
				className: "relative py-2 px-8 text-center text-[10px] font-bold uppercase tracking-wider sm:text-xs z-[60] pointer-events-auto",
				children: [settings?.announcement_text || "PEÇA PARA ENTREGA OU VENHA ESCOLHER PESSOALMENTE EM NOSSA LOJA EM SÃO BENTO DO SUL!", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100",
					children: "✕"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { backgroundColor: navBg },
				className: "mx-auto flex h-16 items-center justify-between px-6 lg:px-12 border-b relative z-[70] pointer-events-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							"aria-label": "Abrir menu",
							className: "md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-border",
							style: { color: navText },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 20 })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
						side: "left",
						className: "w-[80vw] max-w-xs bg-white z-[300]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "text-primary font-black uppercase tracking-tight",
							children: "Menu"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "mt-6 flex flex-col gap-1",
							children: links.map((l) => l.type === "modal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setOpenDeliveryModal(true),
								className: "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(l.icon, {
									size: 18,
									className: "text-primary"
								}), l.label]
							}, l.label) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: l.to,
								hash: l.hash,
								className: "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(l.icon, {
									size: 18,
									className: "text-primary"
								}), l.label]
							}, l.label))
						})]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "hidden flex-1 md:flex items-center justify-center gap-4 sm:gap-6 lg:gap-10",
						children: links.map((l) => l.type === "modal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setOpenDeliveryModal(true),
							style: { color: navText },
							className: "flex items-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] font-semibold transition-opacity hover:opacity-70 whitespace-nowrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(l.icon, {
								size: 16,
								className: "opacity-80 hidden sm:block"
							}), l.label]
						}, l.label) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: l.to,
							hash: l.hash,
							style: { color: navText },
							className: "flex items-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] font-semibold transition-opacity hover:opacity-70 whitespace-nowrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(l.icon, {
								size: 16,
								className: "opacity-80 hidden sm:block"
							}), l.label]
						}, l.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 sm:gap-4",
						children: [user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary overflow-hidden",
								style: { color: navText },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { size: 20 })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
							align: "end",
							className: "w-56 rounded-2xl p-2 shadow-soft border-border bg-white z-[300]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-2 py-1.5 mb-1 border-b border-border/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
										children: "Sua Conta"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium truncate opacity-70",
										children: user.email
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
									asChild: true,
									className: "rounded-xl cursor-pointer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/perfil",
										className: "flex items-center gap-2 w-full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-xs",
											children: "Meu Perfil"
										})]
									})
								}),
								mounted && isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
									asChild: true,
									className: "rounded-xl cursor-pointer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/admin",
										className: "flex items-center gap-2 w-full",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-xs",
											children: "Painel Admin"
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
									onClick: handleSignOut,
									className: "rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4 mr-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-xs",
										children: "Sair"
									})]
								})
							]
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/auth",
							search: { redirect: "/" },
							className: "flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { size: 20 })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartSheet, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "relative flex items-center justify-center size-10 rounded-full hover:bg-black/5 transition-colors",
							style: { color: navText },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { size: 22 }), count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -top-1 -right-1 grid min-size-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-sm",
								children: count
							})]
						}) })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full overflow-visible bg-[#086e45] pointer-events-auto",
				style: { backgroundColor: settings?.hero_bg_color || "#086e45" },
				children: [isSettingsPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-full aspect-[1920/240] max-md:aspect-[1000/360]" }) : settings?.hero_image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("picture", {
						className: "w-full h-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: heroDesktopSrc,
							alt: "Site Banner",
							className: "w-full h-full object-cover opacity-90",
							loading: "eager",
							fetchPriority: "high",
							decoding: "async"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 flex items-center justify-center pointer-events-none",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full max-w-7xl px-6 flex items-center justify-between gap-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "hidden lg:flex items-center gap-12 ml-auto",
								children: (settings?.hero_features)?.map((feature, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center text-center text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-bold opacity-80 uppercase leading-tight",
										children: feature.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xl font-black",
										children: feature.value
									})]
								}, i))
							})
						})
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-24 text-center text-white px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-4xl font-black uppercase tracking-tighter",
						children: "PRÁTICO & SAUDÁVEL & SABOROSO"
					})
				}), settings?.profile_image_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-[15%] z-[300] flex items-center justify-center pointer-events-none",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-[140px] md:size-[200px] rounded-full border-[2px] border-[#fff688] bg-[#086e45] shadow-2xl flex items-center justify-center overflow-hidden pointer-events-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: settings?.profile_image_url,
							className: "w-full h-full object-cover",
							alt: "Profile"
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryAreasModal, {
				open: openDeliveryModal,
				onOpenChange: setOpenDeliveryModal,
				areas,
				isLoading
			})
		]
	});
}
function DeliveryAreasModal({ open, onOpenChange, areas, isLoading }) {
	const [selectedCity, setSelectedCity] = (0, import_react.useState)(null);
	const cities = (0, import_react.useMemo)(() => {
		if (!areas) return [];
		return Array.from(new Set(areas.map((a) => a.city))).sort();
	}, [areas]);
	const neighborhoods = (0, import_react.useMemo)(() => {
		if (!areas || !selectedCity) return [];
		return areas.filter((a) => a.city === selectedCity).sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
	}, [areas, selectedCity]);
	(0, import_react.useEffect)(() => {
		if (open && cities.length > 0 && !selectedCity) setSelectedCity(cities[0]);
	}, [open, cities]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
			className: "max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white border-none shadow-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
				className: "p-6 pb-4 flex flex-row items-center justify-between border-b bg-gray-50/50 shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-2 bg-primary/10 rounded-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "text-primary size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
						className: "text-xl font-black text-primary uppercase tracking-tight",
						children: "Áreas de Entrega"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground font-medium",
						children: "Selecione uma cidade para ver os bairros"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onOpenChange(false),
					className: "p-2 hover:bg-gray-100 rounded-full transition-colors",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 20,
						className: "text-gray-400"
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-1/3 border-r bg-gray-50/30 overflow-y-auto shrink-0",
					children: [cities.map((city) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSelectedCity(city),
						className: cn("w-full text-left px-6 py-4 text-xs font-black uppercase tracking-wider transition-all border-l-4", selectedCity === city ? "bg-white border-primary text-primary shadow-sm" : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"),
						children: city
					}, city)), isLoading && cities.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6 space-y-4",
						children: [
							1,
							2,
							3,
							4
						].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 bg-gray-100 animate-pulse rounded" }, i))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 flex flex-col bg-white overflow-hidden",
					children: selectedCity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-6 py-3 bg-primary/5 border-b shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary" }),
								"Bairros em ",
								selectedCity
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
						className: "flex-1 px-6 py-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 gap-2 pb-6",
							children: neighborhoods.map((area) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all group",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-medium text-gray-700 group-hover:text-primary transition-colors",
									children: area.neighborhood
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary",
									children: area.rate === 0 ? "Grátis" : `R$ ${area.rate.toFixed(2).replace(".", ",")}`
								})]
							}, area.id))
						})
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 flex items-center justify-center text-muted-foreground p-12 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-8 mx-auto opacity-20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: "Selecione uma cidade ao lado para ver os bairros e taxas."
							})]
						})
					})
				})]
			})]
		})
	});
}
var LOGO_URL = "https://assets.lovable.dev/a/v1/2243a82c-49d6-4af9-887d-485d4661259d/fd470ffb-641c-4979-acb2-e05ec52a30be/saborosamente-logo.png";
var MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Rua+Augusto+Wunderwald,+7,+Progresso,+São+Bento+do+Sul,+SC";
function WhatsAppIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" })
	});
}
function InstagramIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className,
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "2",
				y: "2",
				width: "20",
				height: "20",
				rx: "5",
				ry: "5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "17.5",
				y1: "6.5",
				x2: "17.51",
				y2: "6.5"
			})
		]
	});
}
function LogoCard({ logo, name }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		title: name,
		className: "group flex flex-col items-center gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-11 w-[4.5rem] items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:shadow-md group-hover:scale-105",
			children: logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: logo,
				alt: name,
				loading: "lazy",
				className: "h-full w-full object-contain"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[8px] font-black uppercase tracking-wide text-neutral-600 text-center leading-tight",
				children: name
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[8px] font-semibold uppercase tracking-wide opacity-50 text-center leading-tight max-w-[4.5rem]",
			children: name
		})]
	});
}
function SiteFooter() {
	const { data: settings } = useQuery({
		queryKey: ["site-settings"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("*").maybeSingle();
			return data;
		},
		staleTime: 1e3 * 60 * 5
	});
	const bg = settings?.announcement_bg_color || "#086e45";
	const text = settings?.announcement_text_color || "#ffffff";
	const logoUrl = settings?.footer_logo_url || settings?.profile_image_url || LOGO_URL;
	const whatsapp = settings?.footer_whatsapp || "5547991507757";
	const instagram = settings?.footer_instagram || "saborosamente.sbs";
	const addressLine1 = settings?.footer_address_line1 || "Rua Augusto Wunderwald, 7";
	const addressLine2 = settings?.footer_address_line2 || "Progresso — São Bento do Sul/SC";
	const addressCep = settings?.footer_address_cep || "CEP 89281-060";
	const mapsUrl = settings?.footer_maps_url || MAPS_URL;
	const description = settings?.footer_description || "Comida de verdade, congelada no ponto certo e entregue na sua porta.";
	const credit = settings?.footer_credit || "@emf.digital";
	const methods = enabledOrDefault(settings?.payment_methods, defaultPaymentMethods);
	const cardFlags = enabledOrDefault(settings?.card_flags, defaultCardFlags);
	const mealFlags = enabledOrDefault(settings?.meal_flags, defaultMealFlags);
	const mercadoPago = methods.find((m) => (m.label || m.name || "").toLowerCase().includes("mercado"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		style: {
			backgroundColor: bg,
			color: text
		},
		className: "relative mt-24 overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl px-6 py-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-12 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5 lg:col-span-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								"aria-label": "Início",
								className: "inline-block",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: logoUrl,
									alt: "Saborosamente",
									className: "h-20 w-auto transition-transform duration-300 hover:scale-[1.03]",
									style: { filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed opacity-80 max-w-[240px]",
								children: description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2 pt-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs opacity-70",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Leaf, {
											size: 13,
											className: "shrink-0"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sem conservantes industrializados" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs opacity-70",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
											size: 13,
											className: "shrink-0"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "6 meses de validade" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs opacity-70",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
											size: 13,
											className: "shrink-0"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pronto em até 7 minutos" })]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-[10px] font-black uppercase tracking-[0.25em] opacity-50",
							children: "Navegação"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-3 text-sm",
							children: [
								{
									label: "Início",
									to: "/"
								},
								{
									label: "Catálogo",
									to: "/",
									hash: "cardapio"
								},
								{
									label: "Meu perfil",
									to: "/perfil"
								},
								{
									label: "Carrinho",
									to: "/carrinho"
								},
								{
									label: "Checkout",
									to: "/checkout"
								}
							].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								hash: item.hash,
								className: "group flex items-center gap-2 opacity-75 transition-all hover:opacity-100",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px w-3 bg-current opacity-0 transition-all group-hover:w-5 group-hover:opacity-60" }), item.label]
							}) }, item.label))
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-[10px] font-black uppercase tracking-[0.25em] opacity-50",
							children: "Atendimento"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "space-y-4 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: `https://wa.me/${whatsapp}?text=Olá! Gostaria de fazer um pedido.`,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "group flex items-center gap-3 font-semibold opacity-90 transition-all hover:opacity-100 hover:translate-x-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-white/20",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"(+55)",
										" ",
										whatsapp.replace(/^55/, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
									] })]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: `https://instagram.com/${instagram}`,
									target: "_blank",
									rel: "noopener noreferrer",
									className: "group flex items-center gap-3 opacity-80 transition-all hover:opacity-100 hover:translate-x-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-white/20",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstagramIcon, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["@", instagram] })]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "pt-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3 opacity-75 text-xs leading-relaxed",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-semibold text-sm mb-0.5",
												children: "Horário de atendimento"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Encomendas em tempo integral" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Entregas: consulte disponibilidade" })
										] })]
									})
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-[10px] font-black uppercase tracking-[0.25em] opacity-50",
								children: "Localização"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: mapsUrl,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "group flex items-start gap-3 text-xs leading-relaxed opacity-80 transition-opacity hover:opacity-100",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									size: 15,
									className: "shrink-0 mt-0.5"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("address", {
									className: "not-italic",
									children: [
										addressLine1,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										addressLine2,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										addressCep
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full h-36 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
									src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3587.234674720619!2d-49.389274!3d-26.221568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94de1d1b3b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sRua%20Augusto%20Wunderwald%2C%207%20-%20Progresso%2C%20S%C3%A3o%20Bento%20do%20Sul%20-%20SC!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr",
									width: "100%",
									height: "100%",
									style: { border: 0 },
									allowFullScreen: false,
									loading: "lazy",
									referrerPolicy: "no-referrer-when-downgrade",
									title: "Localização Saborosamente"
								})
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-16 pt-12 space-y-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-10 md:grid-cols-2",
					children: [(cardFlags.length > 0 || mercadoPago) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-white/10" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[9px] font-black uppercase tracking-[0.3em] opacity-40 whitespace-nowrap",
									children: "Cartão de Crédito / Débito"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-white/10" })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap justify-center gap-3",
							children: [cardFlags.map((flag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoCard, {
								logo: flag.logo,
								name: flag.name ?? ""
							}, flag.name)), mercadoPago && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								title: "Mercado Pago",
								className: "group flex flex-col items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-11 w-[4.5rem] items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:shadow-md group-hover:scale-105",
									children: mercadoPago.icon || mercadoPago.logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: mercadoPago.icon || mercadoPago.logo,
										alt: "Mercado Pago",
										loading: "lazy",
										className: "h-full w-full object-contain"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[8px] font-black uppercase tracking-wide text-neutral-600 text-center leading-tight",
										children: "MP"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[8px] font-semibold uppercase tracking-wide opacity-50 text-center leading-tight max-w-[4.5rem]",
									children: "Mercado Pago"
								})]
							})]
						})]
					}), mealFlags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-white/10" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[9px] font-black uppercase tracking-[0.3em] opacity-40 whitespace-nowrap",
									children: "Alimentação / Refeição"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-white/10" })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap justify-center gap-3",
							children: mealFlags.map((flag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoCard, {
								logo: flag.logo,
								name: flag.name ?? ""
							}, flag.name))
						})]
					})]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border-t border-white/10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[10px] font-semibold uppercase tracking-widest opacity-40",
						children: [
							"© ",
							(/* @__PURE__ */ new Date()).getFullYear(),
							" Saborosamente — Todos os direitos reservados"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/privacidade",
						className: "text-[10px] font-semibold uppercase tracking-widest opacity-40 transition-opacity hover:opacity-80",
						children: "Política de Privacidade"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `https://instagram.com/${credit.replace("@", "")}`,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "text-[10px] font-semibold uppercase tracking-widest opacity-40 transition-opacity hover:opacity-80",
						children: ["Desenvolvido por ", credit]
					})
				]
			})
		})]
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:p-3",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NavItem({ label, icon: Icon, items, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative group",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: cn("flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium transition-colors hover:text-white shrink-0 outline-none cursor-default", active ? "text-white" : "text-white/90"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					size: 18,
					strokeWidth: 2.5
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "whitespace-nowrap",
					children: label
				}),
				items && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					size: 14,
					className: "ml-0.5 transition-transform duration-200 group-hover:rotate-180"
				})
			]
		}), items && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-0 mt-0 w-64 rounded-b-md bg-white py-2 shadow-xl ring-1 ring-black/5 z-[10000] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "py-1",
				children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: item.href,
					className: "block px-4 py-2 text-xs xl:text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors font-medium border-b border-gray-50 last:border-0",
					children: item.label
				}, item.href))
			})
		})]
	});
}
function AdminHeader() {
	const handleLogout = async () => {
		await supabase.auth.signOut();
		if (typeof window !== "undefined") window.location.href = "/admin/login";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "bg-primary text-white shadow-lg sticky top-0 z-[9999] w-full border-b border-white/10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 xl:gap-8 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/admin",
					className: "flex items-center gap-2 font-bold text-lg xl:text-xl shrink-0 hover:opacity-90 transition-opacity mr-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-9 w-9 bg-white/20 rounded-lg flex items-center justify-center border border-white/20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-white font-black",
							children: "PD"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tracking-tight",
						children: "Admin"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "flex items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Pedidos",
							icon: ClipboardList,
							items: [{
								label: "Ver pedidos",
								href: "/admin/pedidos"
							}, {
								label: "Carrinho abandonado",
								href: "/admin/pedidos/carrinhos-abandonados"
							}]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Clientes",
							icon: Users,
							items: [
								{
									label: "Ver clientes",
									href: "/admin/clientes"
								},
								{
									label: "Cashback",
									href: "/admin/cashback"
								},
								{
									label: "Feedbacks",
									href: "/admin/avaliacoes"
								},
								{
									label: "Pontuação",
									href: "/admin/pontuacao"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Cardápio",
							icon: Utensils,
							items: [
								{
									label: "Cardápio",
									href: "/admin/produtos"
								},
								{
									label: "Combos Monte Você Mesmo",
									href: "/admin/combos"
								},
								{
									label: "Categorias",
									href: "/admin/categorias"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Cupons",
							icon: Ticket,
							items: [{
								label: "Ver cupons",
								href: "/admin/cupons"
							}]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Campanhas",
							icon: MessageSquare,
							items: [{
								label: "WhatsApp em Massa",
								href: "/admin/campanhas"
							}]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Financeiro",
							icon: CircleDollarSign,
							items: [
								{
									label: "Lançamentos",
									href: "/admin/financeiro/lancamentos"
								},
								{
									label: "Transações",
									href: "/admin/financeiro/transacoes"
								},
								{
									label: "Configurar Pagamentos",
									href: "/admin/config/site"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Relatórios",
							icon: ChartColumn,
							items: [
								{
									label: "KPI e indicadores",
									href: "/admin/relatorios/kpi"
								},
								{
									label: "Faturamento e evolução",
									href: "/admin/relatorios/faturamento"
								},
								{
									label: "Pedidos e Vendas",
									href: "/admin/relatorios/vendas"
								},
								{
									label: "Clientes",
									href: "/admin/relatorios/clientes"
								},
								{
									label: "Estoque e produção",
									href: "/admin/relatorios/estoque"
								},
								{
									label: "Comunicação",
									href: "/admin/relatorios/comunicacao"
								},
								{
									label: "Inteligência de mercado",
									href: "/admin/relatorios/inteligencia"
								}
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
							label: "Configurações",
							icon: Settings,
							items: [
								{
									label: "Personalizar Site",
									href: "/admin/config/site"
								},
								{
									label: "Fale Conosco / FAQ",
									href: "/admin/config/faq"
								},
								{
									label: "Cashback",
									href: "/admin/config/cashback-config"
								},
								{
									label: "Agente IA (WhatsApp)",
									href: "/admin/agente"
								},
								{
									label: "Automações WhatsApp",
									href: "/admin/automacoes"
								},
								{
									label: "Unidades",
									href: "/admin/config/unidades"
								},
								{
									label: "Horários e Exceções",
									href: "/admin/config/horarios"
								},
								{
									label: "Entrega (Bairros / Taxas / Área)",
									href: "/admin/config/taxas"
								},
								{
									label: "Informativo",
									href: "/admin/config/informativo"
								},
								{
									label: "Entregador",
									href: "/admin/config/entregador"
								},
								{
									label: "Parâmetros",
									href: "/admin/config/parametros"
								},
								{
									label: "Impressão automática",
									href: "/admin/config/impressao"
								}
							]
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 shrink-0 ml-auto pl-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden sm:flex flex-col items-end text-[10px] xl:text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-white uppercase tracking-wider",
						children: "Saborosamente"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-white/70 font-medium",
						children: "Painel Gestor"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleLogout,
					className: "flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs xl:text-sm font-semibold hover:bg-white/25 transition-all active:scale-95 border border-white/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
						size: 16,
						strokeWidth: 2.5
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden lg:inline",
						children: "Sair"
					})]
				})]
			})]
		})
	});
}
function FloatingDiscountWidget({ onClick }) {
	const { count } = useCart();
	if (count === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		onClick,
		className: "fixed right-4 bottom-24 z-50 flex items-center justify-center bg-primary text-white size-14 rounded-full shadow-2xl border-4 border-white cursor-pointer hover:scale-110 transition-transform animate-in fade-in slide-in-from-bottom-4 duration-500 group",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
			size: 24,
			className: "group-hover:animate-bounce"
		})
	});
	const currentLevel = [...RULES.PROGRESSIVE_DISCOUNT].sort((a, b) => b.min - a.min).find((r) => count >= r.min);
	const nextLevel = [...RULES.PROGRESSIVE_DISCOUNT].sort((a, b) => a.min - b.min).find((r) => count < r.min);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		onClick,
		className: "fixed right-4 bottom-24 z-50 flex flex-col items-end gap-2 group animate-in fade-in slide-in-from-right-4 duration-500 cursor-pointer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 bg-white rounded-2xl shadow-2xl border border-primary/20 p-3 pr-4 transition-transform group-hover:-translate-x-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shrink-0 relative overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
					size: 20,
					strokeWidth: 3
				}), currentLevel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-accent/20 flex items-center justify-center animate-pulse",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
						size: 12,
						className: "text-white"
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col min-w-[120px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-black text-primary uppercase leading-none mb-1 flex items-center gap-1",
						children: currentLevel ? `${(currentLevel.discount * 100).toFixed(0)}% OFF ATIVO` : "Seu Pedido"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm font-black text-primary-dark",
							children: [
								count,
								" ",
								count === 1 ? "item" : "itens"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							size: 14,
							className: "text-primary group-hover:translate-x-1 transition-transform"
						})]
					}),
					nextLevel && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[9px] font-bold text-accent uppercase mt-1",
						children: [
							"+",
							nextLevel.min - count,
							" para ",
							(nextLevel.discount * 100).toFixed(0),
							"% OFF"
						]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "md:hidden bg-primary text-white size-14 rounded-full flex items-center justify-center shadow-xl border-4 border-white relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { size: 20 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-black size-5 rounded-full flex items-center justify-center border-2 border-white",
				children: count
			})]
		})]
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$60 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Saborosamente | Marmitas Congeladas Artesanais" },
			{
				name: "description",
				content: "Marmitas congeladas artesanais da Saborosamente: comida de verdade, porções equilibradas e entrega rápida."
			},
			{
				name: "author",
				content: "Saborosamente"
			},
			{
				property: "og:title",
				content: "Saborosamente | Marmitas Congeladas Artesanais"
			},
			{
				property: "og:description",
				content: "Comida de verdade congelada no ponto certo. Escolha suas marmitas e receba em casa."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@saborosamente"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;500;600&family=Poppins:wght@400;500;600;700;800&family=Pacifico&display=swap"
			},
			{
				rel: "preconnect",
				href: "https://lxcgbrovdmpjatywweiv.supabase.co",
				crossOrigin: "anonymous"
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$60.useRouteContext();
	const pathname = useRouter().state.location.pathname;
	const [isAdminPath, setIsAdminPath] = (0, import_react.useState)(false);
	const [isLoginPage, setIsLoginPage] = (0, import_react.useState)(false);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const admin = pathname.startsWith("/admin");
		const login = pathname === "/admin/login";
		setIsAdminPath(admin);
		setIsLoginPage(login);
		setMounted(true);
	}, [pathname]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CartProvider, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-screen flex-col bg-gradient-to-b from-primary/5 via-background to-background",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "fixed inset-0 -z-10 pointer-events-none overflow-hidden",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal/5 blur-3xl" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" })
						]
					}),
					isAdminPath ? !isLoginPage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminHeader, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "flex-1 relative z-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
					}),
					mounted && !isAdminPath && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
				position: "top-right",
				closeButton: false,
				offset: 20
			}),
			mounted && !isAdminPath && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartSheet, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingDiscountWidget, {}) })
		] })
	});
}
var $$splitComponentImporter$59 = () => import("./routes-ClfSXPMi.mjs");
var Route$59 = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Saborosamente | Marmitas Congeladas Artesanais em São Bento do Sul/SC" },
			{
				name: "description",
				content: "Marmitas congeladas artesanais feitas com ingredientes naturais. Prontas em 7 minutos, validade de 6 meses no freezer. Entrega em São Bento do Sul, Rio Negrinho, Campo Alegre e região."
			},
			{
				name: "keywords",
				content: "marmitas congeladas, marmitas artesanais, São Bento do Sul, Rio Negrinho, Campo Alegre, refeições prontas, comida congelada, delivery marmitas"
			},
			{
				property: "og:title",
				content: "Saborosamente | Marmitas Congeladas Artesanais"
			},
			{
				property: "og:description",
				content: "Marmitas congeladas artesanais feitas com ingredientes naturais. Prontas em 7 minutos. Entrega em São Bento do Sul e região."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:url",
				content: "https://saborosamente.vercel.app/"
			},
			{
				property: "og:image",
				content: "https://saborosamente.vercel.app/favicon.png"
			},
			{
				property: "og:locale",
				content: "pt_BR"
			},
			{
				property: "og:site_name",
				content: "Saborosamente"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: "Saborosamente | Marmitas Congeladas Artesanais"
			},
			{
				name: "twitter:description",
				content: "Marmitas congeladas artesanais. Prontas em 7 minutos, validade 6 meses. Entrega em São Bento do Sul e região."
			},
			{
				name: "twitter:image",
				content: "https://saborosamente.vercel.app/favicon.png"
			},
			{
				name: "robots",
				content: "index, follow"
			},
			{
				name: "author",
				content: "SaborosaMente"
			}
		],
		links: [{
			rel: "canonical",
			href: "https://saborosamente.vercel.app/"
		}],
		scripts: [{
			type: "application/ld+json",
			children: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "FoodEstablishment",
				name: "SaborosaMente",
				description: "Marmitas congeladas artesanais feitas com ingredientes naturais",
				servesCuisine: ["Culinária Brasileira", "Marmitas Congeladas"],
				url: "https://saborosamente.vercel.app/",
				image: "https://saborosamente.vercel.app/favicon.png",
				priceRange: "R$$",
				hasMenu: "https://saborosamente.vercel.app/#cardapio",
				address: {
					"@type": "PostalAddress",
					addressLocality: "São Bento do Sul",
					addressRegion: "SC",
					addressCountry: "BR"
				},
				geo: {
					"@type": "GeoCoordinates",
					latitude: -26.2501,
					longitude: -49.3789
				},
				areaServed: [
					{
						"@type": "City",
						name: "São Bento do Sul"
					},
					{
						"@type": "City",
						name: "Rio Negrinho"
					},
					{
						"@type": "City",
						name: "Campo Alegre"
					},
					{
						"@type": "City",
						name: "Corupá"
					}
				],
				openingHoursSpecification: {
					"@type": "OpeningHoursSpecification",
					dayOfWeek: [
						"Monday",
						"Tuesday",
						"Wednesday",
						"Thursday",
						"Friday",
						"Saturday",
						"Sunday"
					],
					opens: "00:00",
					closes: "23:59",
					description: "Encomendas recebidas 24h"
				},
				offers: {
					"@type": "Offer",
					availability: "https://schema.org/InStock",
					priceCurrency: "BRL"
				}
			})
		}]
	}),
	component: lazyRouteComponent($$splitComponentImporter$59, "component"),
	ssr: false
});
var $$splitComponentImporter$58 = () => import("./admin-D9x0Ds1a.mjs");
var Route$58 = createFileRoute("/admin")({
	component: lazyRouteComponent($$splitComponentImporter$58, "component"),
	ssr: false
});
var $$splitComponentImporter$57 = () => import("./admin-login-CY8uE2eh.mjs");
var Route$57 = createFileRoute("/admin-login")({
	beforeLoad: async ({ location }) => {},
	component: lazyRouteComponent($$splitComponentImporter$57, "component"),
	ssr: false
});
var $$splitComponentImporter$56 = () => import("./carrinho-B-phPRT5.mjs");
var Route$56 = createFileRoute("/carrinho")({
	head: () => ({
		meta: [
			{ title: "Carrinho | Saborosamente" },
			{
				name: "description",
				content: "Revise as marmitas congeladas escolhidas, ajuste quantidades e finalize seu pedido."
			},
			{
				property: "og:title",
				content: "Carrinho | Saborosamente"
			},
			{
				property: "og:description",
				content: "Revise seu pedido de marmitas congeladas."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "canonical",
			href: "https://saborosamente.lovable.app/carrinho"
		}]
	}),
	component: lazyRouteComponent($$splitComponentImporter$56, "component")
});
var $$splitComponentImporter$55 = () => import("./checkout-DYFMyV0a.mjs");
var Route$55 = createFileRoute("/checkout")({
	validateSearch: (search) => ({ cupom: typeof search.cupom === "string" ? search.cupom : void 0 }),
	head: () => ({ meta: [
		{ title: "Checkout | Saborosamente" },
		{
			name: "description",
			content: "Informe os dados de entrega e a forma de pagamento para concluir seu pedido de marmitas."
		},
		{
			property: "og:title",
			content: "Checkout | Saborosamente"
		},
		{
			property: "og:description",
			content: "Finalize seu pedido de marmitas congeladas."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$55, "component")
});
objectType({
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
var $$splitComponentImporter$54 = () => import("./fale-conosco-Blfo9ERr.mjs");
var Route$54 = createFileRoute("/fale-conosco")({
	head: () => ({ meta: [{ title: "Fale Conosco | Saborosamente" }, {
		name: "description",
		content: "Tire suas dúvidas e entre em contato com a Saborosamente."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$54, "component")
});
var $$splitComponentImporter$53 = () => import("./indicar-DQ9egK1F.mjs");
var Route$53 = createFileRoute("/indicar")({
	head: () => ({ meta: [{ title: "Indique e Ganhe | Saborosamente" }, {
		name: "description",
		content: "Indique amigos e ganhe cashback a cada pedido feito pela sua indicação."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$53, "component")
});
var $$splitComponentImporter$52 = () => import("./privacidade-bd2WgK6I.mjs");
var Route$52 = createFileRoute("/privacidade")({
	head: () => ({ meta: [
		{ title: "Política de Privacidade | SaborosaMente" },
		{
			name: "description",
			content: "Política de privacidade e tratamento de dados da SaborosaMente."
		},
		{
			name: "robots",
			content: "index, follow"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$52, "component")
});
var $$splitErrorComponentImporter = () => import("./admin.index-B--7DsbR.mjs");
var $$splitComponentImporter$51 = () => import("./admin.index-C80USW2j.mjs");
var Route$51 = createFileRoute("/admin/")({
	component: lazyRouteComponent($$splitComponentImporter$51, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	ssr: false
});
var $$splitComponentImporter$50 = () => import("./acompanhamentos-m8-rLq2M.mjs");
var Route$50 = createFileRoute("/admin/acompanhamentos")({ component: lazyRouteComponent($$splitComponentImporter$50, "component") });
var $$splitComponentImporter$49 = () => import("./agente-BzCql850.mjs");
var Route$49 = createFileRoute("/admin/agente")({ component: lazyRouteComponent($$splitComponentImporter$49, "component") });
var $$splitComponentImporter$48 = () => import("./automacoes-9tRfJM8u.mjs");
var Route$48 = createFileRoute("/admin/automacoes")({ component: lazyRouteComponent($$splitComponentImporter$48, "component") });
var $$splitComponentImporter$47 = () => import("./avaliacoes-Broz2mXC.mjs");
var Route$47 = createFileRoute("/admin/avaliacoes")({ component: lazyRouteComponent($$splitComponentImporter$47, "component") });
var $$splitComponentImporter$46 = () => import("./admin.campanhas-etGkNxSI.mjs");
var Route$46 = createFileRoute("/admin/campanhas")({
	component: lazyRouteComponent($$splitComponentImporter$46, "component"),
	ssr: false
});
var $$splitComponentImporter$45 = () => import("./cashback-xcW81F17.mjs");
var Route$45 = createFileRoute("/admin/cashback")({ component: lazyRouteComponent($$splitComponentImporter$45, "component") });
var $$splitComponentImporter$44 = () => import("./categorias-B3i3cE9w.mjs");
var Route$44 = createFileRoute("/admin/categorias")({ component: lazyRouteComponent($$splitComponentImporter$44, "component") });
var $$splitComponentImporter$43 = () => import("./admin.clientes-K6owFC7h.mjs");
var Route$43 = createFileRoute("/admin/clientes")({
	component: lazyRouteComponent($$splitComponentImporter$43, "component"),
	ssr: false
});
var $$splitComponentImporter$42 = () => import("./combos-wFO_druo.mjs");
var Route$42 = createFileRoute("/admin/combos")({ component: lazyRouteComponent($$splitComponentImporter$42, "component") });
var $$splitComponentImporter$41 = () => import("./complementos-BlKLrKvO.mjs");
var Route$41 = createFileRoute("/admin/complementos")({ component: lazyRouteComponent($$splitComponentImporter$41, "component") });
var $$splitComponentImporter$40 = () => import("./admin.cupons-D_IGmiZW.mjs");
var Route$40 = createFileRoute("/admin/cupons")({
	component: lazyRouteComponent($$splitComponentImporter$40, "component"),
	ssr: false
});
var $$splitComponentImporter$39 = () => import("./embalagens-rRDPzHbW.mjs");
var Route$39 = createFileRoute("/admin/embalagens")({ component: lazyRouteComponent($$splitComponentImporter$39, "component") });
var $$splitComponentImporter$38 = () => import("./ouvidoria-DAbwDYjm.mjs");
var Route$38 = createFileRoute("/admin/ouvidoria")({ component: lazyRouteComponent($$splitComponentImporter$38, "component") });
var $$splitComponentImporter$37 = () => import("./admin.pedidos-DhifqyPF.mjs");
var Route$37 = createFileRoute("/admin/pedidos")({
	component: lazyRouteComponent($$splitComponentImporter$37, "component"),
	ssr: false
});
var $$splitComponentImporter$36 = () => import("./pontuacao-jgGoeLGF.mjs");
var Route$36 = createFileRoute("/admin/pontuacao")({ component: lazyRouteComponent($$splitComponentImporter$36, "component") });
var $$splitComponentImporter$35 = () => import("./admin.produtos-BUTYPBkl.mjs");
var Route$35 = createFileRoute("/admin/produtos")({
	component: lazyRouteComponent($$splitComponentImporter$35, "component"),
	ssr: false
});
var $$splitComponentImporter$34 = () => import("./storage-cleanup-DeYce8hv.mjs");
var Route$34 = createFileRoute("/admin/storage-cleanup")({ component: lazyRouteComponent($$splitComponentImporter$34, "component") });
var $$splitComponentImporter$33 = () => import("./config-B2LJTMCo.mjs");
var Route$33 = createFileRoute("/admin/config/")({ component: lazyRouteComponent($$splitComponentImporter$33, "component") });
var $$splitComponentImporter$32 = () => import("./area-OhENza4W.mjs");
var Route$32 = createFileRoute("/admin/config/area")({ component: lazyRouteComponent($$splitComponentImporter$32, "component") });
var $$splitComponentImporter$31 = () => import("./bairros-25dN0LOp.mjs");
var Route$31 = createFileRoute("/admin/config/bairros")({ component: lazyRouteComponent($$splitComponentImporter$31, "component") });
var $$splitComponentImporter$30 = () => import("./cashback-bv-4jy3Y.mjs");
var Route$30 = createFileRoute("/admin/config/cashback")({ component: lazyRouteComponent($$splitComponentImporter$30, "component") });
var $$splitComponentImporter$29 = () => import("./cashback-config-DkOyzrtP.mjs");
var Route$29 = createFileRoute("/admin/config/cashback-config")({ component: lazyRouteComponent($$splitComponentImporter$29, "component") });
var $$splitComponentImporter$28 = () => import("./entregador-Cry2KxuN.mjs");
var Route$28 = createFileRoute("/admin/config/entregador")({ component: lazyRouteComponent($$splitComponentImporter$28, "component") });
var $$splitComponentImporter$27 = () => import("./excecoes-D9bXZT3J.mjs");
var Route$27 = createFileRoute("/admin/config/excecoes")({ component: lazyRouteComponent($$splitComponentImporter$27, "component") });
var $$splitComponentImporter$26 = () => import("./faq-DvO58KFS.mjs");
var Route$26 = createFileRoute("/admin/config/faq")({ component: lazyRouteComponent($$splitComponentImporter$26, "component") });
var $$splitComponentImporter$25 = () => import("./horarios-D06AvIab.mjs");
var Route$25 = createFileRoute("/admin/config/horarios")({ component: lazyRouteComponent($$splitComponentImporter$25, "component") });
var $$splitComponentImporter$24 = () => import("./impressao-D64B9Doq.mjs");
var Route$24 = createFileRoute("/admin/config/impressao")({ component: lazyRouteComponent($$splitComponentImporter$24, "component") });
var $$splitComponentImporter$23 = () => import("./informativo-DatOYYhA.mjs");
var Route$23 = createFileRoute("/admin/config/informativo")({ component: lazyRouteComponent($$splitComponentImporter$23, "component") });
var $$splitComponentImporter$22 = () => import("./mesas-4sANsGJs.mjs");
var Route$22 = createFileRoute("/admin/config/mesas")({ component: lazyRouteComponent($$splitComponentImporter$22, "component") });
var $$splitComponentImporter$21 = () => import("./origem-BBQjaPnp.mjs");
var Route$21 = createFileRoute("/admin/config/origem")({ component: lazyRouteComponent($$splitComponentImporter$21, "component") });
var $$splitComponentImporter$20 = () => import("./parametros-WEBzHdKo.mjs");
var Route$20 = createFileRoute("/admin/config/parametros")({ component: lazyRouteComponent($$splitComponentImporter$20, "component") });
var $$splitComponentImporter$19 = () => import("./admin.config.site-B5y-ePNU.mjs");
var Route$19 = createFileRoute("/admin/config/site")({
	component: lazyRouteComponent($$splitComponentImporter$19, "component"),
	ssr: false
});
var $$splitComponentImporter$18 = () => import("./taxas-WSDVAVjl.mjs");
var Route$18 = createFileRoute("/admin/config/taxas")({ component: lazyRouteComponent($$splitComponentImporter$18, "component") });
var $$splitComponentImporter$17 = () => import("./unidades-DDNaQu06.mjs");
var Route$17 = createFileRoute("/admin/config/unidades")({ component: lazyRouteComponent($$splitComponentImporter$17, "component") });
var $$splitComponentImporter$16 = () => import("./novo-CE167v1Y.mjs");
var Route$16 = createFileRoute("/admin/cupons/novo")({ component: lazyRouteComponent($$splitComponentImporter$16, "component") });
var $$splitComponentImporter$15 = () => import("./financeiro-CUbdMdYw.mjs");
var Route$15 = createFileRoute("/admin/financeiro/")({
	component: lazyRouteComponent($$splitComponentImporter$15, "component"),
	ssr: false
});
var $$splitComponentImporter$14 = () => import("./lancamentos-CnOJ_EeZ.mjs");
var Route$14 = createFileRoute("/admin/financeiro/lancamentos")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
var $$splitComponentImporter$13 = () => import("./transacoes-C0jCMbYy.mjs");
var Route$13 = createFileRoute("/admin/financeiro/transacoes")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./pedidos-CM9FpCX9.mjs");
var Route$12 = createFileRoute("/admin/pedidos/")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./acompanhamentos-EFw_XnEv.mjs");
var Route$11 = createFileRoute("/admin/pedidos/acompanhamentos")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./carrinhos-abandonados-Hzyx5aBf.mjs");
var Route$10 = createFileRoute("/admin/pedidos/carrinhos-abandonados")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./complementos-BZiPkbW_.mjs");
var Route$9 = createFileRoute("/admin/pedidos/complementos")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./itens-D66UsHbj.mjs");
var Route$8 = createFileRoute("/admin/pedidos/itens")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./relatorios-Cg0LUg7h.mjs");
var Route$7 = createFileRoute("/admin/relatorios/")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./clientes-TQvQXy7c.mjs");
var Route$6 = createFileRoute("/admin/relatorios/clientes")({
	component: lazyRouteComponent($$splitComponentImporter$6, "component"),
	ssr: false
});
var $$splitComponentImporter$5 = () => import("./comunicacao-CERzi3Sh.mjs");
var Route$5 = createFileRoute("/admin/relatorios/comunicacao")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./estoque-DgnGCkSK.mjs");
var Route$4 = createFileRoute("/admin/relatorios/estoque")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./faturamento--de56uXt.mjs");
var Route$3 = createFileRoute("/admin/relatorios/faturamento")({
	component: lazyRouteComponent($$splitComponentImporter$3, "component"),
	ssr: false
});
var $$splitComponentImporter$2 = () => import("./inteligencia-C65-hahL.mjs");
var Route$2 = createFileRoute("/admin/relatorios/inteligencia")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./kpi-BS5TcpEu.mjs");
var Route$1 = createFileRoute("/admin/relatorios/kpi")({
	component: lazyRouteComponent($$splitComponentImporter$1, "component"),
	ssr: false
});
var $$splitComponentImporter = () => import("./vendas-BdS5KPBu.mjs");
var Route = createFileRoute("/admin/relatorios/vendas")({
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	ssr: false
});
var IndexRoute = Route$59.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$60
});
var AdminRoute = Route$58.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$60
});
var AdminLoginRoute = Route$57.update({
	id: "/admin-login",
	path: "/admin-login",
	getParentRoute: () => Route$60
});
var AuthRoute = Route$61.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$60
});
var CarrinhoRoute = Route$56.update({
	id: "/carrinho",
	path: "/carrinho",
	getParentRoute: () => Route$60
});
var CheckoutRoute = Route$55.update({
	id: "/checkout",
	path: "/checkout",
	getParentRoute: () => Route$60
});
var FaleConoscoRoute = Route$54.update({
	id: "/fale-conosco",
	path: "/fale-conosco",
	getParentRoute: () => Route$60
});
var IndicarRoute = Route$53.update({
	id: "/indicar",
	path: "/indicar",
	getParentRoute: () => Route$60
});
var PrivacidadeRoute = Route$52.update({
	id: "/privacidade",
	path: "/privacidade",
	getParentRoute: () => Route$60
});
var AuthenticatedPerfilRoute = Route$63.update({
	id: "/_authenticated/perfil",
	path: "/perfil",
	getParentRoute: () => Route$60
});
var AdminIndexRoute = Route$51.update({
	id: "/",
	path: "/",
	getParentRoute: () => AdminRoute
});
var AdminAcompanhamentosRoute = Route$50.update({
	id: "/acompanhamentos",
	path: "/acompanhamentos",
	getParentRoute: () => AdminRoute
});
var AdminAgenteRoute = Route$49.update({
	id: "/agente",
	path: "/agente",
	getParentRoute: () => AdminRoute
});
var AdminAutomacoesRoute = Route$48.update({
	id: "/automacoes",
	path: "/automacoes",
	getParentRoute: () => AdminRoute
});
var AdminAvaliacoesRoute = Route$47.update({
	id: "/avaliacoes",
	path: "/avaliacoes",
	getParentRoute: () => AdminRoute
});
var AdminCampanhasRoute = Route$46.update({
	id: "/campanhas",
	path: "/campanhas",
	getParentRoute: () => AdminRoute
});
var AdminCashbackRoute = Route$45.update({
	id: "/cashback",
	path: "/cashback",
	getParentRoute: () => AdminRoute
});
var AdminCategoriasRoute = Route$44.update({
	id: "/categorias",
	path: "/categorias",
	getParentRoute: () => AdminRoute
});
var AdminClientesRoute = Route$43.update({
	id: "/clientes",
	path: "/clientes",
	getParentRoute: () => AdminRoute
});
var AdminCombosRoute = Route$42.update({
	id: "/combos",
	path: "/combos",
	getParentRoute: () => AdminRoute
});
var AdminComplementosRoute = Route$41.update({
	id: "/complementos",
	path: "/complementos",
	getParentRoute: () => AdminRoute
});
var AdminCuponsRoute = Route$40.update({
	id: "/cupons",
	path: "/cupons",
	getParentRoute: () => AdminRoute
});
var AdminEmbalagensRoute = Route$39.update({
	id: "/embalagens",
	path: "/embalagens",
	getParentRoute: () => AdminRoute
});
var AdminOuvidoriaRoute = Route$38.update({
	id: "/ouvidoria",
	path: "/ouvidoria",
	getParentRoute: () => AdminRoute
});
var AdminPedidosRoute = Route$37.update({
	id: "/pedidos",
	path: "/pedidos",
	getParentRoute: () => AdminRoute
});
var AdminPontuacaoRoute = Route$36.update({
	id: "/pontuacao",
	path: "/pontuacao",
	getParentRoute: () => AdminRoute
});
var AdminProdutosRoute = Route$35.update({
	id: "/produtos",
	path: "/produtos",
	getParentRoute: () => AdminRoute
});
var AdminStorageCleanupRoute = Route$34.update({
	id: "/storage-cleanup",
	path: "/storage-cleanup",
	getParentRoute: () => AdminRoute
});
var PedidoIndexRoute = Route$62.update({
	id: "/pedido/",
	path: "/pedido/",
	getParentRoute: () => Route$60
});
var ProdutoIdRoute = Route$64.update({
	id: "/produto/$id",
	path: "/produto/$id",
	getParentRoute: () => Route$60
});
var AdminConfigIndexRoute = Route$33.update({
	id: "/config/",
	path: "/config/",
	getParentRoute: () => AdminRoute
});
var AdminConfigAreaRoute = Route$32.update({
	id: "/config/area",
	path: "/config/area",
	getParentRoute: () => AdminRoute
});
var AdminConfigBairrosRoute = Route$31.update({
	id: "/config/bairros",
	path: "/config/bairros",
	getParentRoute: () => AdminRoute
});
var AdminConfigCashbackRoute = Route$30.update({
	id: "/config/cashback",
	path: "/config/cashback",
	getParentRoute: () => AdminRoute
});
var AdminConfigCashbackConfigRoute = Route$29.update({
	id: "/config/cashback-config",
	path: "/config/cashback-config",
	getParentRoute: () => AdminRoute
});
var AdminConfigEntregadorRoute = Route$28.update({
	id: "/config/entregador",
	path: "/config/entregador",
	getParentRoute: () => AdminRoute
});
var AdminConfigExcecoesRoute = Route$27.update({
	id: "/config/excecoes",
	path: "/config/excecoes",
	getParentRoute: () => AdminRoute
});
var AdminConfigFaqRoute = Route$26.update({
	id: "/config/faq",
	path: "/config/faq",
	getParentRoute: () => AdminRoute
});
var AdminConfigHorariosRoute = Route$25.update({
	id: "/config/horarios",
	path: "/config/horarios",
	getParentRoute: () => AdminRoute
});
var AdminConfigImpressaoRoute = Route$24.update({
	id: "/config/impressao",
	path: "/config/impressao",
	getParentRoute: () => AdminRoute
});
var AdminConfigInformativoRoute = Route$23.update({
	id: "/config/informativo",
	path: "/config/informativo",
	getParentRoute: () => AdminRoute
});
var AdminConfigMesasRoute = Route$22.update({
	id: "/config/mesas",
	path: "/config/mesas",
	getParentRoute: () => AdminRoute
});
var AdminConfigOrigemRoute = Route$21.update({
	id: "/config/origem",
	path: "/config/origem",
	getParentRoute: () => AdminRoute
});
var AdminConfigParametrosRoute = Route$20.update({
	id: "/config/parametros",
	path: "/config/parametros",
	getParentRoute: () => AdminRoute
});
var AdminConfigSiteRoute = Route$19.update({
	id: "/config/site",
	path: "/config/site",
	getParentRoute: () => AdminRoute
});
var AdminConfigTaxasRoute = Route$18.update({
	id: "/config/taxas",
	path: "/config/taxas",
	getParentRoute: () => AdminRoute
});
var AdminConfigUnidadesRoute = Route$17.update({
	id: "/config/unidades",
	path: "/config/unidades",
	getParentRoute: () => AdminRoute
});
var AdminCuponsNovoRoute = Route$16.update({
	id: "/novo",
	path: "/novo",
	getParentRoute: () => AdminCuponsRoute
});
var AdminFinanceiroIndexRoute = Route$15.update({
	id: "/financeiro/",
	path: "/financeiro/",
	getParentRoute: () => AdminRoute
});
var AdminFinanceiroLancamentosRoute = Route$14.update({
	id: "/financeiro/lancamentos",
	path: "/financeiro/lancamentos",
	getParentRoute: () => AdminRoute
});
var AdminFinanceiroTransacoesRoute = Route$13.update({
	id: "/financeiro/transacoes",
	path: "/financeiro/transacoes",
	getParentRoute: () => AdminRoute
});
var AdminPedidosIndexRoute = Route$12.update({
	id: "/",
	path: "/",
	getParentRoute: () => AdminPedidosRoute
});
var AdminPedidosAcompanhamentosRoute = Route$11.update({
	id: "/acompanhamentos",
	path: "/acompanhamentos",
	getParentRoute: () => AdminPedidosRoute
});
var AdminPedidosCarrinhosAbandonadosRoute = Route$10.update({
	id: "/carrinhos-abandonados",
	path: "/carrinhos-abandonados",
	getParentRoute: () => AdminPedidosRoute
});
var AdminPedidosComplementosRoute = Route$9.update({
	id: "/complementos",
	path: "/complementos",
	getParentRoute: () => AdminPedidosRoute
});
var AdminPedidosItensRoute = Route$8.update({
	id: "/itens",
	path: "/itens",
	getParentRoute: () => AdminPedidosRoute
});
var AdminRelatoriosIndexRoute = Route$7.update({
	id: "/relatorios/",
	path: "/relatorios/",
	getParentRoute: () => AdminRoute
});
var AdminRelatoriosClientesRoute = Route$6.update({
	id: "/relatorios/clientes",
	path: "/relatorios/clientes",
	getParentRoute: () => AdminRoute
});
var AdminRelatoriosComunicacaoRoute = Route$5.update({
	id: "/relatorios/comunicacao",
	path: "/relatorios/comunicacao",
	getParentRoute: () => AdminRoute
});
var AdminRelatoriosEstoqueRoute = Route$4.update({
	id: "/relatorios/estoque",
	path: "/relatorios/estoque",
	getParentRoute: () => AdminRoute
});
var AdminRelatoriosFaturamentoRoute = Route$3.update({
	id: "/relatorios/faturamento",
	path: "/relatorios/faturamento",
	getParentRoute: () => AdminRoute
});
var AdminRelatoriosInteligenciaRoute = Route$2.update({
	id: "/relatorios/inteligencia",
	path: "/relatorios/inteligencia",
	getParentRoute: () => AdminRoute
});
var AdminRelatoriosKpiRoute = Route$1.update({
	id: "/relatorios/kpi",
	path: "/relatorios/kpi",
	getParentRoute: () => AdminRoute
});
var AdminRelatoriosVendasRoute = Route.update({
	id: "/relatorios/vendas",
	path: "/relatorios/vendas",
	getParentRoute: () => AdminRoute
});
var AdminCuponsRouteChildren = { AdminCuponsNovoRoute };
var AdminCuponsRouteWithChildren = AdminCuponsRoute._addFileChildren(AdminCuponsRouteChildren);
var AdminPedidosRouteChildren = {
	AdminPedidosAcompanhamentosRoute,
	AdminPedidosCarrinhosAbandonadosRoute,
	AdminPedidosComplementosRoute,
	AdminPedidosItensRoute,
	AdminPedidosIndexRoute
};
var AdminRouteChildren = {
	AdminAcompanhamentosRoute,
	AdminAgenteRoute,
	AdminAutomacoesRoute,
	AdminAvaliacoesRoute,
	AdminCampanhasRoute,
	AdminCashbackRoute,
	AdminCategoriasRoute,
	AdminClientesRoute,
	AdminCombosRoute,
	AdminComplementosRoute,
	AdminCuponsRoute: AdminCuponsRouteWithChildren,
	AdminEmbalagensRoute,
	AdminOuvidoriaRoute,
	AdminPedidosRoute: AdminPedidosRoute._addFileChildren(AdminPedidosRouteChildren),
	AdminPontuacaoRoute,
	AdminProdutosRoute,
	AdminStorageCleanupRoute,
	AdminIndexRoute,
	AdminConfigAreaRoute,
	AdminConfigBairrosRoute,
	AdminConfigCashbackRoute,
	AdminConfigCashbackConfigRoute,
	AdminConfigEntregadorRoute,
	AdminConfigExcecoesRoute,
	AdminConfigFaqRoute,
	AdminConfigHorariosRoute,
	AdminConfigImpressaoRoute,
	AdminConfigInformativoRoute,
	AdminConfigMesasRoute,
	AdminConfigOrigemRoute,
	AdminConfigParametrosRoute,
	AdminConfigSiteRoute,
	AdminConfigTaxasRoute,
	AdminConfigUnidadesRoute,
	AdminFinanceiroLancamentosRoute,
	AdminFinanceiroTransacoesRoute,
	AdminRelatoriosClientesRoute,
	AdminRelatoriosComunicacaoRoute,
	AdminRelatoriosEstoqueRoute,
	AdminRelatoriosFaturamentoRoute,
	AdminRelatoriosInteligenciaRoute,
	AdminRelatoriosKpiRoute,
	AdminRelatoriosVendasRoute,
	AdminConfigIndexRoute,
	AdminFinanceiroIndexRoute,
	AdminRelatoriosIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AdminRoute: AdminRoute._addFileChildren(AdminRouteChildren),
	AdminLoginRoute,
	AuthRoute,
	CarrinhoRoute,
	CheckoutRoute,
	FaleConoscoRoute,
	IndicarRoute,
	PrivacidadeRoute,
	AuthenticatedPerfilRoute,
	ProdutoIdRoute,
	PedidoIndexRoute
};
var routeTree = Route$60._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 1e3 * 60 * 5,
		defaultPendingComponent: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-screen items-center justify-center bg-white",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-muted-foreground",
					children: "Carregando..."
				})]
			})
		})
	});
};
//#endregion
export { getRouter };
