import { supabase } from "@/integrations/supabase/client";
import { createServerFn } from "@tanstack/react-start";

export const getAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select(`*, categorias (nome)`)
      .order("ordem", { ascending: true })
      .order("nome", { ascending: true }); // desempate por nome

    if (error) {
      console.error("Error fetching admin products:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error in getAdminProducts:", err);
    return [];
  }
});

export const getPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select(`*, categorias (nome, ordem_filtro)`)
      .eq("ativo", true)
      .eq("visivel_online", true)
      .order("categoria_id", { ascending: true }) // agrupa por categoria
      .order("ordem", { ascending: true }) // depois por ordem dentro da categoria
      .order("nome", { ascending: true }); // desempate por nome

    if (error) {
      console.error("Error fetching public products:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error in getPublicProducts:", err);
    return [];
  }
});

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
    return data;
  } catch (err) {
    console.error("Unexpected error in getCategories:", err);
    return [];
  }
});
