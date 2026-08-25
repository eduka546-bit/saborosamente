import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime, a as Overlay2, c as Title2, i as Description2, n as Cancel, o as Portal2, r as Content2, s as Root2, t as Action } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { A as ShoppingBag, Bt as CircleArrowUp, H as Plus, L as RotateCcw, Vt as CircleArrowDown, W as Pencil, _ as Trash2, en as Briefcase, ft as House, gt as Gift, jt as Clock, nt as MapPinned, p as Truck, rt as MapPin } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as buttonVariants, t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { o as format, t as ptBR } from "../_libs/date-fns.mjs";
import { i as useCart } from "./cart-YJDidPFU.mjs";
import { i as getSaldo } from "./cashback-BUSwvZGQ.mjs";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-BXjpJ96D.mjs";
import { t as Route } from "./perfil-Dme-eInH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/perfil-CYJb0Klm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AlertDialog = Root2;
var AlertDialogPortal = Portal2;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay2, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = Overlay2.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = Content2.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title2, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = Title2.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description2, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = Description2.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = Action.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cancel, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = Cancel.displayName;
function PerfilPage() {
	const { session } = Route.useRouteContext();
	const { add } = useCart();
	const { taxas } = useCart();
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [addresses, setAddresses] = (0, import_react.useState)([]);
	const [isAddingAddress, setIsAddingAddress] = (0, import_react.useState)(false);
	const [isEditingProfile, setIsEditingProfile] = (0, import_react.useState)(false);
	const [editingAddressId, setEditingAddressId] = (0, import_react.useState)(null);
	const [addressToDelete, setAddressToDelete] = (0, import_react.useState)(null);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [loadingOrders, setLoadingOrders] = (0, import_react.useState)(true);
	const [savingProfile, setSavingProfile] = (0, import_react.useState)(false);
	const [cashbackSaldo, setCashbackSaldo] = (0, import_react.useState)(0);
	const [cashbackTransacoes, setCashbackTransacoes] = (0, import_react.useState)([]);
	const [profileForm, setProfileForm] = (0, import_react.useState)({
		nome: "",
		telefone: "",
		cpf: ""
	});
	const [newAddress, setNewAddress] = (0, import_react.useState)({
		label: "",
		cidade: "",
		bairro: "",
		rua: "",
		numero: "",
		complemento: "",
		cep: ""
	});
	(0, import_react.useEffect)(() => {
		fetchProfile();
		fetchAddresses();
		fetchOrders();
		getSaldo(session.user.id).then((s) => setCashbackSaldo(s));
		supabase.from("cashback_transacoes").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20).then(({ data }) => setCashbackTransacoes(data ?? []));
	}, []);
	const fetchOrders = async () => {
		try {
			const { data: pedidos, error } = await supabase.from("pedidos").select("*, itens:pedido_itens(*)").eq("user_id", session.user.id).order("created_at", { ascending: false });
			if (error) throw error;
			const produtoIds = [...new Set((pedidos ?? []).flatMap((p) => (p.itens ?? []).map((i) => i.produto_id).filter(Boolean)))];
			const nomesMap = {};
			if (produtoIds.length > 0) {
				const { data: prods } = await supabase.from("produtos").select("id, nome").in("id", produtoIds);
				(prods ?? []).forEach((p) => {
					nomesMap[p.id] = p.nome;
				});
			}
			const ordersWithNames = (pedidos ?? []).map((pedido) => ({
				...pedido,
				itens: (pedido.itens ?? []).map((item) => ({
					...item,
					produtos: { nome: nomesMap[item.produto_id] ?? "Produto" }
				})),
				historico: []
			}));
			setOrders(ordersWithNames);
		} catch (err) {
			console.error("Erro ao buscar pedidos:", err.message);
		} finally {
			setLoadingOrders(false);
		}
	};
	const fetchProfile = async () => {
		const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
		if (data) {
			setProfile(data);
			setProfileForm({
				nome: data.nome || "",
				telefone: data.telefone || "",
				cpf: data.cpf || ""
			});
		}
		setLoading(false);
	};
	const handleUpdateProfile = async (e) => {
		e.preventDefault();
		setSavingProfile(true);
		try {
			const { error } = await supabase.from("profiles").upsert({
				id: session.user.id,
				nome: profileForm.nome,
				telefone: profileForm.telefone,
				cpf: profileForm.cpf,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}, { onConflict: "id" });
			if (error) throw error;
			toast.success("Perfil atualizado com sucesso!");
			setIsEditingProfile(false);
			fetchProfile();
		} catch (err) {
			toast.error("Erro ao atualizar perfil: " + err.message);
		} finally {
			setSavingProfile(false);
		}
	};
	const handleCepSearch = async (cep) => {
		const numericCep = cep.replace(/\D/g, "");
		setNewAddress((prev) => ({
			...prev,
			cep: numericCep
		}));
		if (numericCep.length === 8) try {
			const data = await (await fetch(`https://viacep.com.br/ws/${numericCep}/json/`)).json();
			if (!data.erro) {
				setNewAddress((prev) => ({
					...prev,
					rua: data.logradouro,
					bairro: data.bairro,
					cidade: data.localidade
				}));
				toast.success("CEP encontrado!");
			} else toast.error("CEP não encontrado.");
		} catch (err) {
			toast.error("Erro ao buscar CEP.");
		}
	};
	const fetchAddresses = async () => {
		const { data, error } = await supabase.from("user_addresses").select("*").eq("user_id", session.user.id).order("is_default", { ascending: false });
		if (data) setAddresses(data);
	};
	const handleSaveAddress = async (e) => {
		e.preventDefault();
		try {
			if (editingAddressId) {
				const { error } = await supabase.from("user_addresses").update({
					label: newAddress.label || "Endereço",
					cidade: newAddress.cidade,
					bairro: newAddress.bairro,
					rua: newAddress.rua,
					numero: newAddress.numero,
					complemento: newAddress.complemento,
					cep: newAddress.cep
				}).eq("id", editingAddressId);
				if (error) throw error;
				toast.success("Endereço atualizado!");
			} else {
				const { error } = await supabase.from("user_addresses").insert({
					user_id: session.user.id,
					label: newAddress.label || "Endereço",
					cidade: newAddress.cidade,
					bairro: newAddress.bairro,
					rua: newAddress.rua,
					numero: newAddress.numero,
					complemento: newAddress.complemento,
					cep: newAddress.cep,
					is_default: addresses.length === 0
				});
				if (error) throw error;
				toast.success("Endereço adicionado!");
			}
			setIsAddingAddress(false);
			setEditingAddressId(null);
			setNewAddress({
				label: "",
				cidade: "",
				bairro: "",
				rua: "",
				numero: "",
				complemento: "",
				cep: ""
			});
			fetchAddresses();
		} catch (error) {
			toast.error("Erro ao salvar endereço: " + error.message);
		}
	};
	const handleEditAddress = (addr) => {
		setNewAddress({
			label: addr.label,
			cidade: addr.cidade,
			bairro: addr.bairro,
			rua: addr.rua,
			numero: addr.numero,
			complemento: addr.complemento || "",
			cep: addr.cep || ""
		});
		setEditingAddressId(addr.id);
		setIsAddingAddress(true);
		if (typeof window !== "undefined") window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	};
	const handleDeleteAddress = async () => {
		if (!addressToDelete) return;
		try {
			const { error } = await supabase.from("user_addresses").delete().eq("id", addressToDelete);
			if (error) throw error;
			toast.success("Endereço removido");
			setAddressToDelete(null);
			fetchAddresses();
		} catch (error) {
			toast.error("Erro ao remover: " + error.message);
		}
	};
	const currentTaxa = (0, import_react.useMemo)(() => {
		if (!newAddress.cidade || !newAddress.bairro) return null;
		return taxas.find((t) => t.cidade.toLowerCase().trim() === newAddress.cidade.toLowerCase().trim() && t.bairro.toLowerCase().trim() === newAddress.bairro.toLowerCase().trim());
	}, [
		newAddress.cidade,
		newAddress.bairro,
		taxas
	]);
	const handleRepeatOrder = (order) => {
		try {
			order.itens?.forEach((item) => {
				add(item.produto_id, item.quantidade, item.peso);
			});
			toast.success("Pedido repetido!", { description: `${order.itens?.length || 0} item(ns) adicionados ao carrinho` });
		} catch (error) {
			toast.error("Erro ao repetir pedido");
		}
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center",
		children: "Carregando..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "container mx-auto max-w-4xl px-4 py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8 space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold",
					children: "Meu Perfil"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "Gerencie suas informações e pedidos."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-8 md:grid-cols-[1fr_2fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "h-fit",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: isEditingProfile ? "Editar Dados" : "Dados Pessoais" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: isEditingProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleUpdateProfile,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "nome",
									children: "Nome Completo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "nome",
									value: profileForm.nome,
									onChange: (e) => setProfileForm({
										...profileForm,
										nome: e.target.value
									}),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "telefone",
									children: "Telefone / WhatsApp"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "telefone",
									value: profileForm.telefone,
									onChange: (e) => setProfileForm({
										...profileForm,
										telefone: e.target.value
									}),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "cpf",
									children: "CPF"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "cpf",
									value: profileForm.cpf,
									onChange: (e) => setProfileForm({
										...profileForm,
										cpf: e.target.value
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "flex-1",
									disabled: savingProfile,
									children: savingProfile ? "Salvando..." : "Salvar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => setIsEditingProfile(false),
									children: "Cancelar"
								})]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground uppercase",
								children: "Nome"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: profile?.nome || "Não informado"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground uppercase",
								children: "E-mail"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: session.user.email
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground uppercase",
								children: "Telefone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: profile?.telefone || "Não informado"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs text-muted-foreground uppercase",
								children: "CPF"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: profile?.cpf || "Não informado"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								className: "w-full mt-4",
								onClick: () => setIsEditingProfile(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "mr-2 h-4 w-4" }), " Editar Dados"]
							})
						]
					}) })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-xl font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "h-5 w-5 text-primary" }), "Meus Pedidos"]
							}), loadingOrders ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center py-8",
								children: "Carregando pedidos..."
							}) : orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-dashed",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "py-12 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "mx-auto h-12 w-12 text-muted-foreground/30 mb-4" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground",
											children: "Você ainda não realizou nenhum pedido."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											asChild: true,
											variant: "outline",
											className: "mt-4 rounded-full",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
												to: "/",
												children: "Ir para o Cardápio"
											})
										})
									]
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-4",
								children: orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-muted/30 px-6 py-4 flex items-center justify-between border-b",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
												children: "Pedido"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "font-bold text-primary",
												children: ["#", order.id.slice(0, 8)]
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
												children: "Data"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium",
												children: new Date(order.created_at).toLocaleDateString("pt-BR")
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${order.status === "Entregue" ? "bg-green-50 text-green-600 border-green-200" : order.status === "Cancelado" ? "bg-red-50 text-red-600 border-red-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`,
												children: order.status
											})
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-sm font-medium text-muted-foreground mb-2",
													children: [
														order.itens?.length,
														" ",
														order.itens?.length === 1 ? "item" : "itens"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex -space-x-2",
													children: order.itens?.slice(0, 5).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold",
														title: item.produtos?.nome,
														children: item.quantidade
													}, item.id))
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-right",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
													children: "Total"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-lg font-bold",
													children: ["R$ ", order.valor_total.toFixed(2).replace(".", ",")]
												})]
											})]
										}), order.status && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 pt-4 border-t space-y-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2",
												children: "Status"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-xs font-bold px-3 py-1.5 rounded-full border ${order.status === "entregue" ? "bg-green-50 text-green-600 border-green-200" : order.status === "cancelado" ? "bg-red-50 text-red-600 border-red-200" : order.status === "preparando" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`,
												children: order.status.charAt(0).toUpperCase() + order.status.slice(1)
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												onClick: () => handleRepeatOrder(order),
												variant: "outline",
												size: "sm",
												className: "w-full gap-2 border-primary text-primary hover:bg-primary/5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { size: 16 }), "Repetir Pedido"]
											})]
										})]
									})]
								}, order.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
									className: "text-xl font-bold flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "h-5 w-5 text-yellow-500" }), "Meu Cashback"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "border-yellow-200 bg-yellow-50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
										className: "p-6 flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-bold uppercase tracking-widest text-yellow-600 mb-1",
												children: "Saldo disponível"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-3xl font-black text-yellow-700",
												children: ["R$ ", cashbackSaldo.toFixed(2).replace(".", ",")]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-yellow-600 mt-1",
												children: "Use no checkout para descontar do próximo pedido"
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-16 w-16 rounded-full bg-yellow-200 flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, {
												size: 28,
												className: "text-yellow-600"
											})
										})]
									})
								}),
								cashbackTransacoes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-bold text-muted-foreground uppercase tracking-widest",
										children: "Histórico"
									}), cashbackTransacoes.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between bg-white border rounded-xl px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [t.tipo === "recebido" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleArrowUp, {
												size: 16,
												className: "text-green-500 shrink-0"
											}) : t.tipo === "usado" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleArrowDown, {
												size: 16,
												className: "text-blue-500 shrink-0"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
												size: 16,
												className: "text-red-400 shrink-0"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium text-gray-800 capitalize",
												children: t.tipo
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-gray-400",
												children: format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `font-bold text-sm ${t.tipo === "recebido" ? "text-green-600" : "text-red-500"}`,
											children: [
												t.tipo === "recebido" ? "+" : "−",
												" R$ ",
												Math.abs(t.valor).toFixed(2)
											]
										})]
									}, t.id))]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-xl font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "h-5 w-5 text-primary" }), "Indique e Ganhe"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-primary/20 bg-primary/5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "p-6 flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-bold text-gray-900 mb-1",
										children: "Ganhe R$ 5,00 por indicação!"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-gray-500",
										children: "Compartilhe seu link e ganhe cashback a cada amigo que fizer o primeiro pedido."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/indicar",
										className: "shrink-0 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:bg-primary/90 transition-all whitespace-nowrap",
										children: "Ver meu link"
									})]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "text-xl font-bold flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPinned, { className: "h-5 w-5 text-primary" }), "Meus Endereços"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: () => {
											setIsAddingAddress(!isAddingAddress);
											if (!isAddingAddress) setEditingAddressId(null);
										},
										size: "sm",
										className: "rounded-full",
										children: isAddingAddress ? "Cancelar" : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Novo Endereço"] })
									})]
								}),
								isAddingAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "border-primary/20 bg-primary/5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
										className: "text-lg",
										children: editingAddressId ? "Editar Endereço" : "Adicionar Novo Endereço"
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
										onSubmit: handleSaveAddress,
										className: "space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-4 sm:grid-cols-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "cep",
														children: "CEP"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "cep",
														placeholder: "00000-000",
														value: newAddress.cep,
														onChange: (e) => handleCepSearch(e.target.value)
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "label",
														children: "Apelido (ex: Casa, Trabalho)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "label",
														value: newAddress.label,
														onChange: (e) => setNewAddress({
															...newAddress,
															label: e.target.value
														}),
														placeholder: "Ex: Casa",
														required: true
													})]
												})]
											}),
											currentTaxa && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-top-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Truck, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-sm font-bold",
													children: [
														"Taxa de entrega para este local: R$",
														" ",
														currentTaxa.taxa.toFixed(2).replace(".", ",")
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid gap-4 sm:grid-cols-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "cidade",
														children: "Cidade"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "cidade",
														value: newAddress.cidade,
														onChange: (e) => setNewAddress({
															...newAddress,
															cidade: e.target.value
														}),
														required: true
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-4 sm:grid-cols-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "bairro",
														children: "Bairro"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "bairro",
														value: newAddress.bairro,
														onChange: (e) => setNewAddress({
															...newAddress,
															bairro: e.target.value
														}),
														required: true
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "rua",
														children: "Rua"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "rua",
														value: newAddress.rua,
														onChange: (e) => setNewAddress({
															...newAddress,
															rua: e.target.value
														}),
														required: true
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-4 sm:grid-cols-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "numero",
														children: "Número"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "numero",
														value: newAddress.numero,
														onChange: (e) => setNewAddress({
															...newAddress,
															numero: e.target.value
														}),
														required: true
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "complemento",
														children: "Complemento (opcional)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "complemento",
														value: newAddress.complemento,
														onChange: (e) => setNewAddress({
															...newAddress,
															complemento: e.target.value
														})
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "submit",
												className: "w-full",
												children: editingAddressId ? "Atualizar Endereço" : "Salvar Endereço"
											})
										]
									}) })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-4",
									children: addresses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center py-12 bg-muted/30 rounded-3xl border border-dashed",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "mx-auto h-12 w-12 text-muted-foreground/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-muted-foreground",
											children: "Nenhum endereço cadastrado."
										})]
									}) : addresses.map((addr) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
										className: addr.is_default ? "border-primary/50 shadow-sm" : "",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
											className: "p-6 flex items-start justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-1 bg-primary/10 p-2 rounded-xl text-primary",
													children: addr.label?.toLowerCase().includes("casa") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { size: 20 }) : addr.label?.toLowerCase().includes("trabalho") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { size: 20 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 20 })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
															className: "font-bold",
															children: addr.label
														}), addr.is_default && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
															children: "Padrão"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm text-muted-foreground mt-1",
														children: [
															addr.rua,
															", ",
															addr.numero,
															addr.complemento ? ` - ${addr.complemento}` : ""
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-sm text-muted-foreground",
														children: [
															addr.bairro,
															", ",
															addr.cidade
														]
													})
												] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "text-primary hover:text-primary hover:bg-primary/10",
													onClick: () => handleEditAddress(addr),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 18 })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "text-destructive hover:text-destructive hover:bg-destructive/10",
													onClick: () => setAddressToDelete(addr.id),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 })
												})]
											})]
										})
									}, addr.id))
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialog, {
				open: !!addressToDelete,
				onOpenChange: (open) => !open && setAddressToDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, {
					className: "rounded-3xl border-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, {
						className: "text-xl font-bold",
						children: "Excluir endereço?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "Esta ação não pode ser desfeita. O endereço será removido permanentemente da sua conta." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, {
						className: "gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, {
							className: "rounded-full border-border",
							children: "Cancelar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
							onClick: handleDeleteAddress,
							className: "rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90",
							children: "Confirmar Exclusão"
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { PerfilPage as component };
