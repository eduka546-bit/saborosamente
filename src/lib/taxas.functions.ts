import { supabase } from "@/integrations/supabase/client";
import { createServerFn } from "@tanstack/react-start";

export const getTaxas = createServerFn({ method: "GET" })
  .handler(async () => {
    // Nota: Atualmente as taxas estão como mock no frontend. 
    // Em um cenário real, leríamos da tabela 'taxas_entrega'.
    // Vou retornar null para indicar que não há tabela ainda e o frontend deve usar o fallback.
    return null;
  });
