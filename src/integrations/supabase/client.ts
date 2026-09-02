import { createClient } from "@supabase/supabase-js";

// URL e chave publicável podem existir no bundle do navegador. As variáveis
// continuam tendo prioridade, mas estes fallbacks evitam depender de um .env
// versionado (a service_role nunca deve aparecer aqui).
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://lxcgbrovdmpjatywweiv.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_g8rvhJQtps_agL3lH6amzg_ipC9OWpC";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sb-lxcgbrovdmpjatywweiv-auth-token",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
