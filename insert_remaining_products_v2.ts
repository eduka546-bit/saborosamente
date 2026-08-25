import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

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
    console.error("Missing category IDs - make sure you ran the category migration");
    return;
  }

  const products = [
    {
      nome: "TD01 - Tiras de Alcatra ao Molho Madeira e Arroz com Brócolis",
      preco: 26.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp",
      status: "ativo",
      peso: "300g",
    },
    {
      nome: "TD02 - Patinho Moído com Purê de Mandioquinha",
      preco: 24.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp",
      status: "ativo",
      peso: "300g",
    },
    {
      nome: "TD03 - Iscas de Frango com Creme de Milho e Arroz Branco",
      preco: 23.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp",
      status: "ativo",
      peso: "300g",
    },
    {
      nome: "TD04 - Strogonoff de Frango com Arroz e Batata Palha",
      preco: 24.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp",
      status: "ativo",
      peso: "300g",
    },
    {
      nome: "TD05 - Espaguete à Bolonhesa",
      preco: 22.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024042838.webp",
      status: "ativo",
      peso: "300g",
    },
    {
      nome: "TD06 - Escondidinho de Frango com Mandioca",
      preco: 23.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp",
      status: "ativo",
      peso: "300g",
    },
    {
      nome: "TD07 - Feijoada Light com Arroz e Couve",
      preco: 26.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp",
      status: "ativo",
      peso: "350g",
    },
    {
      nome: "Sopa de Lentilha com Bacon",
      preco: 18.9,
      categoria_id: catSopas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp",
      status: "ativo",
      peso: "400g",
    },
    {
      nome: "Sopa de Mandioquinha com Frango",
      preco: 19.9,
      categoria_id: catSopas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043510.webp",
      status: "ativo",
      peso: "400g",
    },
    {
      nome: "Combo 10 Marmitas Variadas",
      preco: 239.0,
      categoria_id: catCombos,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044022.webp",
      status: "ativo",
      peso: "Variado",
    },
    {
      nome: "Peito de Frango Grelhado 150g",
      preco: 15.0,
      categoria_id: catProteinas,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024044533.webp",
      status: "ativo",
      peso: "150g",
    },
    {
      nome: "Patinho Moído com Arroz Integral e Mix de Legumes",
      preco: 25.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043012.webp",
      status: "ativo",
      peso: "300g",
    },
    {
      nome: "Iscas de Frango Grelhado com Arroz de Brócolis e Purê de Batata",
      preco: 24.9,
      categoria_id: catRefeicoes,
      imagem_url:
        "https://pd-clientes-all.s3.us-west-2.amazonaws.com/cdn.anabolicfoodsbs/upload/produto_14102024043255.webp",
      status: "ativo",
      peso: "300g",
    },
  ];

  console.log("Este script gera o SQL final para o usuário rodar no painel.");
  console.log("Copie o conteúdo abaixo:");
}

run();
