import { supabase } from "@/integrations/supabase/client";
import { type User } from "@supabase/supabase-js";

/**
 * Hook ou helper para verificar se o usuário é admin.
 * Como o usuário não quer Lovable Cloud, usamos o cliente Supabase manual.
 */
export async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar permissão de admin:", error);
    return false;
  }

  return !!data;
}

export const auth = {
  async signOut() {
    return await supabase.auth.signOut();
  },

  async getUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
};
