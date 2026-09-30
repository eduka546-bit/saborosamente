import { supabase } from "@/integrations/supabase/client";

export async function getPublicSiteSettings() {
  const { data, error } = await supabase.rpc("site_settings_publicos");
  if (error) throw error;
  return (data ?? {}) as Record<string, any>;
}
