import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { Ct as EyeOff, St as Eye, U as Phone, it as Mail, l as User, st as Lock, yt as FingerprintPattern } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Route } from "./auth-U_Md0jE_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-Bg1CyjrV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPage() {
	const { redirect } = Route.useSearch();
	const [isLogin, setIsLogin] = (0, import_react.useState)(true);
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [nome, setNome] = (0, import_react.useState)("");
	const [telefone, setTelefone] = (0, import_react.useState)("");
	const [cpf, setCpf] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const handleAuth = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (isLogin) {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (error) throw error;
				toast.success("Bem-vindo de volta!");
			} else {
				const { error } = await supabase.auth.signUp({
					email,
					password,
					options: { data: {
						nome,
						telefone,
						cpf
					} }
				});
				if (error) throw error;
				toast.success("Cadastro realizado com sucesso!");
			}
			if (typeof window !== "undefined") if (redirect && redirect !== "/") window.location.href = redirect;
			else window.location.href = "/#cardapio";
		} catch (error) {
			toast.error(error.message || "Erro na autenticação");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-[calc(100vh-200px)] items-center justify-center bg-background px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-soft",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "h-6 w-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-bold tracking-tight",
							children: isLogin ? "Entrar na sua conta" : "Criar nova conta"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: isLogin ? "O login é seu e-mail e a senha o seu CPF cadastrado" : "Cadastre-se para acompanhar seus pedidos"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleAuth,
					className: "mt-8 space-y-4",
					children: [
						!isLogin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "nome",
								children: "Nome Completo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "nome",
									placeholder: "Seu nome",
									className: "pl-10",
									value: nome,
									onChange: (e) => setNome(e.target.value),
									required: true
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "telefone",
								children: "Telefone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "telefone",
									placeholder: "(00) 00000-0000",
									className: "pl-10",
									value: telefone,
									onChange: (e) => setTelefone(e.target.value),
									required: true
								})]
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "email",
								children: "E-mail"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "email",
									type: "email",
									placeholder: "seu@email.com",
									className: "pl-10",
									value: email,
									onChange: (e) => setEmail(e.target.value),
									autoComplete: "email",
									required: true
								})]
							})]
						}),
						!isLogin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "cpf",
								children: "CPF"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FingerprintPattern, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "cpf",
									type: "text",
									inputMode: "numeric",
									pattern: "[0-9]*",
									placeholder: "Seu CPF",
									className: "pl-10",
									value: cpf,
									onChange: (e) => setCpf(e.target.value.replace(/\D/g, "")),
									required: true
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								children: isLogin ? "Senha (Seu CPF)" : "Senha (Crie sua senha)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "password",
										type: showPassword ? "text" : "password",
										inputMode: "numeric",
										pattern: "[0-9]*",
										placeholder: isLogin ? "Digite seu CPF" : "Apenas números",
										className: "pl-10 pr-10",
										value: password,
										onChange: (e) => {
											const val = e.target.value.replace(/\D/g, "");
											setPassword(val);
											if (!isLogin) setCpf(val);
										},
										autoComplete: isLogin ? "current-password" : "new-password",
										required: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setShowPassword(!showPassword),
										className: "absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors",
										tabIndex: -1,
										children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full rounded-full py-6 font-bold",
							disabled: loading,
							children: loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setIsLogin(!isLogin),
						className: "text-sm text-primary hover:underline font-medium",
						children: isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre agora"
					})
				})
			]
		})
	});
}
//#endregion
export { AuthPage as component };
