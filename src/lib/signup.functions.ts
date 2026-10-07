import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";
import { sendPasswordChangedEmail } from "@/lib/resend-email";

const schema = z.object({
  cpf: z.string().regex(/^\d{11}$/),
});

export const checkCpfAlreadyRegistered = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof schema>) => schema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createServerClient();

    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("cpf", data.cpf);

    if (error) {
      console.error("[signup] erro ao verificar CPF:", error);
      throw new Error("Não foi possível validar o cadastro agora.");
    }

    return { exists: (count ?? 0) > 0 };
  });


const passwordChangedSchema = z.object({
  accessToken: z.string().min(20),
});

export const notifyPasswordChanged = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof passwordChangedSchema>) => passwordChangedSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(data.accessToken);

    if (error || !user?.email) {
      throw new Error("Sessão inválida para confirmar a alteração de senha.");
    }

    let nome = String(user.user_metadata?.nome ?? "");
    if (!nome) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .maybeSingle();
      nome = String(profile?.nome ?? "");
    }

    const sent = await sendPasswordChangedEmail({
      email: user.email,
      nome,
      userId: user.id,
      eventId: String(user.updated_at || Date.now()),
    });

    if (!sent.ok) {
      console.error("[auth-email] falha ao enviar aviso de senha alterada", sent);
    }

    return { ok: true };
  });
