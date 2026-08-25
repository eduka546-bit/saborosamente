import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { It as CircleQuestionMark, Kt as ChevronDown, U as Phone, Ut as ChevronUp, it as Mail } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fale-conosco-Blfo9ERr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FaleConoscoPage() {
	const [openFaq, setOpenFaq] = (0, import_react.useState)(null);
	const { data: settings } = useQuery({
		queryKey: ["site-settings"],
		queryFn: async () => {
			const { data } = await supabase.from("site_settings").select("*").maybeSingle();
			return data;
		}
	});
	const { data: faqs = [] } = useQuery({
		queryKey: ["faq-public"],
		queryFn: async () => {
			const { data, error } = await supabase.from("faq").select("*").eq("ativo", true).order("ordem");
			if (error) throw error;
			return data;
		}
	});
	const whatsapp = settings?.contato_whatsapp || settings?.footer_whatsapp || "5547991507757";
	const instagram = settings?.contato_instagram || settings?.footer_instagram || "saborosamente.sbs";
	const email = settings?.contato_email || "";
	const waUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=Olá! Gostaria de tirar uma dúvida.`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-4 py-14 space-y-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-4xl font-extrabold text-[#086e45]",
					children: "Fale Conosco"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground text-base max-w-xl mx-auto",
					children: "Estamos aqui para ajudar. Confira as dúvidas frequentes ou entre em contato diretamente."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: waUrl,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "flex flex-col items-center gap-3 rounded-2xl bg-green-500 hover:bg-green-600 p-6 text-white transition-all hover:scale-[1.02] shadow-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-12 w-12 rounded-full bg-white/20 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								viewBox: "0 0 24 24",
								fill: "currentColor",
								className: "size-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-sm",
								children: "WhatsApp"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-white/80 mt-0.5",
								children: "Resposta rápida"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `https://instagram.com/${instagram.replace("@", "")}`,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:opacity-90 p-6 text-white transition-all hover:scale-[1.02] shadow-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-12 w-12 rounded-full bg-white/20 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "2",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								className: "size-6",
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
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-sm",
								children: "Instagram"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-white/80 mt-0.5",
								children: ["@", instagram.replace("@", "")]
							})]
						})]
					}),
					email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: `mailto:${email}`,
						className: "flex flex-col items-center gap-3 rounded-2xl bg-[#086e45] hover:bg-[#065a38] p-6 text-white transition-all hover:scale-[1.02] shadow-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-12 w-12 rounded-full bg-white/20 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "size-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-sm",
								children: "E-mail"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-white/80 mt-0.5 truncate max-w-[120px]",
								children: email
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-3 rounded-2xl bg-gray-100 p-6 text-gray-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-bold text-sm text-gray-500",
								children: "Horário"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs mt-0.5",
								children: "Encomendas 24h"
							})]
						})]
					})
				]
			}),
			faqs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, {
						size: 22,
						className: "text-[#086e45]"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-bold text-[#086e45]",
						children: "Perguntas Frequentes"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: faqs.map((faq) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-white shadow-soft overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setOpenFaq(openFaq === faq.id ? null : faq.id),
							className: "w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: faq.pergunta }), openFaq === faq.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
								size: 18,
								className: "text-[#086e45] shrink-0"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
								size: 18,
								className: "text-gray-400 shrink-0"
							})]
						}), openFaq === faq.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4",
							children: faq.resposta
						})]
					}, faq.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-3xl bg-[#086e45] p-8 text-white text-center space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold text-lg",
						children: "Não encontrou o que procurava?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-white/80 text-sm",
						children: "Fale diretamente com a gente no WhatsApp. Respondemos rápido!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: waUrl,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex items-center gap-2 bg-white text-[#086e45] font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							viewBox: "0 0 24 24",
							fill: "currentColor",
							className: "size-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" })
						}), "Falar no WhatsApp"]
					})
				]
			})
		]
	});
}
//#endregion
export { FaleConoscoPage as component };
