import { supabase } from "./src/integrations/supabase/client";

async function check() {
  const { data: categories, error: catError } = await supabase.from('categorias').select('*');
  console.log('Categories:', categories?.length || 0);
  console.log(categories);

  const { data: products, error: prodError } = await supabase.from('produtos').select('id, nome, imagem_url, categoria_id');
  console.log('Products:', products?.length || 0);
  console.log(products?.slice(0, 10));

  if (prodError) console.error('Prod error:', prodError);
  if (catError) console.error('Cat error:', catError);
}

check();
