import { supabase } from "@/integrations/supabase/client";

/**
 * Mantém o campo público `produtos.ingredientes` sincronizado com a ficha técnica.
 * Somente nomes normalizados são publicados: marcas, custos e informações internas
 * da cozinha nunca entram no texto enviado à loja.
 */
export async function sincronizarIngredientesProduto(produtoId: string, receitaId: string) {
  const { data: itens, error: itensError } = await supabase
    .from("cozinha_receita_itens")
    .select("ingrediente_id, preparacao_id, ordem")
    .eq("receita_id", receitaId)
    .order("ordem");
  if (itensError) throw itensError;

  const ingredienteIds = new Set<string>();
  const preparacaoIds = new Set<string>();
  (itens ?? []).forEach((item: any) => {
    if (item.ingrediente_id) ingredienteIds.add(item.ingrediente_id);
    if (item.preparacao_id) preparacaoIds.add(item.preparacao_id);
  });

  const [ingredientesResult, preparacoesResult] = await Promise.all([
    ingredienteIds.size
      ? supabase.from("cozinha_ingredientes").select("id,nome,ativo").in("id", [...ingredienteIds])
      : Promise.resolve({ data: [], error: null } as any),
    preparacaoIds.size
      ? supabase.from("cozinha_preparacao_itens").select("ingrediente_id,preparacao_id,ordem").in("preparacao_id", [...preparacaoIds]).order("ordem")
      : Promise.resolve({ data: [], error: null } as any),
  ]);
  if (ingredientesResult.error) throw ingredientesResult.error;
  if (preparacoesResult.error) throw preparacoesResult.error;

  const prepItens = preparacoesResult.data ?? [];
  const prepIngredientIds = new Set<string>(
    prepItens.map((item: any) => item.ingrediente_id).filter(Boolean),
  );

  const faltantes = [...prepIngredientIds].filter((id) => !ingredienteIds.has(id));
  let extras: any[] = [];
  if (faltantes.length) {
    const { data, error } = await supabase
      .from("cozinha_ingredientes")
      .select("id,nome,ativo")
      .in("id", faltantes);
    if (error) throw error;
    extras = data ?? [];
  }

  const porId = new Map<string, any>([
    ...(ingredientesResult.data ?? []).map((x: any) => [x.id, x]),
    ...extras.map((x: any) => [x.id, x]),
  ]);

  const nomes: string[] = [];
  const adicionar = (id: string) => {
    const item = porId.get(id);
    const nome = String(item?.nome ?? "").trim();
    if (!nome || item?.ativo === false) return;
    if (!nomes.some((x) => x.localeCompare(nome, "pt-BR", { sensitivity: "base" }) === 0)) {
      nomes.push(nome);
    }
  };

  // Ingredientes diretamente usados na ficha.
  (itens ?? []).forEach((item: any) => {
    if (item.ingrediente_id) adicionar(item.ingrediente_id);
  });
  // Ingredientes que entram através de molhos, purês e demais preparações.
  prepItens.forEach((item: any) => adicionar(item.ingrediente_id));

  const texto = nomes.join(", ");
  const { error: updateError } = await supabase
    .from("produtos")
    .update({ ingredientes: texto, updated_at: new Date().toISOString() })
    .eq("id", produtoId);
  if (updateError) throw updateError;

  return texto;
}
