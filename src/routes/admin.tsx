import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: function AdminLayoutWrapper() {
    return <AdminLayout />;
  },
  ssr: false,
});

// E-mail do administrador principal (atalho, além da checagem em user_roles)
const MAIN_ADMIN_EMAIL = "anabolic.foodsbs@gmail.com";

type AuthState = "checking" | "authorized" | "unauthorized";

function AdminLayout() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    let active = true;

    const verificarAcesso = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (active) setAuthState("unauthorized");
        return;
      }

      // Atalho para o admin principal
      if (session.user.email === MAIN_ADMIN_EMAIL) {
        if (active) setAuthState("authorized");
        return;
      }

      // Checa a role de admin na tabela user_roles
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (active) setAuthState(error || !roleData ? "unauthorized" : "authorized");
    };

    verificarAcesso();

    // Revalida se a sessão mudar (logout em outra aba, expiração, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      verificarAcesso();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Redireciona para o login quando não autorizado
  useEffect(() => {
    if (authState === "unauthorized") {
      navigate({ to: "/admin-login" as any, replace: true });
    }
  }, [authState, navigate]);

  if (authState !== "authorized") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">
            {authState === "checking" ? "Verificando acesso..." : "Redirecionando para o login..."}
          </p>
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
