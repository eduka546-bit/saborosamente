import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";

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
