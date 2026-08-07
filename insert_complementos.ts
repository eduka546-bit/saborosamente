
import { supabase } from "./src/integrations/supabase/client";

async function run() {
  const products = [
    { nome: "CO01 - Frango Desfiado 150g", preco: 15.00, categoria_nome: "Complementos de Proteínas 150g", descricao: "Frango desfiado suculento e temperado." },
    { nome: "CO02 - Frango Americano 150g", preco: 15.00, categoria_nome: "Complementos de Proteínas 150g", descricao: "Frango estilo americano, crocante por fora e macio por dentro." },
    { nome: "CO03 - Frango Ensopado 150g", preco: 15.00, categoria_nome: "Complementos de Proteínas 150g", descricao: "Frango ensopado com temperos naturais." },
    { nome: "CO04 - Tiras de Carne de Patinho 150g", preco: 18.00, categoria_nome: "Complementos de Proteínas 150g", descricao: "Tiras de carne de patinho grelhadas." },
    { nome: "CO05 - Carne Moída de Patinho à Bolonhesa 150g", preco: 18.00, categoria_nome: "Complementos de Proteínas 150g", descricao: "Carne moída de patinho com molho de tomate caseiro." },
    { nome: "CO06 - Carne de Panela 150g", preco: 18.00, categoria_nome: "Complementos de Proteínas 150g", descricao: "Carne de panela desfiando, cozida lentamente." }
  ];

  const { data: categories } = await supabase.from('categorias').select('id, nome');
  
  for (const p of products) {
    const cat = categories?.find(c => c.nome === p.categoria_nome);
    if (!cat) {
      console.log(`Categoria não encontrada: ${p.categoria_nome}`);
      continue;
    }

    const { error } = await supabase.from('produtos').insert({
      nome: p.nome,
      preco: p.preco,
      categoria_id: cat.id,
      descricao: p.descricao,
      status: 'ativo'
    });

    if (error) console.error(`Erro ao inserir ${p.nome}:`, error);
    else console.log(`Inserido: ${p.nome}`);
  }
}

run();
