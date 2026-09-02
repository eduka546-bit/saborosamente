import { createClient } from "@supabase/supabase-js";

// This file is server-only.
// The environment variables are read inside the handler in server functions,
// but for a reusable admin client we can export a factory or a lazy-loaded instance.

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SB_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Configuração administrativa do Supabase ausente (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
