import { supabase } from "./supabase/client";

export const seedInitialProducts = async () => {
  const products = [
    {
      nome: "Frango com Batata Doce",
      descricao:
        "Peito de frango grelhado em tiras, purê de batata doce e mix de legumes no vapor.",
      preco: 22.9,
      ingredientes: "Frango, batata doce, brócolis, cenoura, azeite, sal, ervas finas.",
      categoria: "Fitness",
      imagem: "/assets/product-1.jpg",
      destaque: true,
    },
    // Adicionar outros produtos conforme src/lib/products.ts
  ];

  const { error } = await supabase.from("produtos").insert(products);
  return { error };
};
