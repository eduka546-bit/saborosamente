import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { At as Copy, Jt as Check, M as Share2, c as Users, gt as Gift, h as TrendingUp } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/indicar-DQ9egK1F.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function IndicarPage() {
	const queryClient = useQueryClient();
	const [session, setSession] = (0, import_react.useState)(null);
	const [copiado, setCopiado] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setSession(data.session));
	}, []);
	const { data: profile, isLoading } = useQuery({
		queryKey: ["indicacao-profile", session?.user?.id],
		enabled: !!session?.user?.id,
		queryFn: async () => {
			const { data } = await supabase.from("profiles").select("id, nome, codigo_indicacao").eq("id", session.user.id).single();
			return data;
		}
	});
	const gerarCodigoMutation = useMutation({
		mutationFn: async () => {
			const codigo = `IND-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
			const { error } = await supabase.from("profiles").update({ codigo_indicacao: codigo }).eq("id", session.user.id);
			if (error) throw error;
			return codigo;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["indicacao-profile"] })
	});
	const { data: indicacoes = [] } = useQuery({
		queryKey: ["minhas-indicacoes", session?.user?.id],
		enabled: !!session?.user?.id,
		queryFn: async () => {
			const { data } = await supabase.from("indicacoes").select("*").eq("indicador_user_id", session.user.id).order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (profile && !profile.codigo_indicacao && !isLoading) gerarCodigoMutation.mutate();
	}, [profile, isLoading]);
	const linkIndicacao = profile?.codigo_indicacao ? `${typeof window !== "undefined" ? window.location.origin : "https://saborosamente.vercel.app"}/?ref=${profile.codigo_indicacao}` : "";
	const copiarLink = () => {
		if (!linkIndicacao) return;
		navigator.clipboard.writeText(linkIndicacao);
		setCopiado(true);
		toast.success("Link copiado!");
		setTimeout(() => setCopiado(false), 2e3);
	};
	const compartilhar = async () => {
		if (!linkIndicacao) return;
		if (navigator.share) await navigator.share({
			title: "Saborosamente — Marmitas Congeladas Artesanais",
			text: "Use meu link e ganhe desconto no primeiro pedido! 🍱",
			url: linkIndicacao
		});
		else copiarLink();
	};
	const totalConvertidas = indicacoes.filter((i) => i.status === "convertido" || i.status === "pago").length;
	const totalCashback = indicacoes.reduce((s, i) => s + (Number(i.cashback_gerado) || 0), 0);
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, {
				size: 48,
				className: "text-primary/30"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold",
				children: "Indique e Ganhe"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-gray-500 max-w-xs",
				children: "Faça login para gerar seu link de indicação e ganhar cashback a cada amigo que comprar."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/auth",
				search: { redirect: "/indicar" },
				className: "bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm hover:bg-primary/90 transition-all",
				children: "Entrar / Cadastrar"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-lg mx-auto px-4 py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center mb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { size: 32 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-bold text-gray-900",
						children: "Indique e Ganhe"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-gray-500 text-sm mt-2 max-w-xs mx-auto",
						children: [
							"A cada amigo que fizer o primeiro pedido usando seu link, você ganha",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "R$ 5,00" }),
							" de cashback automático 🎉"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border p-5 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-3xl font-black text-primary",
						children: totalConvertidas
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 font-bold uppercase mt-1",
						children: "Indicações convertidas"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-2xl border p-5 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-3xl font-black text-green-600",
						children: ["R$ ", totalCashback.toFixed(2).replace(".", ",")]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 font-bold uppercase mt-1",
						children: "Cashback acumulado"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border p-5 space-y-4 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold text-gray-800 text-sm",
						children: "Seu link de indicação"
					}),
					isLoading || !profile?.codigo_indicacao ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 bg-gray-100 rounded-xl animate-pulse" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 bg-gray-50 border rounded-xl px-3 py-2.5 text-xs font-mono text-gray-600 truncate",
							children: linkIndicacao
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: copiarLink,
							className: "p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shrink-0",
							children: copiado ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 16 })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: compartilhar,
						className: "w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { size: 16 }), " Compartilhar link"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border p-5 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-bold text-gray-800 mb-4",
					children: "Como funciona"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: [
						{
							icon: Share2,
							texto: "Compartilhe seu link com amigos"
						},
						{
							icon: Users,
							texto: "Amigo faz o primeiro pedido pelo link"
						},
						{
							icon: TrendingUp,
							texto: "Você ganha R$ 5,00 de cashback automaticamente"
						},
						{
							icon: Gift,
							texto: "Use o cashback como desconto nos seus pedidos"
						}
					].map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
								size: 14,
								className: "text-primary"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-gray-700",
							children: item.texto
						})]
					}, i))
				})]
			}),
			indicacoes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-white rounded-2xl border overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-5 py-4 border-b",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold text-gray-800 text-sm",
						children: "Histórico de Indicações"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "divide-y",
					children: indicacoes.map((ind) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-5 py-3.5 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-gray-800",
							children: ind.indicado_telefone
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-400",
							children: new Date(ind.created_at).toLocaleDateString("pt-BR")
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-xs font-bold px-2 py-0.5 rounded-full ${ind.status === "convertido" || ind.status === "pago" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`,
								children: ind.status === "convertido" || ind.status === "pago" ? "✓ Convertido" : "Aguardando"
							}), ind.cashback_gerado > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-green-600 font-bold mt-0.5",
								children: ["+R$ ", Number(ind.cashback_gerado).toFixed(2)]
							})]
						})]
					}, ind.id))
				})]
			})
		]
	});
}
//#endregion
export { IndicarPage as component };
