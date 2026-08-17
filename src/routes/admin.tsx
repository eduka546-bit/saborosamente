import { createFileRoute, Outlet, useRouter, Link, useNavigate } from "@tanstack/react-router";
import { Outlet, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  // beforeLoad roda no servidor (SSR) onde localStorage não existe,
  // por isso não verificamos sessão aqui — fazemos isso no componente (client-side).
  beforeLoad: async ({ location }) => {
    // Só deixa passar — a guarda real está no AdminLayout abaixo
    if (location.pathname === "/admin/login" || location.pathname === "/admin/login/") return;
  },
  component: function AdminLayoutWrapper() {
    return <AdminLayout />;
  },
});

const ADMIN_EMAIL = "anabolic.foodsbs@gmail.com";

function AdminLayout() {
  const router = useRouter();
  const navigate = useNavigate();
  const isLoginPage =
    router.state.location.pathname === "/admin/login" ||
    router.state.location.pathname === "/admin/login/";

  const [checking, setChecking] = useState(!isLoginPage);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;

    let isMounted = true;

    async function checkAuth() {
      try {
        // Lê sessão do localStorage (client-side, funciona no browser)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (isMounted) navigate({ to: "/admin/login" as any });
          return;
        }

        const user = session.user;

        // Shortcut para o admin principal
        if (user.email === ADMIN_EMAIL) {
          if (isMounted) { setIsAdmin(true); setChecking(false); }
          return;
        }

        // Verifica role no banco
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          await supabase.auth.signOut();
          if (isMounted) navigate({ to: "/admin/login" as any });
          return;
        }

        if (isMounted) { setIsAdmin(true); setChecking(false); }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (isMounted) navigate({ to: "/admin/login" as any });
      }
    }

    checkAuth();

    // Escuta mudanças de estado de autenticação (logout, token expirado, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (isMounted) navigate({ to: "/admin/login" as any });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage]);

  // Página de login — sem guarda
  if (isLoginPage) return <Outlet />;

  // Verificando sessão — spinner enquanto lê o localStorage
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-gray-500">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Sem permissão (não deve chegar aqui normalmente, o navigate já redireciona)
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20">
              <Store size={20} />
            </div>
            <span className="font-bold text-sm uppercase tracking-wider">Voltar para a Loja</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-600 gap-2"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/admin/login" as any });
            }}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
