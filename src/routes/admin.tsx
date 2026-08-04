import { createFileRoute, redirect, Outlet, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeader } from "@/components/admin-header";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    // Se for a rota de login, não redirecionamos
    if (location.pathname === "/admin/login") return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    console.log("Admin beforeLoad check", { hasSession: !!session, userId: user?.id, path: location.pathname });

    if (!user) {
      console.log("No user found, redirecting to login");
      throw redirect({
        to: "/admin/login",
      });
    }

    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    console.log("Admin role check", { roleData, error });

    if (!roleData) {
      console.log("Not an admin, signing out and redirecting");
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
  
  // O router.state.location.pathname no TanStack Router pode manter o estado da rota pai
  // Para ser mais preciso no redirecionamento e renderização:
  const isLoginPage = router.state.location.pathname.includes("/admin/login");

  if (isLoginPage) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}




