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
      const regexCO = /CO(\d+)/i;
      
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

      const matchA_CO = a.nome.match(regexCO);
      const matchB_CO = b.nome.match(regexCO);
      
      if (matchA_CO && matchB_CO) {
        return parseInt(matchA_CO[1]) - parseInt(matchB_CO[1]);
      }
      
      // Order: TD, then SO, then CO
      if (matchA_TD) return -1;
      if (matchB_TD) return 1;
      if (matchA_SO) return -1;
      if (matchB_SO) return 1;
      if (matchA_CO) return -1;
      if (matchB_CO) return 1;
      
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
      .eq("ativo", true);

    if (error) throw error;

    return [...(data || [])].sort((a, b) => {
      const regexTD = /TD(\d+)/i;
      const regexSO = /SO(\d+)/i;
      const regexCO = /CO(\d+)/i;
      
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

      const matchA_CO = a.nome.match(regexCO);
      const matchB_CO = b.nome.match(regexCO);
      
      if (matchA_CO && matchB_CO) {
        return parseInt(matchA_CO[1]) - parseInt(matchB_CO[1]);
      }
      
      if (matchA_TD) return -1;
      if (matchB_TD) return 1;
      if (matchA_SO) return -1;
      if (matchB_SO) return 1;
      if (matchA_CO) return -1;
      if (matchB_CO) return 1;
      
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
