import { supabase } from "./src/integrations/supabase/client";

async function findCat() {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, slug")
    .or("slug.eq.sopas,nome.ilike.%SOPAS%");

  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(JSON.stringify(data));
}

findCat();
