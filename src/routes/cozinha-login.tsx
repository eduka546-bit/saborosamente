import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ChefHat, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cozinha-login")({
  component: CozinhaLogin,
  ssr: false,
});

function CozinhaLogin() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/cozinha" as any, replace: true });
    });
  }, [navigate]);

  const entrar = async (event: React.FormEvent) => {
    event.preventDefault();
    setCarregando(true);
    try {
      const email = usuario.trim().toLowerCase() === "cozinhasaborosa"
        ? "cozinha@saborosamente.com"
        : usuario.trim();
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      navigate({ to: "/cozinha" as any, replace: true });
    } catch {
      toast.error("Usuário ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f0] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#dfe7dd] bg-white p-8 shadow-xl shadow-[#0b6e4f]/10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#087443] text-white">
          <ChefHat size={32} />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#164a37]">Cozinha Saborosa</h1>
          <p className="mt-2 text-sm text-[#62766b]">Produção, ingredientes e estoque da cozinha</p>
        </div>
        <form onSubmit={entrar} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cozinha-usuario">Usuário</Label>
            <Input id="cozinha-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Seu usuário" autoComplete="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cozinha-senha">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="cozinha-senha" type={mostrarSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} className="pl-10 pr-10" autoComplete="current-password" required />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-3 text-muted-foreground">
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-[#087443] hover:bg-[#075e38]" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar na cozinha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
