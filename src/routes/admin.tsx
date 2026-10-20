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
const ACCESS_CHECK_TIMEOUT_MS = 12000;

// Supabase pode segurar um lock de auth durante refresh/sign-in. Não permitir
// que uma verificação sem resposta deixe a UI indefinidamente no spinner.
async function comTempoLimite<T>(query: PromiseLike<T>, etapa: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Tempo excedido ao ${etapa}. Tente novamente.`)),
          ACCESS_CHECK_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function AdminLayout() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [accessError, setAccessError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    let latestCheck = 0;
    const scheduledChecks = new Set<ReturnType<typeof setTimeout>>();

    const verificarAcesso = async (sessionHint?: Session | null) => {
      const checkId = ++latestCheck;
      if (!mounted) return;

      setAuthState((current) => current === "authorized" && sessionHint !== null ? current : "checking");
      setAccessError("");

      try {
        // Eventos de auth já fornecem a sessão. Evitamos getSession() redundante
        // durante o lock interno do Supabase, principalmente ao renovar token.
        let session = sessionHint;
        if (session === undefined) {
          const { data, error } = await comTempoLimite(
            supabase.auth.getSession(),
            "verificar a sessão",
          );
          if (error) throw error;
          session = data.session;
        }
        if (!mounted || checkId !== latestCheck) return;
        if (!session?.user) {
          setAuthState("unauthorized");
          return;
        }

        const { data: roleData, error } = await comTempoLimite(
          supabase.from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle(),
          "verificar as permissões",
        );
        if (!mounted || checkId !== latestCheck) return;
        if (error) throw error;
        setAuthState(roleData ? "authorized" : "unauthorized");
      } catch (error) {
        if (!mounted || checkId !== latestCheck) return;
        console.error("Falha ao verificar acesso administrativo:", error);
        setAccessError(error instanceof Error ? error.message : "Falha temporária na verificação.");
        // Erro de rede/timeout não equivale a permissão negada.
        setAuthState("error");
      }
    };

    void verificarAcesso();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // CRÍTICO: nunca consultar Supabase sincronamente dentro do callback.
      // O callback roda sob o lock de auth e outra chamada pode bloquear para sempre.
      if (!["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) return;
      const timer = setTimeout(() => {
        scheduledChecks.delete(timer);
        if (mounted) void verificarAcesso(session);
      }, 0);
      scheduledChecks.add(timer);
    });

    return () => {
      mounted = false;
      latestCheck++;
      subscription.unsubscribe();
      for (const timer of scheduledChecks) clearTimeout(timer);
      scheduledChecks.clear();
    };
  }, [retryKey]);

  // Só redireciona para login com ausência de sessão ou role realmente negada.
  useEffect(() => {
    if (authState === "unauthorized") {
      navigate({ to: "/admin-login" as any, replace: true });
    }
  }, [authState, navigate]);

  if (authState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div role="alert" className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#174c34]">Não foi possível verificar seu acesso</h2>
          <p className="mt-2 text-sm text-gray-600">
            A verificação demorou mais que o esperado ou ocorreu uma falha temporária.
            Nenhuma informação foi alterada.
          </p>
          {accessError && <p className="mt-2 break-words text-xs text-amber-800">{accessError}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => { setAuthState("checking"); setRetryKey((key) => key + 1); }}
              className="rounded-xl bg-[#086e45] px-4 py-2.5 text-sm font-semibold text-white">
              Tentar novamente
            </button>
            <button type="button" onClick={() => navigate({ to: "/" })}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">
              Voltar à loja
            </button>
          </div>
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
