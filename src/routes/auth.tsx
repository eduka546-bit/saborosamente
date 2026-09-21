import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
        const senhaCpf = cpf.replace(/\D/g, "");
        if (senhaCpf.length !== 11) {
          toast.error("Informe um CPF válido com 11 dígitos.");
          setLoading(false);
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

        const { error } = await supabase.auth.signUp({
          email,
          password: senhaCpf,
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
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword("");
            }}
            className="text-sm text-primary hover:underline font-medium"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre agora"}
          </button>
        </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isLogin ? "Entrar na sua conta" : "Criar nova conta"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? "O login é seu e-mail e a senha é o seu CPF cadastrado"
              : "Cadastre-se para acompanhar pedidos, cashback e indicações"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="mt-8 space-y-4">
          {!isLogin && (
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

          {!isLogin && (
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

          {isLogin && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha (seu CPF)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Digite seu CPF, somente números"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  autoComplete="current-password"
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
              <p className="text-xs text-muted-foreground">
                Sua senha padrão é o CPF cadastrado, somente números.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full rounded-full py-6 font-bold" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
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
