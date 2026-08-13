import { createClient } from '@supabase/supabase-js';

// Client com service_role para uso EXCLUSIVO em server functions (não expor ao browser)
// Bypassa RLS — usar apenas para operações server-side confiáveis
export function createServerClient() {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    // Fallback para anon key se service_role não estiver configurada
    console.warn('[server] SUPABASE_SERVICE_ROLE_KEY not set, falling back to anon key');
    return createClient(url, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
