import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Mail, Phone, Fingerprint, Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
      redirect: (search.redirect as string) || "/",
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleForgotPassword = async () => {
    const emailLimpo = email.trim();
    if (!emailLimpo) {
      toast.error("Informe seu e-mail primeiro.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
        redirectTo,
      });
      if (error) throw error;

      // Resposta genérica evita revelar se o e-mail existe ou não.
      toast.success(
        "Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
      );
    } catch {
      toast.error("Não foi possível solicitar a recuperação agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setRecoveryMode(false);
      setPassword("");
      setConfirmPassword("");
      if (typeof window !== "undefined") window.location.href = "/auth";
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível alterar sua senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
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

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
              telefone,
              cpf,
              indicado_por: referral?.code,
              indicado_por_capturado_em: referral?.capturedAt,
            },
          },
        });
        if (error) throw error;
        if (typeof window !== "undefined") {
          localStorage.removeItem("saborosamente.referral");
        }
        toast.success("Cadastro realizado com sucesso!");
      }
      if (typeof window !== "undefined") {
        if (redirect && redirect !== "/") {
          window.location.href = redirect;
        } else {
          window.location.href = "/#cardapio";
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-soft">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {recoveryMode
              ? "Crie uma nova senha"
              : isLogin
                ? "Entrar na sua conta"
                : "Criar nova conta"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {recoveryMode
              ? "Escolha uma nova senha para sua conta"
              : isLogin
                ? "Use seu e-mail e sua senha para entrar"
                : "Cadastre-se para acompanhar pedidos, cashback e indicações"}
          </p>
        </div>

        <form onSubmit={recoveryMode ? handleRecovery : handleAuth} className="mt-8 space-y-4">
          {!isLogin && !recoveryMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    placeholder="Seu nome"
                    className="pl-10"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {!recoveryMode && (
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>
          )}

          {!isLogin && !recoveryMode && (
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Seu CPF"
                  className="pl-10"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">
              {recoveryMode ? "Nova senha" : isLogin ? "Senha" : "Crie uma senha"}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  recoveryMode
                    ? "Mínimo de 6 caracteres"
                    : isLogin
                      ? "Digite sua senha"
                      : "Mínimo de 6 caracteres"
                }
                minLength={6}
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={recoveryMode || !isLogin ? "new-password" : "current-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {recoveryMode && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite novamente"
                  minLength={6}
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          {isLogin && !recoveryMode && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <Button type="submit" className="w-full rounded-full py-6 font-bold" disabled={loading}>
            {loading
              ? "Processando..."
              : recoveryMode
                ? "Salvar nova senha"
                : isLogin
                  ? "Entrar"
                  : "Cadastrar"}
          </Button>
        </form>

        <div className="text-center">
          {recoveryMode ? (
            <button
              type="button"
              onClick={() => {
                setRecoveryMode(false);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-sm text-primary hover:underline font-medium"
            >
              Voltar para o login
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre agora"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
