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
      const regexTD = /TD(\d+)/i;
      const regexSO = /SO(\d+)/i;
      
      const matchA_TD = a.nome.match(regexTD);
      const matchB_TD = b.nome.match(regexTD);
      
      if (matchA_TD && matchB_TD) {
        return parseInt(matchA_TD[1]) - parseInt(matchB_TD[1]);
      }
      
      const matchA_SO = a.nome.match(regexSO);
      const matchB_SO = b.nome.match(regexSO);
      
      if (matchA_SO && matchB_SO) {
        return parseInt(matchA_SO[1]) - parseInt(matchB_SO[1]);
      }
      
      // Keep TD at top, then SO
      if (matchA_TD) return -1;
      if (matchB_TD) return 1;
      if (matchA_SO) return -1;
      if (matchB_SO) return 1;
      
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
