import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Assume service role key is available if we were doing seeds before, or try anon if policies allow

// Let's check if we have the service role key. Usually in these environments it is or we use a privileged client.
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const getCatId = async (slug: string) => {
    const { data } = await supabase.from("categorias").select("id").eq("slug", slug).single();
    return data?.id;
  };

  const catRefeicoes = await getCatId("linha-refeicoes");
  const catSopas = await getCatId("sopas");
  const catCombos = await getCatId("combos-prontos");
  const catProteinas = await getCatId("complementos-proteinas");

  if (!catRefeicoes || !catSopas || !catCombos || !catProteinas) {
    console.error("Missing category IDs");
    return;
  }

  const products = [
    {
      nome: "TD03 - Iscas de Frango com Creme de Milho e Arroz Branco",
      preco: 23.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp",
      status: "ativo",
      peso: "300g",
      categoria: "Refeições",
    },
    {
      nome: "TD04 - Strogonoff de Frango com Arroz e Batata Palha",
      preco: 24.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp",
      status: "ativo",
      peso: "300g",
      categoria: "Refeições",
    },
    {
      nome: "TD05 - Espaguete à Bolonhesa",
      preco: 22.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp",
      status: "ativo",
      peso: "300g",
      categoria: "Refeições",
    },
    {
      nome: "TD06 - Escondidinho de Frango com Mandioca",
      preco: 23.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp",
      status: "ativo",
      peso: "300g",
      categoria: "Refeições",
    },
    {
      nome: "TD07 - Feijoada Light com Arroz e Couve",
      preco: 26.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp",
      status: "ativo",
      peso: "350g",
      categoria: "Refeições",
    },
    {
      nome: "TD08 - Nhoque de Batata Doce com Molho de Tomate",
      preco: 21.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp",
      status: "ativo",
      peso: "300g",
      categoria: "Refeições",
    },
    {
      nome: "TD09 - Panqueca de Carne com Arroz e Feijão",
      preco: 25.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp",
      status: "ativo",
      peso: "350g",
      categoria: "Refeições",
    },
    {
      nome: "TD10 - Salmão Grelhado com Arroz de Coco e Castanhas",
      preco: 38.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp",
      status: "ativo",
      peso: "300g",
      categoria: "Refeições",
    },
    {
      nome: "Sopa de Mandioquinha com Frango",
      preco: 19.9,
      categoria_id: catSopas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp",
      status: "ativo",
      peso: "400g",
      categoria: "Sopas",
    },
    {
      nome: "Caldo Verde com Paio",
      preco: 19.9,
      categoria_id: catSopas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp",
      status: "ativo",
      peso: "400g",
      categoria: "Sopas",
    },
    {
      nome: "Canja de Galinha",
      preco: 17.9,
      categoria_id: catSopas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp",
      status: "ativo",
      peso: "400g",
      categoria: "Sopas",
    },
    {
      nome: "Sopa de Legumes com Carne",
      preco: 19.9,
      categoria_id: catSopas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp",
      status: "ativo",
      peso: "400g",
      categoria: "Sopas",
    },
    {
      nome: "Sopa de Abóbora com Gengibre",
      preco: 17.9,
      categoria_id: catSopas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp",
      status: "ativo",
      peso: "400g",
      categoria: "Sopas",
    },
    {
      nome: "Combo 07 Marmitas Fit",
      preco: 159.0,
      categoria_id: catCombos,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp",
      status: "ativo",
      peso: "Variado",
      categoria: "Combos",
    },
    {
      nome: "Combo 15 Marmitas Econômico",
      preco: 315.0,
      categoria_id: catCombos,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp",
      status: "ativo",
      peso: "Variado",
      categoria: "Combos",
    },
    {
      nome: "Combo Detox 3 Dias",
      preco: 89.0,
      categoria_id: catCombos,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp",
      status: "ativo",
      peso: "Variado",
      categoria: "Combos",
    },
    {
      nome: "Patinho Moído 150g",
      preco: 16.9,
      categoria_id: catProteinas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp",
      status: "ativo",
      peso: "150g",
      categoria: "Proteínas",
    },
    {
      nome: "Iscas de Frango Grelhadas 150g",
      preco: 14.9,
      categoria_id: catProteinas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp",
      status: "ativo",
      peso: "150g",
      categoria: "Proteínas",
    },
    {
      nome: "Sobrecoxa Desossada Assada 150g",
      preco: 15.9,
      categoria_id: catProteinas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp",
      status: "ativo",
      peso: "150g",
      categoria: "Proteínas",
    },
  ];

  const { data, error } = await supabase.from("produtos").upsert(products, { onConflict: "nome" });

  if (error) {
    console.error("Error inserting products:", error);
  } else {
    console.log("Successfully inserted remaining products");
  }
}

run();
