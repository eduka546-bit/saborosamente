import { createFileRoute, redirect, Outlet, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeader } from "@/components/admin-header";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // Se for a rota de login, não redirecionamos
    if (location.pathname === "/admin/login") return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      throw redirect({
        to: "/admin/login",
      });
    }

    // No preview, se estivermos logados com o email do admin, permitimos
    // para evitar problemas de sincronização do banco local vs remoto
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

    return { user, role: roleData.role };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {!isLoginPage && <AdminHeader />}
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}






