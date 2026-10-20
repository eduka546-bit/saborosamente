import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AdminWhatsappAlerts } from "@/components/admin-whatsapp-alerts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow, noarchive" }],
  }),
  component: function AdminLayoutWrapper() {
    return <AdminLayout />;
  },
  ssr: false,
});

type AuthState = "checking" | "authorized" | "unauthorized" | "error";

function AdminLayout() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const controllers = new Set<AbortController>();

    // Recebe a sessão emitida pelo Supabase, evitando chamar getSession()
    // dentro de onAuthStateChange (que roda sob o lock interno de Auth).
    const verificarAcesso = async (session: Session | null, currentRevision: number) => {
      if (!session?.user) {
        if (active && currentRevision === revision) setAuthState("unauthorized");
        return;
      }

      const controller = new AbortController();
      controllers.add(controller);
      const timeout = window.setTimeout(() => controller.abort(), 10_000);
      try {
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .abortSignal(controller.signal)
          .maybeSingle();

        if (!active || currentRevision !== revision) return;
        if (error) {
          console.warn("[admin] Não foi possível verificar a permissão de acesso:", error);
          setAuthState("error");
          return;
        }
        setAuthState(roleData ? "authorized" : "unauthorized");
      } catch (error) {
        if (!active || currentRevision !== revision) return;
        console.warn("[admin] Falha na verificação de acesso:", error);
        setAuthState("error");
      } finally {
        window.clearTimeout(timeout);
        controllers.delete(controller);
      }
    };

    // INITIAL_SESSION chega também na primeira abertura. Qualquer consulta
    // ao banco precisa acontecer fora do callback para não bloquear o auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentRevision = ++revision;
      if (event === "SIGNED_OUT" || !session) {
        if (active) setAuthState("unauthorized");
        return;
      }

      if (active) setAuthState("checking");
      window.setTimeout(() => {
        if (active && currentRevision === revision) {
          void verificarAcesso(session, currentRevision);
        }
      }, 0);
    });

    // Se nem INITIAL_SESSION for emitido (ex.: restauração de sessão travada),
    // mostre um caminho de recuperação, sem liberar o painel indevidamente.
    const initialTimeout = window.setTimeout(() => {
      if (active) setAuthState((prev) => prev === "checking" ? "error" : prev);
    }, 12_000);

    return () => {
      active = false;
      revision += 1;
      window.clearTimeout(initialTimeout);
      controllers.forEach((controller) => controller.abort());
      subscription.unsubscribe();
    };
  }, [retryCount]);

  useEffect(() => {
    if (authState === "unauthorized") {
      void navigate({ to: "/admin-login" as any, replace: true });
    }
  }, [authState, navigate]);

  if (authState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div role="alert" className="w-full max-w-sm rounded-2xl border border-[#c9ddcf] bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-[#075636]">Demora na verificação de acesso</h1>
          <p className="mt-2 text-sm text-gray-600">
            Não foi possível confirmar sua sessão e permissão de administrador.
            Seus pedidos e informações permanecem salvos.
          </p>
          <button
            type="button"
            onClick={() => { setAuthState("checking"); setRetryCount((count) => count + 1); }}
            className="mt-5 min-h-11 w-full rounded-xl bg-[#086e45] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#075636]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

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
      <AdminWhatsappAlerts />
    </div>
  );
}
