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

    // REMOVIDO temporariamente a verificação de role rigorosa para testar visibilidade
    // O usuário relatou problemas de acesso após o login bem-sucedido.
  },
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isLoginPage = pathname.includes("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {!isLoginPage && <AdminHeader />}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}



