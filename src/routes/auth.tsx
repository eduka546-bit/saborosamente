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
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const { redirect, confirmed } = Route.useSearch();
  const checkCpfFn = useServerFn(checkCpfAlreadyRegistered);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
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
    if (!lead) return;
    setNome(lead.nome);
    setTelefone(lead.telefone);
    if (!confirmed) setIsLogin(false);
  }, [confirmed]);

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
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
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
        if (password !== confirmPassword) {
          toast.error("As senhas não conferem.");
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
          setConfirmPassword("");
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
          setConfirmPassword("");
          toast.success("Cadastro realizado! Confira seu e-mail para confirmar sua conta.");
          return;
        }

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
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-soft">
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-base text-primary hover:underline font-medium"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre agora"}
          </button>
          <h2 className="text-2xl font-bold tracking-normal">
            {isLogin ? "Entrar na sua conta" : "Criar nova conta"}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            {isLogin
              ? "Entre com seu e-mail e sua senha"
              : "Cadastre-se para acompanhar pedidos, cashback e indicações"}
          </p>
          {!isLogin && (nome.trim() || telefone.trim()) && lerLeadPreCadastro() && (
            <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
              Nome e WhatsApp preenchidos a partir do seu pré-cadastro. Confira os dados e complete e-mail, CPF e senha.
            </p>
          )}
        </div>

        {passwordChangeRequired ? (
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
        <form onSubmit={handleAuth} className="mt-8 space-y-4">
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
            <Label className="text-base" htmlFor="password">{isLogin ? "Senha" : "Crie uma senha"}</Label>
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

          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-base" htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                className="h-11 text-base md:text-base"
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full rounded-full py-6 font-bold" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>
        </form>
        )}

      </div>
    </div>
  );
}
