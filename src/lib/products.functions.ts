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
      .order("nome", { ascending: true });

    if (error) throw error;
    
    // Sort logic to handle TD01, TD02, etc. properly
    return data.sort((a, b) => {
      const matchA = a.nome.match(/TD(\d+)/);
      const matchB = b.nome.match(/TD(\d+)/);
      
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      
      return a.nome.localeCompare(b.nome);
    });
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
      .order("nome", { ascending: true });

    if (error) throw error;

    return data.sort((a, b) => {
      const matchA = a.nome.match(/TD(\d+)/);
      const matchB = b.nome.match(/TD(\d+)/);
      
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      
      return a.nome.localeCompare(b.nome);
    });
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
