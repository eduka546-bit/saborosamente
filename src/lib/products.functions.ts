import { withDisplayIngredients } from "@/lib/product-display-ingredients";
import { supabase } from "@/integrations/supabase/client";

export async function getAdminProducts() {
  try {
    const { data, error } = await supabase.rpc("admin_produtos_completos");

    if (error) {
      console.error("Error fetching admin products:", error);
      return [];
    }

    return (data as any[]) || [];
  } catch (err) {
    console.error("Unexpected error in getAdminProducts:", err);
    return [];
  }
}

export async function getPublicProducts() {
  try {
    const { data, error } = await supabase.rpc("produtos_publicos");

    if (error) {
      console.error("Error fetching public products:", error);
      return [];
    }

    return ((data as any[]) || []).map(withDisplayIngredients);
  } catch (err) {
    console.error("Unexpected error in getPublicProducts:", err);
    return [];
  }
}

export async function getProductSummaries(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))].slice(0, 100);
  if (!uniqueIds.length) return [];

  const { data, error } = await supabase.rpc("produtos_resumo", {
    p_ids: uniqueIds,
  });
  if (error) throw error;
  return ((data as any[]) || []).map(withDisplayIngredients);
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Unexpected error in getCategories:", err);
    return [];
  }
}
