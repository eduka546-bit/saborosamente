import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/custos")({ component: CustosMargensPage, ssr: false });
const n = (v: unknown) => Number(v || 0);
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CustosMargensPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-custos-margens"],
    queryFn: async () => {
      const [prod, rec, itens, ings, preps, prepItens, embalagens] = await Promise.all([
        supabase.from("produtos").select("id,nome,tipo_produto,preco,preco_300g,preco_400g,ativo").in("tipo_produto", ["marmita", "sopa", "complemento"]).order("nome"),
        supabase.from("cozinha_receitas").select("id,produto_id"),
        supabase.from("cozinha_receita_itens").select("receita_id,ingrediente_id,preparacao_id,gramas_200,gramas_300,gramas_400,operacao_producao,fator_producao"),
        supabase.from("cozinha_ingredientes").select("id,nome,unidade_medida,custo_por_kg,custo_por_unidade"),
        supabase.from("cozinha_preparacoes").select("id,rendimento_final_g"),
        supabase.from("cozinha_preparacao_itens").select("preparacao_id,ingrediente_id,quantidade"),
        supabase.from("cozinha_embalagens").select("categoria,custo_unitario,ativo"),
      ]);
      for (const r of [prod, rec, itens, ings, preps, prepItens, embalagens]) if (r.error) throw r.error;
      const ingMap = new Map((ings.data ?? []).map((x: any) => [x.id, x]));
      const prepMap = new Map((preps.data ?? []).map((x: any) => [x.id, x]));
      const recByProduct = new Map((rec.data ?? []).map((x: any) => [x.produto_id, x.id]));
      const itensByRec = new Map<string, any[]>();
      (itens.data ?? []).forEach((x: any) => itensByRec.set(x.receita_id, [...(itensByRec.get(x.receita_id) || []), x]));
      const prepItensByPrep = new Map<string, any[]>();
      (prepItens.data ?? []).forEach((x: any) => prepItensByPrep.set(x.preparacao_id, [...(prepItensByPrep.get(x.preparacao_id) || []), x]));
      const custoIng = (id: string) => { const x: any = ingMap.get(id); return x?.unidade_medida === "un" ? n(x?.custo_por_unidade) : n(x?.custo_por_kg) / 1000; };
      const custoPrepG = (id: string) => { const p: any = prepMap.get(id); const rendimento = n(p?.rendimento_final_g); if (!(rendimento > 0)) return 0; const total = (prepItensByPrep.get(id) || []).reduce((s, x) => s + n(x.quantidade) * custoIng(x.ingrediente_id), 0); return total / rendimento; };
      const embalagem = (tipo: string, tam: string) => { const cat = tipo === "sopa" ? "sopa" : `marmita_${tam}`; const emb: any = (embalagens.data ?? []).find((x: any) => x.categoria === cat && x.ativo !== false); const etq: any = (embalagens.data ?? []).find((x: any) => x.categoria === "etiqueta" && x.ativo !== false); return n(emb?.custo_unitario) + n(etq?.custo_unitario); };
      const custoLinha = (x: any, tam: string) => { const base = n(x[`gramas_${tam}`]); const fator = n(x.fator_producao || 1); const qtd = x.operacao_producao === "acrescentar" ? base * (1 + fator) : x.operacao_producao === "dividir" && fator ? base / fator : base; return x.ingrediente_id ? qtd * custoIng(x.ingrediente_id) : x.preparacao_id ? qtd * custoPrepG(x.preparacao_id) : 0; };
      return (prod.data ?? []).map((p: any) => {
        const recId = recByProduct.get(p.id); const linhas = itensByRec.get(recId) || [];
        const tamanhos = p.tipo_produto === "sopa" ? ["400"] : ["200", "300", "400"];
        return { ...p, tamanhos: tamanhos.map((tam) => { const custo = linhas.reduce((s, x) => s + custoLinha(x, tam), 0) + embalagem(p.tipo_produto, tam); const preco = tam === "200" ? n(p.preco) : tam === "300" ? n(p.preco_300g || p.preco) : n(p.preco_400g || p.preco); const margem = preco > 0 ? ((preco - custo) / preco) * 100 : 0; return { tam, custo, preco, margem, lucro: preco - custo }; }) };
      });
    },
  });
  if (isLoading) return <div className="p-8 text-gray-500">Calculando custos e margens...</div>;
  if (error) return <div className="p-8 text-red-600">Não foi possível carregar os custos.</div>;
  const linhas = (data ?? []).flatMap((p: any) => p.tamanhos.map((t: any) => ({ nome: p.nome, ...t })));
  const margemMedia = linhas.length ? linhas.reduce((s: number, x: any) => s + x.margem, 0) / linhas.length : 0;
  return <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8">
    <div><h1 className="flex items-center gap-2 text-3xl font-black text-[#5850ec]"><DollarSign /> Custos e Margens</h1><p className="mt-1 text-sm text-gray-500">Custo técnico da cozinha + embalagem + etiqueta comparado com o preço de venda cadastrado.</p></div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase text-gray-400">Produtos analisados</p><p className="mt-1 text-2xl font-black">{data?.length ?? 0}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase text-gray-400">Variações calculadas</p><p className="mt-1 text-2xl font-black">{linhas.length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase text-gray-400">Margem bruta média</p><p className="mt-1 text-2xl font-black text-emerald-600">{margemMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</p></div></div>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Tamanho</th><th className="px-4 py-3 text-right">Custo</th><th className="px-4 py-3 text-right">Venda</th><th className="px-4 py-3 text-right">Lucro bruto</th><th className="px-4 py-3 text-right">Margem</th></tr></thead><tbody>{linhas.map((x: any) => <tr key={`${x.nome}-${x.tam}`} className="border-t"><td className="px-4 py-3 font-semibold">{x.nome}</td><td className="px-4 py-3">{x.tam} g</td><td className="px-4 py-3 text-right">{brl(x.custo)}</td><td className="px-4 py-3 text-right">{brl(x.preco)}</td><td className={`px-4 py-3 text-right font-bold ${x.lucro < 0 ? "text-red-600" : "text-emerald-600"}`}>{brl(x.lucro)}</td><td className={`px-4 py-3 text-right font-black ${x.margem < 30 ? "text-red-600" : x.margem < 45 ? "text-amber-600" : "text-emerald-600"}`}>{x.margem.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</td></tr>)}</tbody></table></div></div>
    <p className="text-xs text-gray-400">Margem bruta estimada: não inclui despesas fixas, taxas de pagamento, impostos, entrega ou mão de obra. Alterações nos custos dos ingredientes e embalagens refletem neste relatório.</p>
  </div>;
}
