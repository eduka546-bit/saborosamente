import { supabase } from "./src/integrations/supabase/client";

async function run() {
  const { data: products } = await supabase.from('produtos').select('id, nome');
  
  if (!products) return;

  const updates = products.map(p => {
    let img = "";
    if (p.nome.includes("Combo")) {
        img = "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp";
    } else if (p.nome.includes("Sopa") || p.nome.includes("Caldo") || p.nome.includes("Canja")) {
        img = "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp";
    } else if (p.nome.includes("150g")) {
        img = "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp";
    } else if (p.nome.includes("TD01") || p.nome.includes("TD05")) {
        img = "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp";
    } else if (p.nome.includes("TD02") || p.nome.includes("TD07") || p.nome.includes("TD08") || p.nome.includes("TD09") || p.nome.includes("TD10")) {
        img = "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp";
    } else {
        img = "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp";
    }
    return { id: p.id, imagem_url: img };
  });

  // Since we can't bulk update easily with anon key due to RLS, we'd need to do it one by one or fix the RLS.
  // But wait, if RLS allows anon to select, does it allow anon to update? Probably not.
  console.log("Planned updates:", updates.length);
}

run();
