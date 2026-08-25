import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-BvgAz7YC.mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { Ct as EyeOff, St as Eye, it as Mail, st as Lock } from "../_libs/lucide-react.mjs";
import { t as Button } from "./button-DXLJOKL4.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-login-CY8uE2eh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STORAGE_KEY = "saborosamente_admin_creds";
function AdminLogin() {
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [remember, setRemember] = (0, import_react.useState)(false);
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const { email: e, password: p } = JSON.parse(saved);
				if (e) setEmail(e);
				if (p) setPassword(p);
				setRemember(true);
			}
		} catch (_) {}
	}, []);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session) navigate({ to: "/admin" });
		});
	}, []);
	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			if (error) throw error;
			const user = data.user;
			if (!(user.email === "anabolic.foodsbs@gmail.com")) {
				const { data: roleData, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
				if (roleError || !roleData) {
					await supabase.auth.signOut();
					toast.error("Acesso negado. Esta área é restrita a administradores.");
					return;
				}
			}
			if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify({
				email,
				password
			}));
			else localStorage.removeItem(STORAGE_KEY);
			toast.success("Login realizado!");
			navigate({ to: "/admin" });
		} catch (error) {
			toast.error(error.message || "E-mail ou senha incorretos.");
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
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-6 w-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-bold tracking-tight",
							children: "Acesso Administrativo"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: "Entre com suas credenciais para gerenciar a loja"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleLogin,
					className: "mt-8 space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "email",
									children: "E-mail"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "email",
										type: "email",
										placeholder: "admin@saborosamente.com",
										className: "pl-10",
										value: email,
										onChange: (e) => setEmail(e.target.value),
										autoComplete: "email",
										required: true
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "password",
									children: "Senha"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "password",
											type: showPassword ? "text" : "password",
											placeholder: "Sua senha",
											className: "pl-10 pr-10",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											autoComplete: "current-password",
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
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "remember",
								type: "checkbox",
								checked: remember,
								onChange: (e) => setRemember(e.target.checked),
								className: "h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "remember",
								className: "text-sm text-muted-foreground cursor-pointer select-none",
								children: "Lembrar minhas credenciais"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full rounded-full py-6 font-bold",
							disabled: loading,
							children: loading ? "Entrando..." : "Entrar no Painel"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-xs text-muted-foreground",
					children: "Saborosamente © 2026 — Sistema de Gestão"
				})
			]
		})
	});
}
var SplitComponent = function AdminLoginWrapper() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminLogin, {});
};
//#endregion
export { SplitComponent as component };
