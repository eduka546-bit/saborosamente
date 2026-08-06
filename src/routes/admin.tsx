import { createFileRoute, redirect, Outlet, useRouter, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
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
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const isLoginPage = router.state.location.pathname === "/admin/login" || router.state.location.pathname === "/admin/login/";
  const { role } = Route.useRouteContext() || {};
  
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
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}







