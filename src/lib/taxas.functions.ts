import { supabase } from "@/integrations/supabase/client";
import { createServerFn } from "@tanstack/react-start";

export const getTaxas = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("delivery_rates")
      .select("id, cidade, bairro, valor, ativo")
      .eq("ativo", true)
      .order("cidade")
      .order("bairro");

    if (error || !data || data.length === 0) return null;

    // Mapeia para o formato esperado pelo carrinho
    return data.map((r: any) => ({
      id: r.id,
      cidade: r.cidade,
      bairro: r.bairro,
      taxa: Number(r.valor ?? 0),
      ativo: r.ativo,
    }));
  });
