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
      `);

    if (error) throw error;
    
    // Custom sort to handle TD01, TD02... TD28 correctly
    return [...(data || [])].sort((a, b) => {
      const regex = /TD(\d+)/i;
      const matchA = a.nome.match(regex);
      const matchB = b.nome.match(regex);
      
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      
      // If only one has TD, TD comes first
      if (matchA) return -1;
      if (matchB) return 1;
      
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
      .eq("status", "ativo");

    if (error) throw error;

    return [...(data || [])].sort((a, b) => {
      const regex = /TD(\d+)/i;
      const matchA = a.nome.match(regex);
      const matchB = b.nome.match(regex);
      
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      
      if (matchA) return -1;
      if (matchB) return 1;
      
      return a.nome.localeCompare(b.nome);
    });
  });

export const getCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) throw error;
    return data;
  });
