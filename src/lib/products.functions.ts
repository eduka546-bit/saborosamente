import { supabase } from "@/integrations/supabase/client";
import { createServerFn } from "@tanstack/react-start";

export const getAdminProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        *,
        categorias (
          nome
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const getPublicProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        *,
        categorias (
          nome
        )
      `)
      .eq("status", "ativo")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const getCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("nome");

    if (error) throw error;
    return data;
  });
