import { createFileRoute, redirect, Outlet, useRouter, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }): Promise<any> => {
    console.log("Admin route beforeLoad started", location.pathname);
    
    // Se for a rota de login, não redirecionamos
    if (location.pathname === "/admin/login" || location.pathname === "/admin/login/") return;

    try {
      // Adicionando um timeout de segurança para o getSession
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), 8000));
      
      const { data: { session }, error: sessionError } = await (Promise.race([sessionPromise, timeoutPromise]) as Promise<any>);
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        return redirect({ to: "/admin/login" });
      }

      const user = session?.user;
      
      if (!user) {
        console.log("No user found, redirecting to login");
        return redirect({
          to: "/admin/login",
        });
      }

      // Verificação rápida para o admin principal
      if (user.email === "anabolic.foodsbs@gmail.com") {
        console.log("Admin authenticated by email");
        return { user, role: "admin" };
      }

      // Verificação de permissão admin no banco
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        console.error("Role check error:", roleError);
      }

      if (!roleData) {
        console.log("User is not admin, redirecting to login");
        await supabase.auth.signOut();
        return redirect({
          to: "/admin/login",
        });
      }

      console.log("Admin authenticated by role");
      return { user, role: "admin" };
    } catch (err: any) {
      if (err && typeof err === 'object' && 'to' in err) return err;
      console.error("Critical error in admin beforeLoad:", err);
      return redirect({ to: "/admin/login" });
    }
  },
  component: function AdminLayoutWrapper() {
    return <AdminLayout />;
  },
});

function AdminLayout() {
  const router = useRouter();
  const isLoginPage = router.state.location.pathname === "/admin/login" || router.state.location.pathname === "/admin/login/";
  const { role } = (Route.useRouteContext() as any) || {};
  
  if (isLoginPage) {
    return <Outlet />;
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Acesso Restrito</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
          <Link to="/admin/login" className="text-primary hover:underline font-medium">Voltar para o login</Link>
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
              router.navigate({ to: "/admin/login" });
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







