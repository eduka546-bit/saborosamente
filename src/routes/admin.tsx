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

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      throw redirect({
        to: "/admin/login",
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const isLoginPage = router.state.location.pathname === "/admin/login";

  console.log("AdminLayout rendering", { isLoginPage, path: router.state.location.pathname });

  if (isLoginPage) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 border-4 border-red-500">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 border-4 border-green-500">
      <AdminHeader />
      <div className="bg-purple-900 text-white p-4">DEBUG: ADMIN HEADER SHOULD BE ABOVE</div>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}



