
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!; // Note: Using anon key, hope RLS allows insert for admin or I should use service role if I had it.
// Actually, I'll try to find if there's a service role key in .env
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: categories } = await supabase.from('categorias').select('*');
  console.log('Categorias:', JSON.stringify(categories, null, 2));

  const targetCategory = categories?.find(c => c.nome.toUpperCase() === 'COMPLEMENTOS DE PROTEÍNAS 150G');
  if (!targetCategory) {
    console.error('Categoria "COMPLEMENTOS DE PROTEÍNAS 150G" não encontrada.');
    console.log('Categorias disponíveis:', categories?.map(c => c.nome));
    return;
  }

  const products = [
    { nome: "CO01 - Frango Desfiado 150g", preco: 15.00, descricao: "Frango desfiado suculento e temperado." },
    { nome: "CO02 - Frango Americano 150g", preco: 15.00, descricao: "Frango estilo americano, crocante por fora e macio por dentro." },
    { nome: "CO03 - Frango Ensopado 150g", preco: 15.00, descricao: "Frango ensopado com temperos naturais." },
    { nome: "CO04 - Tiras de Carne de Patinho 150g", preco: 18.00, descricao: "Tiras de carne de patinho grelhadas." },
    { nome: "CO05 - Carne Moída de Patinho à Bolonhesa 150g", preco: 18.00, descricao: "Carne moída de patinho com molho de tomate caseiro." },
    { nome: "CO06 - Carne de Panela 150g", preco: 18.00, descricao: "Carne de panela desfiando, cozida lentamente." }
  ];

  for (const p of products) {
    const { data, error } = await supabase.from('produtos').insert({
      nome: p.nome,
      preco: p.preco,
      categoria_id: targetCategory.id,
      descricao: p.descricao,
      status: 'ativo'
    }).select();

    if (error) console.error(`Erro ao inserir ${p.nome}:`, error);
    else console.log(`Inserido: ${p.nome}`, data);
  }
}

run();
