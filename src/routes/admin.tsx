import { Outlet, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login" || location.pathname === "/admin/login/") return;
  },
  component: function AdminLayoutWrapper() {
    return <AdminLayout />;
  },
  // Desabilitar SSR para admin para evitar hydration mismatch
  ssr: false,
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
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (isMounted) navigate({ to: "/admin/login" as any });
          return;
        }

        const user = session.user;

        if (user.email === ADMIN_EMAIL) {
          if (isMounted) { setIsAdmin(true); setChecking(false); }
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          if (isMounted) navigate({ to: "/" as any });
          return;
        }

        if (isMounted) { setIsAdmin(true); setChecking(false); }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (isMounted) navigate({ to: "/admin/login" as any });
      }
    }

    checkAuth();

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

  if (isLoginPage) return <Outlet />;

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

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-red-500 text-5xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
          <p className="text-sm text-gray-500 max-w-sm">Você não tem permissão para acessar o painel administrativo.</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
            ← Voltar para a Loja
          </Link>
        </div>
      </div>
    );
  }

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
