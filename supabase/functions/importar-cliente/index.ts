/**
 * importar-cliente
 *
 * Cria um usuário no auth.users com senha aleatória forte e upsert no profiles.
 * Só pode ser chamada por admins autenticados (via Authorization com anon key +
 * validação de role dentro da função).
 *
 * Body: { email, cpf, nome, telefone?, bairro?, cidade? }
 * Resposta: { ok: true, created: true/false (false = já existia) }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Normaliza CPF: mantém só dígitos.
function soDigitos(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Valida que o chamador é um admin autenticado.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Não autorizado." }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Verifica o usuário chamador via anon client.
  const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? token, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user: caller }, error: callerErr } = await anonClient.auth.getUser();
  if (callerErr || !caller) {
    return new Response(JSON.stringify({ error: "Token inválido." }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Confirma que é admin.
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Apenas admins podem importar clientes." }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const email: string = (body.email ?? "").trim().toLowerCase();
    const cpf: string = soDigitos(body.cpf ?? "");
    const nome: string = (body.nome ?? "").trim();
    const telefone: string = (body.telefone ?? "").trim();
    const bairro: string = (body.bairro ?? "").trim();
    const cidade: string = (body.cidade ?? "").trim();

    if (!email || !cpf) {
      return new Response(
        JSON.stringify({ error: "email e cpf são obrigatórios." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Nunca usamos CPF como senha. O cliente importado recebe uma senha aleatória
    // desconhecida e, no primeiro acesso, usa "Esqueci minha senha" para defini-la.
    const senhaTemporaria = `${crypto.randomUUID()}-Aa9!${crypto.randomUUID()}`;

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
      user_metadata: {
        nome,
        cpf,
        telefone,
        bairro,
        cidade,
        importado_prefiro: true,
        deve_definir_senha: true,
      },
    });

    if (createErr) {
      // Usuário já existe — tenta encontrar e só atualizar o profile.
      if (
        createErr.message?.toLowerCase().includes("already") ||
        createErr.message?.toLowerCase().includes("email address") ||
        createErr.code === "email_exists"
      ) {
        // Busca o user_id pelo email via profiles ou admin list.
        const { data: profileExist } = await supabase
          .from("profiles")
          .select("id")
          .eq("cpf", cpf)
          .maybeSingle();

        if (profileExist) {
          // Já existe tudo — só garante que dados estão atualizados.
          await supabase
            .from("profiles")
            .update({ nome: nome || undefined, telefone: telefone || undefined, bairro: bairro || undefined, cidade: cidade || undefined })
            .eq("id", profileExist.id);
        }
        return new Response(
          JSON.stringify({ ok: true, created: false, msg: "Usuário já existia." }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      throw createErr;
    }

    const userId = created.user?.id;
    if (!userId) throw new Error("Usuário criado sem ID.");

    // Cria/atualiza o profile.
    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        nome: nome || null,
        cpf: cpf || null,
        telefone: telefone || null,
        bairro: bairro || null,
        cidade: cidade || null,
      },
      { onConflict: "id" },
    );
    if (profileErr) {
      // Profile já existe com outro conflito (cpf duplicado): pode ser import duplicado.
      console.warn("Profile upsert warning:", profileErr.message);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        created: true,
        userId,
        msg: "Cliente importado. No primeiro acesso, deve usar a recuperação de senha.",
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e: any) {
    console.error("importar-cliente erro:", e?.message);
    return new Response(
      JSON.stringify({ error: e?.message ?? "Erro interno." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
