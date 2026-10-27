import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Mail, Phone, Fingerprint, Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { commerceReturnPath } from "@/lib/commerce-return-path";
import { checkCpfAlreadyRegistered } from "@/lib/signup.functions";
import { lerLeadPreCadastro } from "@/lib/lead-pre-cadastro";
import { lerTelefonePreCadastroWhatsApp } from "@/lib/whatsapp-pre-cadastro";
import { getAbandonedCartSessionId } from "@/lib/abandoned-cart-session";
import { vincularLeadPreCadastroAutenticado } from "@/lib/lead-account-link";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta | Saborosamente" },
      {
        name: "description",
        content:
          "Acesse sua conta Saborosamente para acompanhar pedidos, salvar endereços e finalizar sua compra de marmitas congeladas mais rápido.",
      },
      { property: "og:title", content: "Entrar ou criar conta | Saborosamente" },
      {
        property: "og:description",
        content:
          "Entre na sua conta Saborosamente e finalize seu pedido de marmitas congeladas em poucos cliques.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: commerceReturnPath(search.redirect),
      confirmed: search.confirmed === "1" || search.confirmed === true,
      mode: search.mode === "signup" || search.mode === "login" || search.mode === "reset" ? search.mode : undefined,
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const { redirect, confirmed, mode } = Route.useSearch();
  const checkCpfFn = useServerFn(checkCpfAlreadyRegistered);

  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [recoveryLinkStatus, setRecoveryLinkStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  // Cadastro de visitante no sorteio: apresenta a criação de conta com
  // os campos que ele já preencheu, sem considerar o lead uma conta ativa.
  useEffect(() => {
    const lead = lerLeadPreCadastro();
    if (lead) {
      setNome(lead.nome);
      setTelefone(lead.telefone);
      if (!confirmed && mode !== "login") setIsLogin(false);
      return;
    }
    // Se o visitante só informou WhatsApp no carrinho, já preenche o
    // telefone, sem inventar nome e sem considerar uma conta criada.
    const telefoneDoCarrinho = lerTelefonePreCadastroWhatsApp();
    if (telefoneDoCarrinho) setTelefone((atual) => atual || telefoneDoCarrinho);
  }, [confirmed, mode]);

  // Se chegou ao login com itens no carrinho, conserva o e-mail digitado
  // como contato NÃO VERIFICADO do rascunho, sem conceder autorização comercial.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
    if (!window.localStorage.getItem("saborosamente.session_id")) return;
    let canceled = false;
    const timer = window.setTimeout(async () => {
      for (let attempt = 0; attempt < 2 && !canceled; attempt++) {
        const { data, error } = await supabase.rpc("capture_checkout_identity", {
          p_session_id: getAbandonedCartSessionId(),
          p_email: value,
          p_nome: null,
          p_telefone: null,
        });
        if (error || data) break;
        if (!canceled && attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 1400));
      }
    }, 900);
    return () => { canceled = true; window.clearTimeout(timer); };
  }, [email]);

  const senhaValida = (value: string) => value.length > 0;

  const irAposLogin = () => {
    if (typeof window === "undefined") return;
    if (redirect && redirect !== "/") window.location.href = redirect;
    else window.location.href = "/#cardapio";
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordChangeRequired(true);
        setRecoveryLinkStatus("ready");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Abre o formulario dedicado mesmo quando o Supabase ja processou o link.
  useEffect(() => {
    if (mode !== "reset") return;
    let active = true;
    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        setRecoveryLinkStatus((current) =>
          current === "ready" ? current : !error && data.session ? "ready" : "invalid"
        );
      })
      .catch(() => {
        if (active) setRecoveryLinkStatus((current) => current === "ready" ? current : "invalid");
      });
    return () => { active = false; };
  }, [mode]);

  useEffect(() => {
    if (!confirmed) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        toast.success("E-mail confirmado com sucesso!");
        irAposLogin();
      }
    });
  }, [confirmed]);

  const handleForgotPassword = async () => {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado || !emailNormalizado.includes("@")) {
      toast.error("Informe seu e-mail para recuperar a senha.");
      return;
    }
    setLoading(true);
    try {
      const redirectTo = "https://saborosamente.com/auth?mode=reset";
      const { error } = await supabase.auth.resetPasswordForEmail(emailNormalizado, {
        redirectTo,
      });
      if (error) throw error;
      toast.success(
        "Se houver uma conta com este e-mail, você receberá um link para criar uma nova senha.",
      );
    } catch (error: any) {
      toast.error(error.message || "Não foi possível enviar o link de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaValida(newPassword)) {
      toast.error("Informe a nova senha.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada com segurança.");
      irAposLogin();
    } catch (error: any) {
      toast.error(error.message || "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data: loginData, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;

        // Contas antigas usavam CPF como senha. Permitimos o login uma última vez,
        // mas exigimos a troca antes de continuar navegando.
        const { data: profile } = await supabase
          .from("profiles")
          .select("cpf")
          .eq("id", loginData.user.id)
          .maybeSingle();
        const cpfSalvo = String((profile as any)?.cpf ?? "").replace(/\D/g, "");
        const senhaDigitada = password.replace(/\D/g, "");
        if (/^\d{11}$/.test(password) && cpfSalvo && senhaDigitada === cpfSalvo) {
          setPasswordChangeRequired(true);
          setPassword("");
          toast.info("Por segurança, crie uma nova senha antes de continuar.");
          return;
        }

        // Se for a mesma pessoa que se inscreveu no pop-up, o backend
        // confirma telefone + sessão antes de associar o lead.
        await vincularLeadPreCadastroAutenticado();
        toast.success("Bem-vindo de volta!");
      } else {
        const cpfNormalizado = cpf.replace(/\D/g, "");
        if (cpfNormalizado.length !== 11) {
          toast.error("Informe um CPF válido com 11 dígitos.");
          return;
        }
        if (!senhaValida(password)) {
          toast.error("Informe uma senha.");
          return;
        }

        let referral: { code?: string; capturedAt?: string; expiresAt?: number } | null = null;
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("saborosamente.referral");
            const parsed = raw ? JSON.parse(raw) : null;
            if (
              parsed?.code &&
              parsed?.capturedAt &&
              Number(parsed?.expiresAt) > Date.now() &&
              /^IND-[A-Z0-9]{5,12}$/.test(String(parsed.code))
            ) {
              referral = parsed;
            } else if (raw) {
              localStorage.removeItem("saborosamente.referral");
            }
          } catch {
            localStorage.removeItem("saborosamente.referral");
          }
        }

        const cpfCheck = await checkCpfFn({ data: { cpf: cpfNormalizado } });
        if (cpfCheck?.exists) {
          setIsLogin(true);
          setPassword("");
          setConfirmNewPassword("");
          toast.error(
            "Este CPF já possui uma conta. Entre na conta existente ou use “Esqueci minha senha”.",
          );
          return;
        }

        const emailRedirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth?confirmed=1&redirect=${encodeURIComponent(redirect)}`
            : undefined;
        const { data: signupData, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo,
            data: {
              nome,
              telefone,
              cpf: cpfNormalizado,
              indicado_por: referral?.code,
              indicado_por_capturado_em: referral?.capturedAt,
            },
          },
        });
        if (error) throw error;
        if (typeof window !== "undefined") {
          localStorage.removeItem("saborosamente.referral");
        }

        if (!signupData.session) {
          setIsLogin(true);
          setPassword("");
          setConfirmNewPassword("");
          toast.success("Cadastro realizado! Confira seu e-mail para confirmar sua conta.");
          return;
        }

        await vincularLeadPreCadastroAutenticado();
        toast.success("Cadastro realizado com sucesso!");
      }
      irAposLogin();
    } catch (error: any) {
      const message = String(error?.message || "");
      if (/database error saving new user/i.test(message)) {
        toast.error(
          "Não foi possível concluir o cadastro. Verifique se CPF ou e-mail já possuem uma conta.",
        );
      } else {
        toast.error(message || "Erro na autenticação");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-background px-3 py-5 sm:px-4 sm:py-12">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-8">
        <div className="text-center">
          {!(mode === "reset" || passwordChangeRequired) && (isLogin ? (
            <p className="text-base text-muted-foreground">
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(false); setPassword(""); }}
                className="font-bold text-primary underline underline-offset-4"
              >
                Cadastre-se clicando aqui
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => { setIsLogin(true); setPassword(""); }}
              className="text-base font-medium text-primary hover:underline"
            >
              Já tem uma conta? Entre agora
            </button>
          ))}
          <h2 className="text-2xl font-bold tracking-normal">
            {mode === "reset" || passwordChangeRequired ? "Criar nova senha" : isLogin ? "Entrar na sua conta" : "Criar nova conta"}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            {mode === "reset" || passwordChangeRequired
              ? "Escolha e confirme uma nova senha para acessar sua conta."
              : isLogin
                ? "Entre com seu e-mail e sua senha"
                : "Crie sua conta para comprar e acompanhar seus pedidos"}
          </p>
          {isLogin && mode !== "reset" && !passwordChangeRequired && (
            <div className="mt-4 rounded-2xl border border-[#b9d6b8] bg-[#f1f8ed] px-4 py-3 text-left text-sm leading-relaxed text-[#315440] shadow-sm">
              <strong className="block text-[#075d3a]">Já possuía cadastro no site antigo?</strong>
              Seu login é seu e-mail e a senha é seu CPF. Após o primeiro login, você poderá alterar a senha.
            </div>
          )}
          {!isLogin && mode !== "reset" && !passwordChangeRequired && (nome.trim() || telefone.trim()) && lerLeadPreCadastro() && (
            <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
              Nome e WhatsApp preenchidos a partir do seu pré-cadastro. Confira os dados e complete e-mail, CPF e senha.
            </p>
          )}
        </div>

        {mode === "reset" && recoveryLinkStatus === "checking" ? (
          <p role="status" className="py-8 text-center text-muted-foreground">Validando seu link de recuperação...</p>
        ) : mode === "reset" && recoveryLinkStatus === "invalid" ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-base text-destructive">O link de recuperação está inválido ou expirou.</p>
            <p className="text-sm text-muted-foreground">Solicite um novo link em “Esqueci minha senha” na página de acesso.</p>
            <a href="/auth" className="inline-block font-semibold text-primary underline underline-offset-4">Voltar ao acesso</a>
          </div>
        ) : passwordChangeRequired || mode === "reset" ? (
          <form onSubmit={handlePasswordChange} className="mt-8 space-y-4">
            <div className="rounded-2xl bg-primary/5 p-4 text-base text-foreground">
              Para proteger sua conta, defina uma senha nova que não seja seu CPF.
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="new-password">Nova senha</Label>
              <Input
                className="h-11 text-base md:text-base"
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Digite sua nova senha"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base" htmlFor="confirm-new-password">Confirmar nova senha</Label>
              <Input
                className="h-11 text-base md:text-base"
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 font-bold" disabled={loading}>
              {loading ? "Salvando..." : "Atualizar senha"}
            </Button>
          </form>
        ) : (
        <form onSubmit={handleAuth} className="mt-4 space-y-3 sm:space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label className="text-base" htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input

                    id="nome"
                    placeholder="Seu nome"
                    className="h-11 text-base md:text-base pl-10"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-base" htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input

                    id="telefone"
                    placeholder="(00) 00000-0000"
                    className="h-11 text-base md:text-base pl-10"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-base" htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input

                id="email"
                type="email"
                placeholder="seu@email.com"
                className="h-11 text-base md:text-base pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-base" htmlFor="cpf">CPF</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input

                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Seu CPF"
                  className="h-11 text-base md:text-base pl-10"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-base" htmlFor="password">{isLogin ? "Senha" : "Crie sua senha"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input

                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Sua senha" : "Crie sua senha"}
                className="h-11 text-base md:text-base pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            )}
          </div>

          <Button type="submit" className="w-full rounded-full py-6 font-bold" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>
        </form>
        )}

      </div>
    </div>
  );
}
