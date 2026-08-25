import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  beforeLoad: async ({ location }) => {
    // Sempre permite acesso à página de login
    return;
  },
  component: function AdminLoginWrapper() {
    return <AdminLogin />;
  },
  ssr: false,
});

const STORAGE_KEY = "saborosamente_admin_creds";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Carrega credenciais salvas ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { email: e, password: p } = JSON.parse(saved);
        if (e) setEmail(e);
        if (p) setPassword(p);
        setRemember(true);
      }
    } catch (_) {/* ignora */}
  }, []);

  // Se já tem sessão ativa, vai direto pro painel
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/admin" as any });
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;

      // Shortcut para admin principal
      const isMainAdmin = user.email === "anabolic.foodsbs@gmail.com";

      if (!isMainAdmin) {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError || !roleData) {
          await supabase.auth.signOut();
          toast.error("Acesso negado. Esta área é restrita a administradores.");
          return;
        }
      }

      // Salva ou limpa credenciais conforme checkbox
      if (remember) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      toast.success("Login realizado!");
      navigate({ to: "/admin" as any });
    } catch (error: any) {
      toast.error(error.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-soft">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Acesso Administrativo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com suas credenciais para gerenciar a loja
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@saborosamente.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
          </div>

          {/* Lembrar senha */}
          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
              Lembrar minhas credenciais
            </label>
          </div>

          <Button type="submit" className="w-full rounded-full py-6 font-bold" disabled={loading}>
            {loading ? "Entrando..." : "Entrar no Painel"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Saborosamente &copy; 2026 — Sistema de Gestão
        </p>
      </div>
    </div>
  );
}
