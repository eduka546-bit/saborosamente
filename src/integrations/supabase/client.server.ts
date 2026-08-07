import { createClient } from '@supabase/supabase-js';

// This file is server-only. 
// The environment variables are read inside the handler in server functions,
// but for a reusable admin client we can export a factory or a lazy-loaded instance.

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SB_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuração administrativa do Supabase ausente (VITE_SUPABASE_URL ou SB_SERVICE_ROLE_KEY). Certifique-se de que a SB_SERVICE_ROLE_KEY foi adicionada aos segredos do projeto.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
