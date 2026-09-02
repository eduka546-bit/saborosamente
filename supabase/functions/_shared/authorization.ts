import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.0";

export type PrivilegedCaller = "admin" | "service_role";

export type AuthorizationResult =
  | { ok: true; caller: PrivilegedCaller; userId?: string }
  | { ok: false; status: 401 | 403; message: string };

function getBearerToken(req: Request): string {
  const header = req.headers.get("Authorization") ?? "";
  return header.replace(/^Bearer\s+/i, "").trim();
}

/**
 * Autoriza chamadas administrativas e chamadas internas com service_role.
 * verify_jwt sozinho apenas valida o JWT; ele não garante que o usuário é admin.
 */
export async function authorizeAdminOrService(req: Request): Promise<AuthorizationResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const token = getBearerToken(req);

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Supabase auth environment is incomplete");
    return { ok: false, status: 401, message: "Não autorizado" };
  }

  if (token && token === serviceRoleKey) {
    return { ok: true, caller: "service_role" };
  }

  if (!token) {
    return { ok: false, status: 401, message: "Autenticação obrigatória" };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return { ok: false, status: 401, message: "Sessão inválida" };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: role, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) console.error("Admin role lookup failed:", roleError.message);
  if (!role) return { ok: false, status: 403, message: "Acesso restrito a administradores" };

  return { ok: true, caller: "admin", userId: user.id };
}

export function authorizationError(
  result: Extract<AuthorizationResult, { ok: false }>,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: result.message }), {
    status: result.status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
