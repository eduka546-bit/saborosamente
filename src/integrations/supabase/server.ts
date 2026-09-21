import { createClient } from "@supabase/supabase-js";

// Client com service_role para uso EXCLUSIVO em server functions.
// Operações privilegiadas nunca devem cair para a chave pública.
export function createServerClient() {
  const url =
    process.env.SUPABASE_URL ??
    import.meta.env.VITE_SUPABASE_URL ??
    "https://lxcgbrovdmpjatywweiv.supabase.co";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SB_SERVICE_ROLE_KEY ??
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Configuração do servidor incompleta: SUPABASE_SERVICE_ROLE_KEY não está disponível.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
