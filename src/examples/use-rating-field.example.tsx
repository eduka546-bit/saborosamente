/**
 * Exemplos de como usar o novo campo `rating` na tabela `produtos`
 *
 * Este arquivo é apenas para referência. Copie os padrões para seu código.
 */

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ============================================================================
// 1. ATUALIZAR SCHEMAS ZOD
// ============================================================================

// Schema base para validação de rating
export const ratingSchema = z.number().min(3.5).max(5.0);

// Schema completo do produto com rating
export const produtoComRatingSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  preco: z.number().positive(),
  rating: ratingSchema.optional(), // Rating é opcional pois tem default 5.0
  criado_em: z.string().datetime(),
  atualizado_em: z.string().datetime(),
});

export type ProdutoComRating = z.infer<typeof produtoComRatingSchema>;

// ============================================================================
// 2. EXEMPLOS DE QUERIES COM RATING
// ============================================================================

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || "",
);

// Exemplo 1: Buscar produtos ordenados por rating (melhor primeiro)
export async function getProdutosOrdernadorPorRating() {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, preco, rating")
    .order("rating", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

// Exemplo 2: Filtrar apenas produtos bem avaliados
export async function getProdutosComBomRating(minimo: number = 4.5) {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, preco, rating")
    .gte("rating", minimo)
    .order("rating", { ascending: false });

  if (error) throw error;
  return data;
}

// Exemplo 3: Atualizar rating de um produto
export async function atualizarRatingProduto(produtoId: string, novoRating: number) {
  // Validar que o rating está no intervalo permitido
  const validatedRating = ratingSchema.parse(novoRating);

  const { data, error } = await supabase
    .from("produtos")
    .update({ rating: validatedRating })
    .eq("id", produtoId)
    .select("id, nome, rating")
    .single();

  if (error) throw error;
  return data;
}

// Exemplo 4: Buscar estatísticas de ratings
export async function obterEstatisticasRating() {
  const { data, error } = await supabase.rpc("get_rating_stats"); // Você precisaria criar essa função SQL

  if (error) {
    // Fallback: calcular manualmente
    const { data: produtos } = await supabase.from("produtos").select("rating");

    if (produtos && produtos.length > 0) {
      const ratings = produtos.filter((p) => p.rating).map((p) => p.rating);
      const media = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const minimo = Math.min(...ratings);
      const maximo = Math.max(...ratings);

      return {
        total: ratings.length,
        media: parseFloat(media.toFixed(1)),
        minimo,
        maximo,
      };
    }
  }

  return error ? null : data;
}

// Exemplo 5: Buscar produtos por faixa de rating
export async function getProdutosPorFaixaRating(min: number, max: number) {
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, preco, rating")
    .gte("rating", min)
    .lte("rating", max)
    .order("rating", { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================================================
// 3. EXEMPLOS DE USO EM COMPONENTES REACT
// ============================================================================

export function RatingDisplay({ rating }: { rating?: number | null }) {
  if (!rating) return <span className="text-gray-400">Sem avaliação</span>;

  const stars = Math.round(rating);
  const decimals = (rating % 1).toFixed(1);

  return (
    <span className="flex items-center gap-2">
      <span className="text-lg">{"⭐".repeat(Math.floor(rating))}</span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
    </span>
  );
}

// Exemplo de componente para atualizar rating
export function RatingInput({
  currentRating = 5.0,
  onChange,
}: {
  currentRating?: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-2">
      <label htmlFor="rating">Avaliação:</label>
      <input
        id="rating"
        type="number"
        min="3.5"
        max="5.0"
        step="0.1"
        value={currentRating}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="border rounded px-2 py-1 w-20"
      />
      <span className="text-sm text-gray-500">(3.5 - 5.0)</span>
    </div>
  );
}

// ============================================================================
// 4. EXEMPLO DE USO COMPLETO
// ============================================================================

export async function exemploCompleto() {
  try {
    // 1. Buscar produtos com melhor rating
    console.log("📊 Produtos melhor avaliados:");
    const melhoresAvaliados = await getProdutosOrdernadorPorRating();
    melhoresAvaliados.forEach((p: any) => {
      console.log(`  - ${p.nome}: ⭐ ${p.rating}`);
    });

    // 2. Buscar produtos bem avaliados (>= 4.5)
    console.log("\n⭐ Produtos com rating >= 4.5:");
    const bomRating = await getProdutosComBomRating(4.5);
    console.log(`  Total: ${bomRating.length} produtos`);

    // 3. Buscar estatísticas
    console.log("\n📈 Estatísticas de ratings:");
    const stats = await obterEstatisticasRating();
    if (stats) {
      console.log(`  Média: ${stats.media}`);
      console.log(`  Mínimo: ${stats.minimo}`);
      console.log(`  Máximo: ${stats.maximo}`);
    }

    // 4. Atualizar um rating (exemplo)
    if (melhoresAvaliados.length > 0) {
      const primeiroProduto = melhoresAvaliados[0];
      console.log(`\n✏️  Atualizando rating de "${primeiroProduto.nome}" para 4.8`);
      const atualizado = await atualizarRatingProduto(primeiroProduto.id, 4.8);
      console.log(`  Novo rating: ⭐ ${atualizado.rating}`);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

// ============================================================================
// 5. DICAS E PADRÕES
// ============================================================================

/**
 * DICAS IMPORTANTES:
 *
 * 1. SEMPRE validar ratings antes de atualizar:
 *    - Use o schema Zod: ratingSchema.parse(valor)
 *    - Ou verifique manualmente: valor >= 3.5 && valor <= 5.0
 *
 * 2. SEMPRE incluir rating nas queries SELECT:
 *    - .select('id, nome, preco, rating')
 *
 * 3. USAR o índice em queries de filtro/ordenação:
 *    - order('rating', { ascending: false })
 *    - .gte('rating', 4.5)
 *
 * 4. Rating é opcional (pode ser NULL):
 *    - Produtos novos herdam o default 5.0
 *    - Trate null na UI com RatingDisplay component
 *
 * 5. Performance:
 *    - Use o índice idx_produtos_rating para queries otimizadas
 *    - Evite ordenações sem WHERE quando houver muitos registros
 */

export const padroes = {
  // Padrão: Query com rating
  queryComRating: `
    SELECT id, nome, preco, rating 
    FROM produtos 
    WHERE rating >= 4.5 
    ORDER BY rating DESC
  `,

  // Padrão: Atualizar rating
  atualizarRating: `
    UPDATE produtos 
    SET rating = $1 
    WHERE id = $2 
    AND rating >= 3.5 AND rating <= 5.0
  `,

  // Padrão: Estatísticas
  estatisticas: `
    SELECT 
      COUNT(*) as total,
      AVG(rating) as media,
      MIN(rating) as minimo,
      MAX(rating) as maximo,
      STDDEV(rating) as desvio_padrao
    FROM produtos
  `,
};
