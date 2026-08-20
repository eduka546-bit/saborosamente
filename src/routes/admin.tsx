import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // Não verifica autenticação aqui - deixa o componente fazer
    // Isso permite que o admin acesse mesmo com sessão manual via SQL
    return;
  },
  component: function AdminLayoutWrapper() {
    return <AdminLayout />;
  },
  errorComponent: function AdminErrorComponent() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-red-500 text-5xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Acesso Negado</h1>
          <p className="text-sm text-gray-500 max-w-sm">Você precisa estar autenticado para acessar o painel.</p>
          <Link to="/admin/login" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
            ← Ir para Login
          </Link>
        </div>
      </div>
    );
  },
  // Desabilitar SSR para admin para evitar hydration mismatch
  ssr: false,
});

const ADMIN_EMAIL = "anabolic.foodsbs@gmail.com";

function AdminLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        if (!session) {
          navigate({ to: "/admin/login" as any });
        }
        setLoading(false);
      }
    });

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (isMounted) {
          navigate({ to: "/admin/login" as any });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // É admin - renderiza layout
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
