import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // Se for a rota de login, não redirecionamos
    if (location.pathname === "/admin/login") return;

    // getSession() já busca do localStorage se existir, mantendo a persistência automática do Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      throw redirect({
        to: "/admin/login",
      });
    }

    // Verificação de permissão admin
    // No preview, se estivermos logados com o email do admin ou tivermos a role no banco
    if (user.email === "anabolic.foodsbs@gmail.com") {
      return { user, role: "admin" };
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw redirect({
        to: "/admin/login",
      });
    }

    return { user, role: "admin" };
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







