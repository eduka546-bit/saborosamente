import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    console.log("Admin route beforeLoad started", location.pathname);
    
    // Se for a rota de login, não redirecionamos
    if (location.pathname === "/admin/login") return;

    try {
      // Adicionando um timeout de segurança para o getSession
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase timeout")), 8000));
      
      const { data: { session }, error: sessionError } = await (Promise.race([sessionPromise, timeoutPromise]) as Promise<any>);
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw redirect({ to: "/admin/login" });
      }

      const user = session?.user;
      
      if (!user) {
        console.log("No user found, redirecting to login");
        throw redirect({
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
        throw redirect({
          to: "/admin/login",
        });
      }

      console.log("Admin authenticated by role");
      return { user, role: "admin" };
    } catch (err) {
      if (err instanceof Error && 'to' in err) throw err; // Re-throw redirects
      console.error("Critical error in admin beforeLoad:", err);
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}







